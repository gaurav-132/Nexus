import {
    pgEnum,
    pgTable,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', [
    'active',
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
    (table) => [unique('tenants_slug_unique').on(table.slug)],
);
