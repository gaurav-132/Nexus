import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';
import { hashPassword } from './auth-security.js';

describe('AuthService', () => {
    it('creates a tenant owner and returns an authenticated user without credentials', async () => {
        const repository = {
            createAccount: vi.fn(async () => ({
                user: {
                    id: 'user-1',
                    tenantId: 'tenant-1',
                    email: 'owner@example.com',
                    firstName: 'Ari',
                    lastName: null,
                    role: 'owner' as const,
                    status: 'active' as const,
                    passwordHash: 'must-not-leak',
                },
                tenant: {
                    id: 'tenant-1',
                    name: 'Ari Studio',
                    slug: 'ari-studio',
                    status: 'active' as const,
                },
            })),
        };
        const service = new AuthService(repository as never);

        const result = await service.register({
            workspaceName: 'Ari Studio',
            workspaceSlug: 'ari-studio',
            email: 'owner@example.com',
            password: 'long-enough-password',
            firstName: 'Ari',
            lastName: '',
        });

        expect(repository.createAccount).toHaveBeenCalledOnce();
        expect(result.token).toBeTruthy();
        expect(result.user).toEqual({
            id: 'user-1',
            email: 'owner@example.com',
            firstName: 'Ari',
            lastName: null,
            role: 'owner',
            tenant: { id: 'tenant-1', name: 'Ari Studio', slug: 'ari-studio' },
        });
        expect(JSON.stringify(result)).not.toContain('must-not-leak');
    });

    it('creates a login session only for active users with a valid password', async () => {
        const passwordHash = await hashPassword('correct horse battery staple');
        const repository = {
            findCredentials: vi.fn(async () => ({
                id: 'user-1',
                tenantId: 'tenant-1',
                email: 'owner@example.com',
                passwordHash,
                firstName: 'Ari',
                lastName: null,
                role: 'owner' as const,
                userStatus: 'active' as const,
                tenantName: 'Ari Studio',
                tenantSlug: 'ari-studio',
                tenantStatus: 'active' as const,
            })),
            createSession: vi.fn(),
        };
        const service = new AuthService(repository as never);

        const result = await service.login({
            workspaceSlug: 'ari-studio',
            email: 'owner@example.com',
            password: 'correct horse battery staple',
        });

        expect(repository.createSession).toHaveBeenCalledOnce();
        expect(result.user.email).toBe('owner@example.com');
        expect(JSON.stringify(result)).not.toContain(passwordHash);
    });

    it('rejects invalid passwords without creating a session', async () => {
        const passwordHash = await hashPassword('correct horse battery staple');
        const repository = {
            findCredentials: vi.fn(async () => ({
                id: 'user-1',
                tenantId: 'tenant-1',
                email: 'owner@example.com',
                passwordHash,
                firstName: 'Ari',
                lastName: null,
                role: 'owner' as const,
                userStatus: 'active' as const,
                tenantName: 'Ari Studio',
                tenantSlug: 'ari-studio',
                tenantStatus: 'active' as const,
            })),
            createSession: vi.fn(),
        };
        const service = new AuthService(repository as never);

        await expect(
            service.login({
                workspaceSlug: 'ari-studio',
                email: 'owner@example.com',
                password: 'incorrect password',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(repository.createSession).not.toHaveBeenCalled();
    });
});
