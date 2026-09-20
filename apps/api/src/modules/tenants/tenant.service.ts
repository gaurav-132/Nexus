import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { DatabaseService } from '../../database/database.service.js';
import { tenants, users } from '../../database/schema/index.js';

export const createTenantWithOwnerSchema = z.object({
    tenantName: z.string().trim().min(2).max(120),
    tenantSlug: z
        .string()
        .trim()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    ownerEmail: z.string().trim().email().max(320),
    ownerPasswordHash: z.string().min(1).max(255),
    ownerFirstName: z.string().trim().min(1).max(80),
    ownerLastName: z.string().trim().max(80).optional(),
});

export type CreateTenantWithOwnerInput = z.infer<
    typeof createTenantWithOwnerSchema
>;

@Injectable()
export class TenantService {
    constructor(private readonly database: DatabaseService) {}

    async createTenantWithOwner(input: CreateTenantWithOwnerInput) {
        const validatedInput = createTenantWithOwnerSchema.parse(input);

        return this.database.db.transaction(async (tx) => {
            const tenantId = randomUUID();
            const ownerId = randomUUID();

            const [tenant] = await tx
                .insert(tenants)
                .values({
                    id: tenantId,
                    name: validatedInput.tenantName,
                    slug: validatedInput.tenantSlug,
                })
                .returning();

            const [owner] = await tx
                .insert(users)
                .values({
                    id: ownerId,
                    tenantId,
                    email: validatedInput.ownerEmail,
                    passwordHash: validatedInput.ownerPasswordHash,
                    firstName: validatedInput.ownerFirstName,
                    lastName: validatedInput.ownerLastName,
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
