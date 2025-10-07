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
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// 스키마 파일에서 필요한 모든 테이블과 타입들을 임포트합니다.
import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';

// 환경 변수 검증 및 Drizzle 초기화
// Non-null assertion(!) 대신 안전한 방식을 사용했습니다.
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set in environment variables.');
}
const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

// -------------------------------------------------------------
// 사용자 (User) 관련 함수
// -------------------------------------------------------------

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

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Failed to create guest user in database', error);
    throw error;
  }
}

// -------------------------------------------------------------
// 채팅 기록 이전 핵심 함수 (게스트 -> 정식 사용자)
// 트랜잭션을 사용하여 데이터 무결성을 보장합니다.
// -------------------------------------------------------------

/**
 * 특정 게스트 사용자의 모든 채팅, 문서, 추천 기록을 정식 사용자에게 이전합니다.
 * 트랜잭션을 사용하여 작업의 원자성(All-or-Nothing)을 보장합니다.
 * @param guestId 이전할 기록을 가진 게스트 사용자의 ID (uuid)
 * @param newUserId 기록을 이전받을 정식 사용자의 ID (uuid)
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
        .set({ userId: newUserId })
        .where(eq(chat.userId, guestId))
        .returning({ id: chat.id });

      // 2. Document 레코드 업데이트
      const updatedDocuments = await tx
        .update(document)
        .set({ userId: newUserId })
        .where(eq(document.userId, guestId))
        .returning({ id: document.id });

      // 3. Suggestion 레코드 업데이트
      const updatedSuggestions = await tx
        .update(suggestion)
        .set({ userId: newUserId })
        .where(eq(suggestion.userId, guestId))
        .returning({ id: suggestion.id });

      console.log(
        `✅ Transaction Success: Transferred ${updatedChats.length} chats, ${updatedDocuments.length} documents, and ${updatedSuggestions.length} suggestions from guest (${guestId}) to user (${newUserId}).`,
      );

      return { updatedChats, updatedDocuments, updatedSuggestions };
    });
  } catch (error) {
    // 에러 발생 시 트랜잭션이 자동으로 롤백됩니다.
    console.error('❌ Transaction failed to transfer guest data', error);
    throw error;
  }
}


// -------------------------------------------------------------
// 채팅 (Chat) 관련 함수
// -------------------------------------------------------------

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database', error);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    // 외래 키를 참조하는 테이블의 데이터를 먼저 삭제 (Vote, Message)
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
  id,
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

    // createdAt 외에 id를 보조 정렬 기준으로 추가하여 안정성을 높였습니다.
    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt), desc(chat.id)) // 보조 정렬 기준 추가
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      // 실제 페이지네이션 로직은 데이터 양에 따라 복잡해질 수 있지만,
      // 기존 코드를 유지하고 보조 정렬 기준으로 안정성을 높였습니다.
      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

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

// -------------------------------------------------------------
// 메시지 (Message) 관련 함수
// -------------------------------------------------------------

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database', error);
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    // 삭제할 메시지 ID 목록을 먼저 가져옵니다.
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      // 관련 투표를 먼저 삭제합니다.
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      // 메시지를 삭제합니다.
      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
      error,
    );
    throw error;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    console.error(
      'Failed to get message count by user id for the last 24 hours from database',
      error,
    );
    throw error;
  }
}

// -------------------------------------------------------------
// 투표 (Vote) 관련 함수
// -------------------------------------------------------------

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    // upsert 로직: 기존 투표가 있으면 업데이트, 없으면 삽입
    const isUpvoted = type === 'up';

    const [existingVote] = await db
      .select()
      .from(vote)
      // messageId와 chatId를 모두 확인하여 유니크한 투표를 찾습니다.
      .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId))); 

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted,
    });
  } catch (error) {
    console.error('Failed to vote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

// -------------------------------------------------------------
// 문서 (Document) 관련 함수
// -------------------------------------------------------------

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
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
        userId,
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

// -------------------------------------------------------------
// 추천 (Suggestion) 관련 함수
// -------------------------------------------------------------

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
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
