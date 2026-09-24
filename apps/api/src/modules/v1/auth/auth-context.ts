import {
    createParamDecorator,
    ExecutionContext,
    Injectable,
    type CanActivate,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service.js';
import { SESSION_COOKIE_NAME } from './auth-security.js';

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    memberships: AuthenticatedMembership[];
    activeMembership: AuthenticatedMembership | null;
}

export interface AuthenticatedMembership {
    id: string;
    role: 'owner' | 'admin' | 'member';
    tenant: { id: string; name: string; slug: string };
}

export interface AuthenticatedRequest extends Request {
    authUser: AuthenticatedUser;
}

export function sessionTokenFromRequest(request: Request): string | undefined {
    const cookie = request.headers.cookie
        ?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

    return cookie?.slice(SESSION_COOKIE_NAME.length + 1);
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        request.authUser = await this.authService.currentUser(
            sessionTokenFromRequest(request),
        );
        return true;
    }
}

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext) =>
        context.switchToHttp().getRequest<AuthenticatedRequest>().authUser,
);
