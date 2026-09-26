import { cookies } from "next/headers";

import type { TenantPage } from "./api/client";

export interface AdminOverview {
    tenants: number;
    active: number;
    suspended: number;
    members: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
    const sessionToken = (await cookies()).get("nexus_session")?.value;
    const apiOrigin = process.env.API_SERVER_URL ?? "http://localhost:3001";
    const response = await fetch(`${apiOrigin}/api/v1/admin/overview`, {
        headers: sessionToken
            ? { Cookie: `nexus_session=${sessionToken}` }
            : undefined,
        cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not load the platform overview.");
    const result = (await response.json()) as {
        success: boolean;
        data?: AdminOverview;
    };
    if (!result.success || !result.data) {
        throw new Error("Could not load the platform overview.");
    }
    return result.data;
}

export async function getAdminTenantPage(
    page: number,
    pageSize: number,
): Promise<TenantPage> {
    const sessionToken = (await cookies()).get("nexus_session")?.value;
    const apiOrigin = process.env.API_SERVER_URL ?? "http://localhost:3001";
    const response = await fetch(
        `${apiOrigin}/api/v1/admin/tenants?page=${page}&pageSize=${pageSize}`,
        {
            headers: sessionToken
                ? { Cookie: `nexus_session=${sessionToken}` }
                : undefined,
            cache: "no-store",
        },
    );
    if (!response.ok) throw new Error("Could not load workspace data.");
    const result = (await response.json()) as {
        success: boolean;
        data?: TenantPage;
    };
    if (!result.success || !result.data) {
        throw new Error("Could not load workspace data.");
    }
    return result.data;
}

export async function getAdminTenant(id: string) {
    const sessionToken = (await cookies()).get("nexus_session")?.value;
    const apiOrigin = process.env.API_SERVER_URL ?? "http://localhost:3001";
    const response = await fetch(`${apiOrigin}/api/v1/admin/tenants/${id}`, {
        headers: sessionToken
            ? { Cookie: `nexus_session=${sessionToken}` }
            : undefined,
        cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not load this workspace.");
    const result = (await response.json()) as { success: boolean; data?: unknown };
    if (!result.success || !result.data) {
        throw new Error("Could not load this workspace.");
    }
    return result.data as Awaited<ReturnType<typeof import("./api/client").getManagedTenant>>;
}
