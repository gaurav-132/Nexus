import { sql } from 'drizzle-orm';
import {
    check,
    pgEnum,
    pgTable,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
    'active',
    'invited',
    'suspended',
]);

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey(),
        email: varchar('email', { length: 320 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        name: varchar('name', { length: 160 }).notNull(),
        status: userStatusEnum('status').notNull().default('active'),
        emailVerifiedAt: timestamp('email_verified_at', {
            withTimezone: true,
        }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        unique('users_email_unique').on(table.email),
        check('users_email_lowercase_check', sql`email = lower(email)`),
    ],
);
