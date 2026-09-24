import { index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { memberships } from './memberships.schema.js';
import { users } from './users.schema.js';

export const sessions = pgTable(
    'sessions',
    {
        id: uuid('id').primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        membershipId: uuid('membership_id').references(() => memberships.id, {
            onDelete: 'set null',
        }),
        tokenHash: varchar('token_hash', { length: 64 }).notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        lastUsedAt: timestamp('last_used_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
    },
    (table) => [
        unique('sessions_token_hash_unique').on(table.tokenHash),
        index('sessions_user_id_index').on(table.userId),
        index('sessions_membership_id_index').on(table.membershipId),
        index('sessions_expires_at_index').on(table.expiresAt),
    ],
);
