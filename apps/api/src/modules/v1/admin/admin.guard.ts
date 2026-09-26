import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth-context.js';
import { AdminService } from './admin.service.js';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
    constructor(private readonly adminService: AdminService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        await this.adminService.assertPlatformAdmin(request.authUser.id);
        return true;
    }
}
