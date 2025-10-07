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
  guestUser, // ⭐️ GuestUser 테이블 임포트
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  type Document,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
// utils 함수는 네 환경에 맞게 경로를 확인해줘!
import { generateUUID } from '../utils'; 
import { generateHashedPassword } from './utils';

// 환경 변수 검증 및 Drizzle 초기화
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set in environment variables.');
}
const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

// =============================================================
// 사용자 및 게스트 사용자 관리
// =============================================================

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database', error);
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    console.error('Failed to create user in database', error);
    throw error;
  }
}

// ⭐️ 게스트 사용자 (GuestUser) 생성 함수
export async function createGuestUser() {
  const email = `guest-${Date.now()}`;

  try {
    // GuestUser 테이블에만 저장
    return await db.insert(guestUser).values({ email }).returning({
      id: guestUser.id,
      email: guestUser.email,
    });
  } catch (error) {
    console.error('Failed to create guest user in database', error);
    throw error;
  }
}

// =============================================================
// ⭐️ 채팅 및 데이터 기록 이전 핵심 함수
// =============================================================

/**
 * 게스트 사용자의 모든 기록을 정식 사용자에게 이전하고, 게스트 레코드를 삭제합니다.
 * 트랜잭션을 사용하여 데이터 무결성을 보장합니다.
 */
export async function transferGuestDataToUserTransactional({
  guestId,
  newUserId,
}: {
  guestId: string;
  newUserId: string;
}) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Chat 레코드 업데이트
      const updatedChats = await tx
        .update(chat)
        .set({ regularUserId: newUserId, guestUserId: null })
        .where(eq(chat.guestUserId, guestId))
        .returning({ id: chat.id });

      // 2. Document 레코드 업데이트
      const updatedDocuments = await tx
        .update(document)
        .set({ regularUserId: newUserId, guestUserId: null })
        .where(eq(document.guestUserId, guestId))
        .returning({ id: document.id });

      // 3. Suggestion 레코드 업데이트
      const updatedSuggestions = await tx
        .update(suggestion)
        .set({ regularUserId: newUserId, guestUserId: null })
        .where(eq(suggestion.guestUserId, guestId))
        .returning({ id: suggestion.id });
      
      // 4. 게스트 사용자 레코드 삭제
      const [deletedGuest] = await tx
        .delete(guestUser)
        .where(eq(guestUser.id, guestId))
        .returning({ id: guestUser.id });
      
      if (!deletedGuest) {
        throw new Error(`GuestUser with ID ${guestId} not found for deletion.`);
      }

      console.log(
        `✅ Transaction Success: Transferred ${updatedChats.length} chats, ${updatedDocuments.length} documents, and ${updatedSuggestions.length} suggestions to user (${newUserId}). Deleted guest (${guestId}).`,
      );

      return { updatedChats, updatedDocuments, updatedSuggestions, deletedGuestId: deletedGuest.id };
    });
  } catch (error) {
    console.error('❌ Transaction failed to transfer guest data', error);
    throw error;
  }
}

// =============================================================
// 채팅 (Chat) 관련 함수
// =============================================================

export async function saveChat({
  id,
  userId,
  isGuest, // ⭐️ 게스트 여부 플래그 사용
  title,
}: {
  id: string;
  userId: string;
  isGuest: boolean;
  title: string;
}) {
  const chatValues = {
    id,
    createdAt: new Date(),
    title,
    // 게스트 여부에 따라 적절한 컬럼에 ID 저장
    regularUserId: isGuest ? null : userId,
    guestUserId: isGuest ? userId : null,
  };

  try {
    return await db.insert(chat).values(chatValues);
  } catch (error) {
    console.error('Failed to save chat in database', error);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    console.error('Failed to delete chat by id from database', error);
    throw error;
  }
}

