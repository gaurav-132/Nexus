import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../database/database.service.js';
import { tenants, users } from '../../database/schema/index.js';

export interface CreateTenantWithOwnerInput {
    tenantName: string;
    tenantSlug: string;
    ownerEmail: string;
    ownerPasswordHash: string;
    ownerFirstName: string;
    ownerLastName?: string;
}

@Injectable()
export class TenantService {
    constructor(private readonly database: DatabaseService) {}

    async createTenantWithOwner(input: CreateTenantWithOwnerInput) {
        return this.database.db.transaction(async (tx) => {
            const tenantId = randomUUID();
            const ownerId = randomUUID();

            const [tenant] = await tx
                .insert(tenants)
                .values({
                    id: tenantId,
                    name: input.tenantName,
                    slug: input.tenantSlug,
                })
                .returning();

            const [owner] = await tx
                .insert(users)
                .values({
                    id: ownerId,
                    tenantId,
                    email: input.ownerEmail,
                    passwordHash: input.ownerPasswordHash,
                    firstName: input.ownerFirstName,
                    lastName: input.ownerLastName,
                    role: 'owner',
                })
                .returning();

            return {
                tenant,
                owner,
            };
        });
    }
}
