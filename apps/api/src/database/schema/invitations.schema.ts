import { sql } from 'drizzle-orm';
import {
    check,
    index,
    pgEnum,
    pgTable,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants.schema.js';
import { userRoleEnum } from './memberships.schema.js';
import { users } from './users.schema.js';

export const invitationStatusEnum = pgEnum('invitation_status', [
    'pending',
    'accepted',
    'expired',
    'revoked',
]);

export const invitations = pgTable(
    'invitations',
    {
        id: uuid('id').primaryKey(),
        tenantId: uuid('tenant_id')
            .notNull()
            .references(() => tenants.id, { onDelete: 'cascade' }),
        email: varchar('email', { length: 320 }).notNull(),
        role: userRoleEnum('role').notNull(),
        tokenHash: varchar('token_hash', { length: 64 }).notNull(),
        invitedBy: uuid('invited_by')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        status: invitationStatusEnum('status').notNull().default('pending'),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        acceptedAt: timestamp('accepted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        unique('invitations_token_hash_unique').on(table.tokenHash),
        index('invitations_tenant_email_index').on(table.tenantId, table.email),
        index('invitations_expiry_index').on(table.expiresAt),
        check('invitations_email_lowercase_check', sql`email = lower(email)`),
    ],
);
