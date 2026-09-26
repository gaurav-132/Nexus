import { Injectable, NotFoundException } from '@nestjs/common';

import {
    TenantRepository,
    type TenantListQuery,
    type TenantUpdate,
} from './tenant.repository.js';

@Injectable()
export class TenantService {
    constructor(private readonly tenantRepository: TenantRepository) {}

    overview() {
        return this.tenantRepository.overview();
    }

    list(query: TenantListQuery) {
        return this.tenantRepository.list(query);
    }

    async getById(id: string) {
        const tenant = await this.tenantRepository.findById(id);
        if (!tenant) throw new NotFoundException('Workspace was not found.');
        return tenant;
    }

    async update(id: string, changes: TenantUpdate) {
        const tenant = await this.tenantRepository.update(id, changes);
        if (!tenant) throw new NotFoundException('Workspace was not found.');
        return tenant;
    }
}