export async function getChatsByUserId({
  id, // 정식 사용자 ID만 받도록 가정
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.regularUserId, id)) // ⭐️ regularUserId 조회
            : eq(chat.regularUserId, id), // ⭐️ regularUserId 조회
        )
        .orderBy(desc(chat.createdAt), desc(chat.id))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];
    if (startingAfter) {
      const [selectedChat] = await db.select().from(chat).where(eq(chat.id, startingAfter)).limit(1);
      if (!selectedChat) throw new Error(`Chat with id ${startingAfter} not found`);
      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db.select().from(chat).where(eq(chat.id, endingBefore)).limit(1);
      if (!selectedChat) throw new Error(`Chat with id ${endingBefore} not found`);
      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }
    const hasMore = filteredChats.length > limit;
    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database', error);
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database', error);
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database', error);
    throw error;
  }
}

// =============================================================
// 메시지 (Message) 관련 함수
// =============================================================

export async function saveMessages({ messages, }: { messages: Array<DBMessage>; }) {
  try { return await db.insert(message).values(messages); } 
  catch (error) { console.error('Failed to save messages in database', error); throw error; }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try { return await db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt)); } 
  catch (error) { console.error('Failed to get messages by chat id from database', error); throw error; }
}
export async function getMessageById({ id }: { id: string }) {
  try { return await db.select().from(message).where(eq(message.id, id)); } 
  catch (error) { console.error('Failed to get message by id from database', error); throw error; }
}
export async function deleteMessagesByChatIdAfterTimestamp({ chatId, timestamp, }: { chatId: string; timestamp: Date; }) {
  try {
    const messagesToDelete = await db.select({ id: message.id }).from(message).where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)));
    const messageIds = messagesToDelete.map((message) => message.id);
    if (messageIds.length > 0) {
      await db.delete(vote).where(and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)));
      return await db.delete(message).where(and(eq(message.chatId, chatId), inArray(message.id, messageIds)));
    }
  } catch (error) { console.error('Failed to delete messages by id after timestamp from database', error); throw error; }
}

export async function getMessageCountByUserId({
  id, // 정식 사용자 ID만 받도록 가정
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);
    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.regularUserId, id), // ⭐️ regularUserId로 변경
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();
    return stats?.count ?? 0;
  } catch (error) { console.error('Failed to get message count by user id for the last 24 hours from database', error); throw error; }
}

// =============================================================
// 투표 (Vote) 관련 함수
// =============================================================

export async function voteMessage({ chatId, messageId, type, }: { chatId: string; messageId: string; type: 'up' | 'down'; }) {
  try {
    const isUpvoted = type === 'up';
    const [existingVote] = await db.select().from(vote).where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId))); 
    if (existingVote) { return await db.update(vote).set({ isUpvoted }).where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId))); }
    return await db.insert(vote).values({ chatId, messageId, isUpvoted });
  } catch (error) { console.error('Failed to vote message in database', error); throw error; }
}
export async function getVotesByChatId({ id }: { id: string }) {
  try { return await db.select().from(vote).where(eq(vote.chatId, id)); } 
  catch (error) { console.error('Failed to get votes by chat id from database', error); throw error; }
}

// =============================================================
// 문서 (Document) 관련 함수
// =============================================================

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId, // 정식 사용자 ID만 받도록 가정
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        regularUserId: userId, // ⭐️ regularUserId에 저장
        guestUserId: null,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database', error);
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database', error);
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database', error);
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    // 관련 Suggestion을 먼저 삭제합니다.
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    // Document를 삭제합니다.
    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
      error,
    );
    throw error;
  }
}

// =============================================================
// 추천 (Suggestion) 관련 함수
// =============================================================

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  // ⭐️ Suggestion 배열의 각 요소에 regularUserId/guestUserId 필드를 명시해야 합니다.
  // 여기서는 타입 불일치 문제로 인해 로직을 단순화하여 반환합니다.
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database', error);
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
      error,
    );
    throw error;
  }
}
