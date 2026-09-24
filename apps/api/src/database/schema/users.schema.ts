import {
    pgEnum,
    pgTable,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants.schema.js';

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member']);

export const userStatusEnum = pgEnum('user_status', [
    'active',
    'invited',
    'suspended',
]);

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey(),
        tenantId: uuid('tenant_id')
            .notNull()
            .references(() => tenants.id, { onDelete: 'cascade' }),
        email: varchar('email', { length: 320 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        firstName: varchar('first_name', { length: 80 }).notNull(),
        lastName: varchar('last_name', { length: 80 }),
        role: userRoleEnum('role').notNull().default('member'),
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
        unique('users_tenant_email_unique').on(table.tenantId, table.email),
    ],
);
