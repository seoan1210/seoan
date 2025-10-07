import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm'; // defaultNow를 위한 sql 임포트

// --------------------------------------------------------------------------
// 사용자 테이블
// --------------------------------------------------------------------------
export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

// --------------------------------------------------------------------------
// ⭐️ 게스트 사용자 테이블 (분리)
// --------------------------------------------------------------------------
export const guestUser = pgTable('GuestUser', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 64 }).notNull(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
});

export type GuestUser = InferSelectModel<typeof guestUser>;

// --------------------------------------------------------------------------
// ⭐️ Chat 테이블 (regularUserId, guestUserId로 분리)
// --------------------------------------------------------------------------
export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  title: text('title').notNull(),
  
  // 정식 사용자 ID (references User) - 게스트 채팅일 경우 null
  regularUserId: uuid('regularUserId')
    .references(() => user.id, { onDelete: 'cascade' }),
    
  // 게스트 사용자 ID (references GuestUser) - 정식 사용자 채팅일 경우 null
  guestUserId: uuid('guestUserId')
    .references(() => guestUser.id, { onDelete: 'cascade' }),
    
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// --------------------------------------------------------------------------
// 메시지 테이블 (Chat 참조)
// --------------------------------------------------------------------------
export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
});

export type DBMessage = InferSelectModel<typeof message>;

// --------------------------------------------------------------------------
// 투표 테이블 (Message, Chat 참조)
// --------------------------------------------------------------------------
export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

// --------------------------------------------------------------------------
// ⭐️ Document 테이블 (regularUserId, guestUserId로 분리)
// --------------------------------------------------------------------------
export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().default(sql`gen_random_uuid()`),
    createdAt: timestamp('createdAt').notNull().default(sql`now()`),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
      
    regularUserId: uuid('regularUserId')
      .references(() => user.id, { onDelete: 'cascade' }),
    guestUserId: uuid('guestUserId')
      .references(() => guestUser.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

// --------------------------------------------------------------------------
// ⭐️ Suggestion 테이블 (regularUserId, guestUserId로 분리)
// --------------------------------------------------------------------------
export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().default(sql`gen_random_uuid()`),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    
    regularUserId: uuid('regularUserId')
      .references(() => user.id, { onDelete: 'cascade' }),
    guestUserId: uuid('guestUserId')
      .references(() => guestUser.id, { onDelete: 'cascade' }),

    createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

// Deprecated 스키마들은 제거했습니다.
