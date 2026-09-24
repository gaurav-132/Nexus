import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './users.schema.js';

export const authSessions = pgTable(
    'auth_sessions',
    {
        tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index('auth_sessions_user_id_index').on(table.userId),
        index('auth_sessions_expires_at_index').on(table.expiresAt),
    ],
);
