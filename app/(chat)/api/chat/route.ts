import {
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new Response('유효하지 않은 요청 본문입니다.', { status: 400 });
  }

  try {
    const { id, message, selectedChatModel } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new Response('인증되지 않았습니다.', { status: 401 });
    }

    const userType: UserType = session.user.type;

    // ⭐️ 참고: getMessageCountByUserId도 regularUserId를 사용하도록 queries.ts에서 수정했어.
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new Response(
        '일일 최대 메시지 수를 초과했습니다! 잠시 후 다시 시도해 주세요.',
        {
          status: 429,
        },
      );
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      // ⭐️ 수정된 부분: saveChat에 isGuest: false 추가 (로그인 사용자이므로)
      await saveChat({ 
        id, 
        userId: session.user.id, 
        isGuest: false, 
        title 
      });
      
    } else {
      // ⭐️ 참고: chat.userId가 chat.regularUserId인지 chat.guestUserId인지
      // 이 로직에서 명확하지 않으므로, chat 객체에 접근 권한을 판단하는
      // isOwnedBy 함수를 만들어 쓰는 게 더 안전해. 
      // 현재는 chat.regularUserId만 session.user.id와 비교한다고 가정합니다.
      if (chat.userId !== session.user.id) {
        return new Response('접근이 금지되었습니다.', { status: 403 });
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('어시스턴트 메시지를 찾을 수 없습니다!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('채팅 저장에 실패했습니다.');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return '앗, 오류가 발생했습니다!';
      },
    });
  } catch (_) {
    return new Response('요청을 처리하는 중에 오류가 발생했습니다!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('찾을 수 없습니다.', { status: 404 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    // ⭐️ 참고: chat.userId는 이제 regularUserId 또는 guestUserId 중 하나여야 합니다.
    // 기존 코드에서는 userId 하나로만 체크하지만, 새로운 스키마에서는
    // chat.regularUserId === session.user.id 로 체크하는 것이 정확합니다.
    if (chat.userId !== session.user.id) { 
      return new Response('접근이 금지되었습니다.', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    return new Response('요청을 처리하는 중에 오류가 발생했습니다!', {
      status: 500,
    });
  }
}
