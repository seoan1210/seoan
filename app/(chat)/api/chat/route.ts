// app/(chat)/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMessagesByChatId } from '@/lib/db/messages';
import { appendClientMessage } from '@/lib/ai/messageUtils';
import { geolocation } from '@/lib/ai/geolocation';
import { RequestHints, systemPrompt } from '@/lib/ai/prompts';
import { getWeather } from '@/lib/ai/tools/weather';
import { searchWeb } from '@/lib/ai/tools/search-web';
import { createDocument } from '@/lib/ai/artifacts/createDocument';
import { updateDocument } from '@/lib/ai/artifacts/updateDocument';
import { requestSuggestions } from '@/lib/ai/artifacts/requestSuggestions';

type MessageRole = 'user' | 'assistant' | 'system' | 'data';

interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  parts: unknown;
  attachments: unknown;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { id, message } = await request.json();

    // 1. DB에서 이전 메시지 가져오기
    const previousMessagesRaw = await getMessagesByChatId({ id });

    // 2. DB raw 메시지를 Message 타입으로 변환
    const previousMessages: Message[] = previousMessagesRaw.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      role: ['user', 'assistant', 'system', 'data'].includes(msg.role)
        ? (msg.role as MessageRole)
        : 'user', // 안전하게 기본값 처리
      content: Array.isArray(msg.parts)
        ? msg.parts.join('')
        : String(msg.parts ?? ''),
      parts: msg.parts,
      attachments: msg.attachments ?? {},
      createdAt: msg.createdAt,
    }));

    // 3. 클라이언트 메시지 추가
    const messages = appendClientMessage({ messages: previousMessages, message });

    // 4. 요청자의 위치 정보 가져오기
    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };

    // 5. 시스템 프롬프트 설정
    const systemContent = systemPrompt({
      selectedChatModel: 'chat-model-default',
      requestHints,
    });

    // 6. 도구 목록
    const tools = {
      getWeather,
      searchWeb, // 검색 도구 추가
      createDocument: createDocument({ session: null, dataStream: null }),
      updateDocument: updateDocument({ session: null, dataStream: null }),
      requestSuggestions: requestSuggestions({ session: null, dataStream: null }),
    };

    // 7. AI 처리 (예시: OpenAI 호출)
    const aiResponse = await tools.searchWeb({ query: message.content }); // 여기서는 searchWeb 예시 사용

    return NextResponse.json({
      messages: [...messages, aiResponse],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}