import 'server-only';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  user,
  chat,
  document,
  message,
  suggestion,
  vote,
  type User,
  type Chat,
  type DBMessage,
  type Suggestion,
} from './schema';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// ────────────────────────────────────────────────
// USERS
// ────────────────────────────────────────────────
export async function getUser(email: string): Promise<Array<User>> {
  return await db.select().from(user).where(eq(user.email, email));
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);
  return await db.insert(user).values({ email, password: hashedPassword });
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());
  return await db.insert(user).values({ email, password }).returning({
    id: user.id,
    email: user.email,
  });
}

// ────────────────────────────────────────────────
// CHATS
// ────────────────────────────────────────────────

// ✅ 게스트는 DB에 채팅 저장 안 함
export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const [u] = await db.select().from(user).where(eq(user.id, userId));
  if (u?.email.startsWith('guest-')) {
    console.log('Guest user — skipping chat save');
    return;
  }

  return await db.insert(chat).values({
    id,
    createdAt: new Date(),
    userId,
    title,
  });
}

export async function getChatById({ id }: { id: string }) {
  const [found] = await db.select().from(chat).where(eq(chat.id, id));
  return found;
}

export async function updateChatVisiblityById({
  id,
  visible,
}: {
  id: string;
  visible: boolean;
}) {
  return await db.update(chat).set({ visible }).where(eq(chat.id, id));
}

export async function deleteChatById({ id }: { id: string }) {
  await db.delete(vote).where(eq(vote.chatId, id));
  await db.delete(message).where(eq(message.chatId, id));
  const [deleted] = await db.delete(chat).where(eq(chat.id, id)).returning();
  return deleted;
}

// ────────────────────────────────────────────────
// MESSAGES
// ────────────────────────────────────────────────

// ✅ 게스트는 DB에 메시지 저장 안 함
export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  if (!messages.length) return;

  const [u] = await db.select().from(user).where(eq(user.id, messages[0].userId));
  if (u?.email.startsWith('guest-')) {
    console.log('Guest user — skipping message save');
    return;
  }

  return await db.insert(message).values(messages);
}

export async function getMessagesByChatId({ id }: { id: string }) {
  return await db
    .select()
    .from(message)
    .where(eq(message.chatId, id))
    .orderBy(asc(message.createdAt));
}

export async function getMessageById({ id }: { id: string }) {
  const [found] = await db.select().from(message).where(eq(message.id, id));
  return found;
}

export async function deleteMessagesByChatIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  return await db
    .delete(message)
    .where(and(eq(message.chatId, id), gt(message.createdAt, timestamp)));
}

export async function getMessageCountByUserId({ userId }: { userId: string }) {
  const [countResult] = await db
    .select({ count: count() })
    .from(message)
    .where(eq(message.userId, userId));
  return Number(countResult.count);
}

// ────────────────────────────────────────────────
// DOCUMENTS
// ────────────────────────────────────────────────
export async function saveDocument({
  id,
  userId,
  chatId,
  kind,
  name,
  content,
}: {
  id: string;
  userId: string;
  chatId: string;
  kind: string;
  name: string;
  content: string;
}) {
  return await db.insert(document).values({
    id,
    createdAt: new Date(),
    userId,
    chatId,
    kind,
    name,
    content,
  });
}

export async function getDocumentById({ id }: { id: string }) {
  const [doc] = await db.select().from(document).where(eq(document.id, id));
  return doc;
}

export async function getDocumentsById({
  userId,
  kind,
}: {
  userId: string;
  kind?: string;
}) {
  return await db
    .select()
    .from(document)
    .where(
      kind ? and(eq(document.userId, userId), eq(document.kind, kind)) : eq(document.userId, userId),
    )
    .orderBy(desc(document.createdAt));
}

export async function deleteDocumentsByIdAfterTimestamp({
  userId,
  timestamp,
}: {
  userId: string;
  timestamp: Date;
}) {
  return await db
    .delete(document)
    .where(and(eq(document.userId, userId), gt(document.createdAt, timestamp)));
}

// ────────────────────────────────────────────────
// SUGGESTIONS
// ────────────────────────────────────────────────
export async function saveSuggestions(suggestions: Array<Suggestion>) {
  return await db.insert(suggestion).values(suggestions);
}

export async function getSuggestionsByDocumentId({ id }: { id: string }) {
  return await db
    .select()
    .from(suggestion)
    .where(eq(suggestion.documentId, id))
    .orderBy(asc(suggestion.createdAt));
}

// ────────────────────────────────────────────────
// VOTES
// ────────────────────────────────────────────────
export async function voteMessage({
  messageId,
  chatId,
  userId,
  value,
}: {
  messageId: string;
  chatId: string;
  userId: string;
  value: number;
}) {
  await db.insert(vote).values({
    messageId,
    chatId,
    userId,
    value,
  });
}

export async function getVotesByChatId({ id }: { id: string }) {
  return await db.select().from(vote).where(eq(vote.chatId, id));
}
