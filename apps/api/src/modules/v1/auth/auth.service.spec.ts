import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';
import { hashPassword, hashSessionToken } from './auth-security.js';

const ariMembership = {
    id: 'membership-1',
    role: 'owner' as const,
    tenant: { id: 'tenant-1', name: 'Ari Studio', slug: 'ari-studio' },
};

describe('AuthService', () => {
    it('creates an identity, owner membership, tenant, and session as one registration operation', async () => {
        const repository = {
            createAccount: vi.fn(async () => ({
                user: {
                    id: 'user-1',
                    email: 'owner@example.com',
                    name: 'Ari Owner',
                    status: 'active' as const,
                    passwordHash: 'must-not-leak',
                },
                memberships: [ariMembership],
                activeMembership: ariMembership,
            })),
        };
        const service = new AuthService(repository as never);

        const result = await service.register({
            workspaceName: 'Ari Studio',
            workspaceSlug: 'ari-studio',
            email: 'owner@example.com',
            password: 'long-enough-password',
            name: 'Ari Owner',
        });

        expect(repository.createAccount).toHaveBeenCalledOnce();
        expect(result.token).toBeTruthy();
        expect(result.user).toEqual({
            id: 'user-1',
            email: 'owner@example.com',
            name: 'Ari Owner',
            memberships: [ariMembership],
            activeMembership: ariMembership,
        });
        expect(JSON.stringify(result)).not.toContain('must-not-leak');
    });

    it('logs in by global email and assigns the only active membership to the session', async () => {
        const passwordHash = await hashPassword('correct horse battery staple');
        const repository = {
            findCredentials: vi.fn(async () => ({
                id: 'user-1',
                email: 'owner@example.com',
                name: 'Ari Owner',
                passwordHash,
                status: 'active' as const,
                memberships: [ariMembership],
            })),
            createSession: vi.fn(),
        };
        const service = new AuthService(repository as never);

        const result = await service.login({
            email: 'owner@example.com',
            password: 'correct horse battery staple',
        });

        expect(repository.createSession).toHaveBeenCalledWith(
            'user-1',
            'membership-1',
            expect.any(String),
            expect.any(Date),
        );
        expect(result.user.activeMembership).toEqual(ariMembership);
        expect(JSON.stringify(result)).not.toContain(passwordHash);
    });

    it('creates a tenant-neutral session when the user has multiple memberships', async () => {
        const passwordHash = await hashPassword('correct horse battery staple');
        const secondMembership = {
            ...ariMembership,
            id: 'membership-2',
            role: 'member' as const,
            tenant: { id: 'tenant-2', name: 'North Studio', slug: 'north-studio' },
        };
        const repository = {
            findCredentials: vi.fn(async () => ({
                id: 'user-1',
                email: 'owner@example.com',
                name: 'Ari Owner',
                passwordHash,
                status: 'active' as const,
                memberships: [ariMembership, secondMembership],
            })),
            createSession: vi.fn(),
        };
        const service = new AuthService(repository as never);

        const result = await service.login({
            email: 'owner@example.com',
            password: 'correct horse battery staple',
        });

        expect(repository.createSession).toHaveBeenCalledWith(
            'user-1',
            null,
            expect.any(String),
            expect.any(Date),
        );
        expect(result.user.activeMembership).toBeNull();
        expect(result.user.memberships).toHaveLength(2);
    });

    it('rejects invalid passwords without creating a session', async () => {
        const passwordHash = await hashPassword('correct horse battery staple');
        const repository = {
            findCredentials: vi.fn(async () => ({
                id: 'user-1',
                email: 'owner@example.com',
                name: 'Ari Owner',
                passwordHash,
                status: 'active' as const,
                memberships: [ariMembership],
            })),
            createSession: vi.fn(),
        };
        const service = new AuthService(repository as never);

        await expect(
            service.login({
                email: 'owner@example.com',
                password: 'incorrect password',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(repository.createSession).not.toHaveBeenCalled();
    });

    it('requires credentials for a new invitee and creates a session on acceptance', async () => {
        const repository = {
            findPendingInvitation: vi.fn(async () => ({ email: 'invite@example.com' })),
            acceptInvitation: vi.fn(async () => ({
                status: 'accepted' as const,
                user: {
                    id: 'user-2',
                    email: 'invite@example.com',
                    name: 'New Teammate',
                },
                membership: {
                    id: 'membership-3',
                    role: 'member' as const,
                    tenant: {
                        id: 'tenant-1',
                        name: 'Ari Studio',
                        slug: 'ari-studio',
                    },
                },
            })),
        };
        const service = new AuthService(repository as never);

        const result = await service.acceptInvitation('raw-invitation-token', {
            name: 'New Teammate',
            password: 'new-account-password',
        });

        expect(repository.findPendingInvitation).toHaveBeenCalledWith(
            hashSessionToken('raw-invitation-token'),
        );
        expect(repository.acceptInvitation).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'New Teammate',
                passwordHash: expect.stringMatching(/^scrypt\$v1\$/),
            }),
        );
        expect(result.user.activeMembership.tenant.slug).toBe('ari-studio');
    });
});
