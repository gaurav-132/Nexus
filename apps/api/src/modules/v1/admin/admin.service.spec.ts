import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AdminService } from './admin.service.js';

describe('AdminService', () => {
    it('denies accounts without an explicit platform grant', async () => {
        const service = new AdminService(
            { isPlatformAdmin: vi.fn(async () => false) } as never,
            {} as never,
        );

        await expect(service.assertPlatformAdmin('user-1')).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    it('uses the tenants module for workspace listing', async () => {
        const tenantPage = { data: [], page: 1, pageSize: 20, total: 0 };
        const tenantService = { list: vi.fn(async () => tenantPage) };
        const service = new AdminService({} as never, tenantService as never);

        await expect(
            service.listTenants({ page: 1, pageSize: 20 }),
        ).resolves.toEqual(tenantPage);
        expect(tenantService.list).toHaveBeenCalledWith({
            page: 1,
            pageSize: 20,
        });
    });
});
