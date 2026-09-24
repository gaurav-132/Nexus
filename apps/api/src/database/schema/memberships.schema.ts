import {
    index,
    pgEnum,
    pgTable,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants.schema.js';
import { users } from './users.schema.js';

export const membershipStatusEnum = pgEnum('membership_status', [
    'active',
    'suspended',
]);
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member']);

export const memberships = pgTable(
    'memberships',
    {
        id: uuid('id').primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tenantId: uuid('tenant_id')
            .notNull()
            .references(() => tenants.id, { onDelete: 'cascade' }),
        role: userRoleEnum('role').notNull().default('member'),
        status: membershipStatusEnum('status').notNull().default('active'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        unique('memberships_user_tenant_unique').on(
            table.userId,
            table.tenantId,
        ),
        index('memberships_tenant_id_index').on(table.tenantId),
    ],
);
