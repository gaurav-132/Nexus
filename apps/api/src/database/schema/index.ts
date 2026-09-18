import {
    index,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', [
    'active',
    'suspended',
]);

export const userRoleEnum = pgEnum('user_role', [
    'owner',
    'admin',
    'member',
]);

export const userStatusEnum = pgEnum('user_status', [
    'active',
    'invited',
    'suspended',
]);

export const tenants = pgTable(
    'tenants',
    {
        id: uuid('id').primaryKey(),
        name: varchar('name', { length: 120 }).notNull(),
        slug: varchar('slug', { length: 80 }).notNull(),
        status: tenantStatusEnum('status').notNull().default('active'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex('tenants_slug_unique').on(table.slug),
    ],
);

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
        uniqueIndex('users_tenant_email_unique').on(
            table.tenantId,
            table.email,
        ),
        index('users_tenant_id_idx').on(table.tenantId),
    ],
);
