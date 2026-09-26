import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';

import { DatabaseService } from '../../../database/database.service.js';
import { memberships, tenants, users } from '../../../database/schema/index.js';

export interface TenantListQuery {
    page: number;
    pageSize: number;
    search?: string;
    status?: 'active' | 'suspended';
}

export interface TenantUpdate {
    name?: string;
    slug?: string;
    status?: 'active' | 'suspended';
}

@Injectable()
export class TenantRepository {
    constructor(private readonly database: DatabaseService) {}

    async overview() {
        const [total, active, suspended, memberCount] = await Promise.all([
            this.database.db.select({ value: count() }).from(tenants),
            this.database.db
                .select({ value: count() })
                .from(tenants)
                .where(eq(tenants.status, 'active')),
            this.database.db
                .select({ value: count() })
                .from(tenants)
                .where(eq(tenants.status, 'suspended')),
            this.database.db
                .select({ value: count() })
                .from(memberships),
        ]);
        return {
            tenants: total[0]?.value ?? 0,
            active: active[0]?.value ?? 0,
            suspended: suspended[0]?.value ?? 0,
            members: memberCount[0]?.value ?? 0,
        };
    }

    async list(query: TenantListQuery) {
        const conditions: SQL[] = [];
        if (query.status) conditions.push(eq(tenants.status, query.status));
        if (query.search) {
            const pattern = `%${query.search}%`;
            conditions.push(
                or(ilike(tenants.name, pattern), ilike(tenants.slug, pattern))!,
            );
        }
        const where = conditions.length ? and(...conditions) : undefined;
        const [total] = await this.database.db
            .select({ value: count() })
            .from(tenants)
            .where(where);
        const data = await this.database.db
            .select({
                id: tenants.id,
                name: tenants.name,
                slug: tenants.slug,
                status: tenants.status,
                createdAt: tenants.createdAt,
                memberCount: this.database.db.$count(
                    memberships,
                    eq(memberships.tenantId, tenants.id),
                ),
            })
            .from(tenants)
            .where(where)
            .orderBy(desc(tenants.createdAt))
            .limit(query.pageSize)
            .offset((query.page - 1) * query.pageSize);

        return {
            data,
            page: query.page,
            pageSize: query.pageSize,
            total: total?.value ?? 0,
        };
    }

    async findById(id: string) {
        const [tenant] = await this.database.db
            .select({
                id: tenants.id,
                name: tenants.name,
                slug: tenants.slug,
                status: tenants.status,
                createdAt: tenants.createdAt,
                updatedAt: tenants.updatedAt,
            })
            .from(tenants)
            .where(eq(tenants.id, id))
            .limit(1);
        if (!tenant) return null;

        const members = await this.database.db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: memberships.role,
                status: memberships.status,
                joinedAt: memberships.createdAt,
            })
            .from(memberships)
            .innerJoin(users, eq(memberships.userId, users.id))
            .where(eq(memberships.tenantId, id))
            .orderBy(desc(memberships.createdAt));

        return { ...tenant, members };
    }

    async update(id: string, changes: TenantUpdate) {
        const [tenant] = await this.database.db
            .update(tenants)
            .set({ ...changes, updatedAt: new Date() })
            .where(eq(tenants.id, id))
            .returning({
                id: tenants.id,
                name: tenants.name,
                slug: tenants.slug,
                status: tenants.status,
                createdAt: tenants.createdAt,
                updatedAt: tenants.updatedAt,
            });
        return tenant ?? null;
    }
}
