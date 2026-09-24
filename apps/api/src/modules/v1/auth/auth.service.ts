import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import type { AuthenticatedUser } from './auth-context.js';
import type { LoginInput, RegisterInput } from './auth-input.schema.js';
import {
    createSessionToken,
    hashPassword,
    hashSessionToken,
    SESSION_DURATION_MS,
    verifyPassword,
} from './auth-security.js';

function publicIdentity(identity: {
    id: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: AuthenticatedUser['role'];
    tenantName: string;
    tenantSlug: string;
}): AuthenticatedUser {
    return {
        id: identity.id,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        role: identity.role,
        tenant: {
            id: identity.tenantId,
            name: identity.tenantName,
            slug: identity.tenantSlug,
        },
    };
}

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
    );
}

@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository) {}

    async register(input: RegisterInput) {
        const token = createSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        const passwordHash = await hashPassword(input.password);

        try {
            const { user, tenant } = await this.authRepository.createAccount({
                workspaceName: input.workspaceName,
                workspaceSlug: input.workspaceSlug,
                email: input.email,
                passwordHash,
                firstName: input.firstName,
                lastName: input.lastName,
                sessionTokenHash: hashSessionToken(token),
                sessionExpiresAt: expiresAt,
            });

            return {
                token,
                user: publicIdentity({
                    ...user,
                    tenantName: tenant.name,
                    tenantSlug: tenant.slug,
                }),
            };
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new ConflictException(
                    'That workspace URL is already in use. Choose another one.',
                );
            }
            throw error;
        }
    }

    async login(input: LoginInput) {
        const identity = await this.authRepository.findCredentials(
            input.workspaceSlug,
            input.email,
        );

        const passwordMatches = identity
            ? await verifyPassword(input.password, identity.passwordHash)
            : await this.performDummyPasswordWork(input.password);

        if (
            !identity ||
            !passwordMatches ||
            identity.userStatus !== 'active' ||
            identity.tenantStatus !== 'active'
        ) {
            throw new UnauthorizedException(
                'Workspace, email, or password is incorrect.',
            );
        }

        const token = createSessionToken();
        await this.authRepository.createSession(
            identity.id,
            hashSessionToken(token),
            new Date(Date.now() + SESSION_DURATION_MS),
        );

        return { token, user: publicIdentity(identity) };
    }

    async currentUser(token: string | undefined) {
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

    async logout(token: string | undefined): Promise<void> {
        if (token) {
            await this.authRepository.deleteSession(hashSessionToken(token));
        }
    }

    private async performDummyPasswordWork(password: string): Promise<boolean> {
        await hashPassword(password);
        return false;
    }
}
