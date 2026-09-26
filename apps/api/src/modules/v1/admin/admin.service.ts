import {
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';

import { TenantService } from '../tenants/tenant.service.js';
import type { AuthenticatedUser } from '../auth/auth-context.js';
import type { TenantListQuery, UpdateTenantInput } from './admin-input.schema.js';
import { AdminRepository } from './admin.repository.js';

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
    );
}

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly tenantService: TenantService,
    ) {}

    isPlatformAdmin(userId: string) {
        return this.adminRepository.isPlatformAdmin(userId);
    }

    getCurrentAdmin(user: AuthenticatedUser) {
        return { id: user.id, email: user.email, name: user.name };
    }

    getOverview() {
        return this.tenantService.overview();
    }

    listTenants(query: TenantListQuery) {
        return this.tenantService.list(query);
    }

    getTenant(id: string) {
        return this.tenantService.getById(id);
    }

    async updateTenant(
        id: string,
        changes: UpdateTenantInput,
        actor: AuthenticatedUser,
    ) {
        try {
            const tenant = await this.tenantService.update(id, changes);
            this.logger.log(
                JSON.stringify({
                    event: 'platform_tenant_updated',
                    actorUserId: actor.id,
                    tenantId: tenant.id,
                    changedFields: Object.keys(changes),
                    requestRole: 'platform_admin',
                }),
            );
            return tenant;
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new ConflictException('That workspace URL is already in use.');
            }
            throw error;
        }
    }

    async assertPlatformAdmin(userId: string): Promise<void> {
        if (!(await this.isPlatformAdmin(userId))) {
            throw new ForbiddenException(
                'Platform administrator access is required.',
            );
        }
    }
}
