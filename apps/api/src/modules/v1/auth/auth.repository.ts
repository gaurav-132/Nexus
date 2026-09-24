import { Injectable } from '@nestjs/common';
import { and, eq, gt, lt } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../../database/database.service.js';
import {
    authSessions,
    tenants,
    users,
} from '../../../database/schema/index.js';

interface CreateAccountRecord {
    workspaceName: string;
    workspaceSlug: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
}

@Injectable()
export class AuthRepository {
    constructor(private readonly database: DatabaseService) {}

    async createAccount(input: CreateAccountRecord) {
        return this.database.db.transaction(async (tx) => {
            const tenantId = randomUUID();
            const userId = randomUUID();

            const [tenant] = await tx
                .insert(tenants)
                .values({
                    id: tenantId,
                    name: input.workspaceName,
                    slug: input.workspaceSlug,
                })
                .returning({
                    id: tenants.id,
                    name: tenants.name,
                    slug: tenants.slug,
                    status: tenants.status,
                });

            const [user] = await tx
                .insert(users)
                .values({
                    id: userId,
                    tenantId,
                    email: input.email,
                    passwordHash: input.passwordHash,
                    firstName: input.firstName,
                    lastName: input.lastName || null,
                    role: 'owner',
                })
                .returning({
                    id: users.id,
                    tenantId: users.tenantId,
                    email: users.email,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    role: users.role,
                    status: users.status,
                });

            await tx.insert(authSessions).values({
                tokenHash: input.sessionTokenHash,
                userId,
                expiresAt: input.sessionExpiresAt,
            });

            return { user, tenant };
        });
    }

    async findCredentials(workspaceSlug: string, email: string) {
        const [identity] = await this.database.db
            .select({
                id: users.id,
                tenantId: users.tenantId,
                email: users.email,
                passwordHash: users.passwordHash,
                firstName: users.firstName,
                lastName: users.lastName,
                role: users.role,
                userStatus: users.status,
                tenantName: tenants.name,
                tenantSlug: tenants.slug,
                tenantStatus: tenants.status,
            })
            .from(users)
            .innerJoin(tenants, eq(users.tenantId, tenants.id))
            .where(and(eq(tenants.slug, workspaceSlug), eq(users.email, email)))
            .limit(1);

        return identity ?? null;
    }

    async createSession(
        userId: string,
        tokenHash: string,
        expiresAt: Date,
    ): Promise<void> {
        await this.database.db.transaction(async (tx) => {
            await tx
                .delete(authSessions)
                .where(
                    and(
                        eq(authSessions.userId, userId),
                        lt(authSessions.expiresAt, new Date()),
                    ),
                );
            await tx.insert(authSessions).values({
                tokenHash,
                userId,
                expiresAt,
            });
        });
    }

    async findActiveSession(tokenHash: string) {
        const [identity] = await this.database.db
            .select({
                id: users.id,
                tenantId: users.tenantId,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                role: users.role,
                userStatus: users.status,
                tenantName: tenants.name,
                tenantSlug: tenants.slug,
                tenantStatus: tenants.status,
            })
            .from(authSessions)
            .innerJoin(users, eq(authSessions.userId, users.id))
            .innerJoin(tenants, eq(users.tenantId, tenants.id))
            .where(
                and(
                    eq(authSessions.tokenHash, tokenHash),
                    gt(authSessions.expiresAt, new Date()),
                    eq(users.status, 'active'),
                    eq(tenants.status, 'active'),
                ),
            )
            .limit(1);

        return identity ?? null;
    }

    async deleteSession(tokenHash: string): Promise<void> {
        await this.database.db
            .delete(authSessions)
            .where(eq(authSessions.tokenHash, tokenHash));
    }
}
