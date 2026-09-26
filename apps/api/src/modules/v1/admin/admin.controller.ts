import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import {
    getAllowedWebOrigins,
    isAllowedWebOrigin,
} from '../../../common/http/allowed-origins.js';
import {
    AuthGuard,
    CurrentUser,
    type AuthenticatedUser,
} from '../auth/auth-context.js';
import { AdminService } from './admin.service.js';
import {
    tenantListQuerySchema,
    updateTenantSchema,
} from './admin-input.schema.js';
import { PlatformAdminGuard } from './admin.guard.js';

@Controller('admin')
@UseGuards(AuthGuard, PlatformAdminGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly config: ConfigService,
    ) {}

    @Get('me')
    currentAdmin(@CurrentUser() user: AuthenticatedUser) {
        return this.adminService.getCurrentAdmin(user);
    }

    @Get('overview')
    overview() {
        return this.adminService.getOverview();
    }

    @Get('tenants')
    listTenants(@Query() query: Record<string, unknown>) {
        const parsed = tenantListQuerySchema.safeParse(query);
        if (!parsed.success) {
            throw new BadRequestException({
                message: 'Please provide valid tenant filters.',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        return this.adminService.listTenants(parsed.data);
    }

    @Get('tenants/:id')
    getTenant(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.adminService.getTenant(id);
    }

    @Patch('tenants/:id')
    updateTenant(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Req() request: Request,
    ) {
        const origin = request.headers.origin;
        if (
            origin &&
            !isAllowedWebOrigin(origin, getAllowedWebOrigins(this.config))
        ) {
            throw new ForbiddenException('This request origin is not allowed.');
        }

        const parsed = updateTenantSchema.safeParse(request.body);
        if (!parsed.success) {
            throw new BadRequestException({
                message: 'Please provide valid workspace details.',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        return this.adminService.updateTenant(id, parsed.data, user);
    }
}
