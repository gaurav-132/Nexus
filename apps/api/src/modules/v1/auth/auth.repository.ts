import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../../database/database.service.js';
import {
    invitations,
    memberships,
    sessions,
    tenants,
    users,
} from '../../../database/schema/index.js';

interface CreateAccountInput {
    workspaceName: string;
    workspaceSlug: string;
    name: string;
    email: string;
    passwordHash: string;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
}

interface MembershipRecord {
    id: string;
    role: 'owner' | 'admin' | 'member';
    tenant: { id: string; name: string; slug: string };
}

@Injectable()
export class AuthRepository {
    constructor(private readonly database: DatabaseService) {}

    async createAccount(input: CreateAccountInput) {
        return this.database.db.transaction(async (tx) => {
            const tenantId = randomUUID();
            const userId = randomUUID();
            const membershipId = randomUUID();

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
                    email: input.email,
                    passwordHash: input.passwordHash,
                    name: input.name,
                })
                .returning({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    status: users.status,
                });

            const [membership] = await tx
                .insert(memberships)
                .values({
                    id: membershipId,
                    userId,
                    tenantId,
                    role: 'owner',
                })
                .returning({
                    id: memberships.id,
                    role: memberships.role,
                });

            await tx.insert(sessions).values({
                id: randomUUID(),
                userId,
                membershipId,
                tokenHash: input.sessionTokenHash,
                expiresAt: input.sessionExpiresAt,
            });

            return {
                user,
                membership: {
                    ...membership,
                    tenant,
                },
                memberships: [
                    {
                        ...membership,
                        tenant,
                    },
                ],
                activeMembership: { ...membership, tenant },
            };
        });
    }

    async findCredentials(email: string) {
        const [user] = await this.database.db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                passwordHash: users.passwordHash,
                status: users.status,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) return null;
        return { ...user, memberships: await this.findActiveMemberships(user.id) };
    }

    async createSession(
        userId: string,
        membershipId: string | null,
        tokenHash: string,
        expiresAt: Date,
    ): Promise<void> {
        await this.database.db.transaction(async (tx) => {
            await tx
                .delete(sessions)
                .where(
                    and(
                        eq(sessions.userId, userId),
                        lt(sessions.expiresAt, new Date()),
                    ),
                );
            await tx.insert(sessions).values({
                id: randomUUID(),
                userId,
                membershipId,
                tokenHash,
                expiresAt,
            });
        });
    }

    async findActiveSession(tokenHash: string) {
        const [session] = await this.database.db
            .select({
                sessionId: sessions.id,
                membershipId: sessions.membershipId,
                id: users.id,
                email: users.email,
                name: users.name,
            })
            .from(sessions)
            .innerJoin(users, eq(sessions.userId, users.id))
            .where(
                and(
                    eq(sessions.tokenHash, tokenHash),
                    gt(sessions.expiresAt, new Date()),
                    isNull(sessions.revokedAt),
                    eq(users.status, 'active'),
                ),
            )
            .limit(1);

        if (!session) return null;

        await this.database.db
            .update(sessions)
            .set({ lastUsedAt: new Date() })
            .where(eq(sessions.id, session.sessionId));

        const activeMemberships = await this.findActiveMemberships(session.id);
        return {
            id: session.id,
            email: session.email,
            name: session.name,
            memberships: activeMemberships,
            activeMembership:
                activeMemberships.find(
                    (membership) => membership.id === session.membershipId,
                ) ?? null,
        };
    }

    async selectWorkspace(
        tokenHash: string,
        tenantSlug: string,
    ): Promise<boolean> {
        return this.database.db.transaction(async (tx) => {
            const [session] = await tx
                .select({ id: sessions.id, userId: sessions.userId })
                .from(sessions)
                .innerJoin(users, eq(sessions.userId, users.id))
                .where(
                    and(
                        eq(sessions.tokenHash, tokenHash),
                        gt(sessions.expiresAt, new Date()),
                        isNull(sessions.revokedAt),
                        eq(users.status, 'active'),
                    ),
                )
                .limit(1)
                .for('update');

            if (!session) return false;

            const [membership] = await tx
                .select({ id: memberships.id })
                .from(memberships)
                .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
                .where(
                    and(
                        eq(memberships.userId, session.userId),
                        eq(memberships.status, 'active'),
                        eq(tenants.slug, tenantSlug),
                        eq(tenants.status, 'active'),
                    ),
                )
                .limit(1);

            if (!membership) return false;

            await tx
                .update(sessions)
                .set({ membershipId: membership.id, lastUsedAt: new Date() })
                .where(eq(sessions.id, session.id));
            return true;
        });
    }

    async revokeSession(tokenHash: string): Promise<void> {
        const now = new Date();
        await this.database.db
            .update(sessions)
            .set({ revokedAt: now, lastUsedAt: now })
            .where(
                and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)),
            );
    }

    async findPendingInvitation(tokenHash: string) {
        const [invitation] = await this.database.db
            .select({ email: invitations.email })
            .from(invitations)
            .where(
                and(
                    eq(invitations.tokenHash, tokenHash),
                    eq(invitations.status, 'pending'),
                    gt(invitations.expiresAt, new Date()),
                ),
            )
            .limit(1);
        return invitation ?? null;
    }

    async acceptInvitation(input: {
        tokenHash: string;
        name?: string;
        passwordHash?: string;
        sessionTokenHash: string;
        sessionExpiresAt: Date;
    }) {
        return this.database.db.transaction(async (tx) => {
            const [invitation] = await tx
                .select()
                .from(invitations)
                .where(eq(invitations.tokenHash, input.tokenHash))
                .limit(1)
                .for('update');

            if (!invitation || invitation.status !== 'pending') {
                return { status: 'invalid' } as const;
            }

            const now = new Date();
            if (invitation.expiresAt <= now) {
                await tx
                    .update(invitations)
                    .set({ status: 'expired' })
                    .where(eq(invitations.id, invitation.id));
                return { status: 'invalid' } as const;
            }

            const [tenant] = await tx
                .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
                .from(tenants)
                .where(
                    and(
                        eq(tenants.id, invitation.tenantId),
                        eq(tenants.status, 'active'),
                    ),
                )
                .limit(1);
            if (!tenant) return { status: 'invalid' } as const;

            let [user] = await tx
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    status: users.status,
                })
                .from(users)
                .where(eq(users.email, invitation.email))
                .limit(1)
                .for('update');

            if (user && user.status !== 'active') {
                return { status: 'account-unavailable' } as const;
            }

            if (!user) {
                if (!input.name || !input.passwordHash) {
                    return { status: 'credentials-required' } as const;
                }
                [user] = await tx
                    .insert(users)
                    .values({
                        id: randomUUID(),
                        email: invitation.email,
                        name: input.name,
                        passwordHash: input.passwordHash,
                    })
                    .returning({
                        id: users.id,
                        email: users.email,
                        name: users.name,
                        status: users.status,
                    });
            }

            const [existingMembership] = await tx
                .select({ id: memberships.id })
                .from(memberships)
                .where(
                    and(
                        eq(memberships.userId, user.id),
                        eq(memberships.tenantId, tenant.id),
                    ),
                )
                .limit(1);
            if (existingMembership) {
                return { status: 'already-member' } as const;
            }

            const membershipId = randomUUID();
            const [membership] = await tx
                .insert(memberships)
                .values({
                    id: membershipId,
                    userId: user.id,
                    tenantId: tenant.id,
                    role: invitation.role,
                })
                .returning({ id: memberships.id, role: memberships.role });

            await tx
                .update(invitations)
                .set({ status: 'accepted', acceptedAt: now })
                .where(eq(invitations.id, invitation.id));
            await tx.insert(sessions).values({
                id: randomUUID(),
                userId: user.id,
                membershipId,
                tokenHash: input.sessionTokenHash,
                expiresAt: input.sessionExpiresAt,
            });

            return {
                status: 'accepted',
                user,
                membership: { ...membership, tenant },
            } as const;
        });
    }

    private async findActiveMemberships(userId: string): Promise<MembershipRecord[]> {
        const records = await this.database.db
            .select({
                id: memberships.id,
                role: memberships.role,
                tenantId: tenants.id,
                tenantName: tenants.name,
                tenantSlug: tenants.slug,
            })
            .from(memberships)
            .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
            .where(
                and(
                    eq(memberships.userId, userId),
                    eq(memberships.status, 'active'),
                    eq(tenants.status, 'active'),
                ),
            );

        return records.map((record) => ({
            id: record.id,
            role: record.role,
            tenant: {
                id: record.tenantId,
                name: record.tenantName,
                slug: record.tenantSlug,
            },
        }));
    }
}
