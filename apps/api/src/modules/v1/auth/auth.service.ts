import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { AuthRepository } from './auth.repository.js';
import type { AuthenticatedUser } from './auth-context.js';
import type {
    AcceptInvitationInput,
    LoginInput,
    RegisterInput,
} from './auth-input.schema.js';
import {
    createSessionToken,
    hashPassword,
    hashSessionToken,
    SESSION_DURATION_MS,
    verifyPassword,
} from './auth-security.js';

function publicIdentity(identity: {
    id: string;
    email: string;
    name: string;
    memberships: AuthenticatedUser['memberships'];
    activeMembership: AuthenticatedUser['activeMembership'];
}): AuthenticatedUser {
    return {
        id: identity.id,
        email: identity.email,
        name: identity.name,
        memberships: identity.memberships,
        activeMembership: identity.activeMembership,
    };
}

function uniqueConstraint(error: unknown): string | undefined {
    if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        error.code !== '23505' ||
        !('constraint' in error)
    ) {
        return undefined;
    }
    return typeof error.constraint === 'string' ? error.constraint : undefined;
}

function throwAccountConflict(error: unknown): never {
    const constraint = uniqueConstraint(error);
    if (constraint === 'users_email_unique') {
        throw new ConflictException(
            'An account already exists for this email. Sign in instead.',
        );
    }
    if (
        constraint === 'tenants_slug_unique' ||
        constraint === 'memberships_user_tenant_unique'
    ) {
        throw new ConflictException(
            'That workspace URL is already in use. Choose another one.',
        );
    }
    if (constraint === 'invitations_token_hash_unique') {
        throw new ConflictException('This invitation has already been used.');
    }
    throw error;
}

@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository) {}

    async register(input: RegisterInput) {
        const token = createSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        const passwordHash = await hashPassword(input.password);

        try {
            const result = await this.authRepository.createAccount({
                workspaceName: input.workspaceName,
                workspaceSlug: input.workspaceSlug,
                name: input.name,
                email: input.email,
                passwordHash,
                sessionTokenHash: hashSessionToken(token),
                sessionExpiresAt: expiresAt,
            });

            return {
                token,
                user: publicIdentity({
                    ...result.user,
                    memberships: result.memberships,
                    activeMembership: result.activeMembership,
                }),
            };
        } catch (error) {
            throwAccountConflict(error);
        }
    }

    async login(input: LoginInput) {
        const identity = await this.authRepository.findCredentials(input.email);
        const passwordMatches = identity
            ? await verifyPassword(input.password, identity.passwordHash)
            : await this.performDummyPasswordWork(input.password);

        if (
            !identity ||
            !passwordMatches ||
            identity.status !== 'active' ||
            identity.memberships.length === 0
        ) {
            throw new UnauthorizedException('Email or password is incorrect.');
        }

        const token = createSessionToken();
        const activeMembership =
            identity.memberships.length === 1 ? identity.memberships[0] : null;
        await this.authRepository.createSession(
            identity.id,
            activeMembership?.id ?? null,
            hashSessionToken(token),
            new Date(Date.now() + SESSION_DURATION_MS),
        );

        return {
            token,
            user: publicIdentity({
                ...identity,
                activeMembership,
            }),
        };
    }

    async currentUser(token: string | undefined): Promise<AuthenticatedUser> {
        if (!token) {
            throw new UnauthorizedException('Sign in to continue.');
        }

        const identity = await this.authRepository.findActiveSession(
            hashSessionToken(token),
        );
        if (!identity) {
            throw new UnauthorizedException(
                'Your session has expired. Sign in again.',
            );
        }

        return publicIdentity(identity);
    }

    async selectWorkspace(
        token: string | undefined,
        tenantSlug: string,
    ): Promise<void> {
        if (!token) throw new UnauthorizedException('Sign in to continue.');

        const selected = await this.authRepository.selectWorkspace(
            hashSessionToken(token),
            tenantSlug,
        );
        if (!selected) {
            throw new ForbiddenException(
                'You do not have access to that workspace.',
            );
        }
    }

    async acceptInvitation(token: string, input: AcceptInvitationInput) {
        const tokenHash = hashSessionToken(token);
        const invitation = await this.authRepository.findPendingInvitation(
            tokenHash,
        );
        if (!invitation) {
            throw new BadRequestException('This invitation is invalid or expired.');
        }

        const passwordHash = input.password
            ? await hashPassword(input.password)
            : undefined;
        const sessionToken = createSessionToken();
        const result = await this.authRepository.acceptInvitation({
            tokenHash,
            name: input.name,
            passwordHash,
            sessionTokenHash: hashSessionToken(sessionToken),
            sessionExpiresAt: new Date(Date.now() + SESSION_DURATION_MS),
        });

        if (result.status === 'credentials-required') {
            throw new BadRequestException(
                'Name and a password are required to create your account.',
            );
        }
        if (result.status === 'already-member') {
            throw new ConflictException(
                'This account already belongs to the invited workspace.',
            );
        }
        if (result.status === 'account-unavailable') {
            throw new ForbiddenException(
                'This account cannot accept the invitation.',
            );
        }
        if (result.status !== 'accepted') {
            throw new BadRequestException('This invitation is invalid or expired.');
        }

        return {
            token: sessionToken,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                memberships: [result.membership],
                activeMembership: result.membership,
            } satisfies AuthenticatedUser,
        };
    }

    async logout(token: string | undefined): Promise<void> {
        if (token) {
            await this.authRepository.revokeSession(hashSessionToken(token));
        }
    }

    private async performDummyPasswordWork(password: string): Promise<boolean> {
        await hashPassword(password);
        return false;
    }
}
