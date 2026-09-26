import {
    pgTable,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema.js';

/** A row grants platform-wide access; workspace roles do not grant this privilege. */
export const platformAdmins = pgTable('platform_admins', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    grantedBy: uuid('granted_by').references(() => users.id, {
        onDelete: 'set null',
    }),
});
