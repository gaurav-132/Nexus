export interface ManagedTenant {
    id: string;
    name: string;
    slug: string;
    status: "active" | "suspended";
    createdAt: string;
    updatedAt?: string;
    memberCount?: number;
    members?: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        joinedAt: string;
    }>;
}

export interface TenantPage {
    data: ManagedTenant[];
    page: number;
    pageSize: number;
    total: number;
}

interface ApiEnvelope<T> {
    success: boolean;
    data?: T;
    error?: { message?: string; details?: unknown; requestId?: string };
}

export class AdminApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AdminApiError";
    }
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`/api/v1/admin${path}`, {
            ...init,
            headers: {
                Accept: "application/json",
                ...(init?.body ? { "Content-Type": "application/json" } : {}),
                ...init?.headers,
            },
            credentials: "same-origin",
            cache: "no-store",
        });
    } catch {
        throw new AdminApiError("Nexus couldn’t reach the server. Try again.");
    }

    let body: ApiEnvelope<T>;
    try {
        body = (await response.json()) as ApiEnvelope<T>;
    } catch {
        throw new AdminApiError("The server returned an unreadable response.");
    }
    if (!response.ok || !body.success || body.data === undefined) {
        throw new AdminApiError(
            body.error?.message ?? "The request could not be completed.",
        );
    }
    return body.data;
}

export function listManagedTenants(input: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
}): Promise<TenantPage> {
    const params = new URLSearchParams({
        page: String(input.page),
        pageSize: String(input.pageSize),
    });
    if (input.search) params.set("search", input.search);
    if (input.status) params.set("status", input.status);
    return adminRequest(`/tenants?${params.toString()}`);
}

export function getManagedTenant(id: string): Promise<ManagedTenant> {
    return adminRequest(`/tenants/${id}`);
}

export function updateManagedTenant(
    id: string,
    changes: Partial<Pick<ManagedTenant, "name" | "slug" | "status">>,
): Promise<ManagedTenant> {
    return adminRequest(`/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
    });
}
