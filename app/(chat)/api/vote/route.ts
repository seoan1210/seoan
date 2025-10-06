import { auth } from '@/app/(auth)/auth';
import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId가 필요합니다.', { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new Response('채팅을 찾을 수 없습니다.', { status: 404 });
  }

  if (chat.userId !== session.user.id) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new Response('chatId, messageId, 그리고 type이 모두 필요합니다.', { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new Response('채팅을 찾을 수 없습니다.', { status: 404 });
  }

  if (chat.userId !== session.user.id) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  await voteMessage({
    chatId,
    messageId,
    type: type,
  });

  return new Response('메시지에 투표했습니다.', { status: 200 });
}
