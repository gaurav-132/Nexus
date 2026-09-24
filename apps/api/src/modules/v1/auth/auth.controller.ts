import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    Param,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import {
    getAllowedWebOrigins,
    isAllowedWebOrigin,
} from '../../../common/http/allowed-origins.js';
import {
    AuthGuard,
    CurrentUser,
    sessionTokenFromRequest,
    type AuthenticatedUser,
} from './auth-context.js';
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from './auth-security.js';
import { AuthService } from './auth.service.js';
import {
    acceptInvitationSchema,
    loginSchema,
    registerSchema,
    selectWorkspaceSchema,
} from './auth-input.schema.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly config: ConfigService,
    ) {}

    @Post('register')
    @HttpCode(201)
    async register(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        this.assertAllowedOrigin(request);
        const input = registerSchema.safeParse(request.body);
        if (!input.success) {
            throw new BadRequestException({
                message: 'Please check the highlighted fields.',
                details: input.error.flatten().fieldErrors,
            });
        }

        const result = await this.authService.register(input.data);
        this.setSessionCookie(response, result.token);
        return result.user;
    }

    @Post('login')
    @HttpCode(200)
    async login(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        this.assertAllowedOrigin(request);
        const input = loginSchema.safeParse(request.body);
        if (!input.success) {
            throw new BadRequestException({
                message: 'Please check the highlighted fields.',
                details: input.error.flatten().fieldErrors,
            });
        }

        const result = await this.authService.login(input.data);
        this.setSessionCookie(response, result.token);
        return result.user;
    }

    @Post('invitations/:token/accept')
    @HttpCode(200)
    async acceptInvitation(
        @Param('token') token: string,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        this.assertAllowedOrigin(request);
        const input = acceptInvitationSchema.safeParse(request.body ?? {});
        if (!input.success) {
            throw new BadRequestException({
                message: 'Please check the highlighted fields.',
                details: input.error.flatten().fieldErrors,
            });
        }

        const result = await this.authService.acceptInvitation(
            token,
            input.data,
        );
        this.setSessionCookie(response, result.token);
        return result.user;
    }

    @Get('me')
    @UseGuards(AuthGuard)
    currentUser(@CurrentUser() user: AuthenticatedUser) {
        return user;
    }

    @Post('select-workspace')
    @HttpCode(200)
    @UseGuards(AuthGuard)
    async selectWorkspace(@Req() request: Request) {
        this.assertAllowedOrigin(request);
        const input = selectWorkspaceSchema.safeParse(request.body);
        if (!input.success) {
            throw new BadRequestException({
                message: 'Please provide a valid workspace.',
                details: input.error.flatten().fieldErrors,
            });
        }

        await this.authService.selectWorkspace(
            sessionTokenFromRequest(request),
            input.data.tenantSlug,
        );
        return { workspaceSelected: true };
    }

    @Post('logout')
    @HttpCode(200)
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        this.assertAllowedOrigin(request);
        await this.authService.logout(sessionTokenFromRequest(request));
        response.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions());
        return { signedOut: true };
    }

    private assertAllowedOrigin(request: Request): void {
        const origin = request.headers.origin;
        if (!origin) return;

        if (!isAllowedWebOrigin(origin, getAllowedWebOrigins(this.config))) {
            throw new ForbiddenException('This request origin is not allowed.');
        }
    }

    private setSessionCookie(response: Response, token: string): void {
        response.cookie(SESSION_COOKIE_NAME, token, {
            ...this.cookieOptions(),
            maxAge: SESSION_DURATION_MS,
        });
    }

    private cookieOptions() {
        return {
            httpOnly: true,
            secure: this.config.get<string>('NODE_ENV') === 'production',
            sameSite: 'strict' as const,
            path: '/',
        };
    }
}
