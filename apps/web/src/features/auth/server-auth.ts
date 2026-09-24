import { cookies } from "next/headers";

export interface CurrentMembership {
    id: string;
    role: string;
    tenant: { id: string; name: string; slug: string };
}

export interface CurrentUser {
    id: string;
    email: string;
    name: string;
    memberships: CurrentMembership[];
    activeMembership: CurrentMembership | null;
}

export type WorkspaceUser = Omit<CurrentUser, "activeMembership"> & {
    activeMembership: CurrentMembership;
};

interface AuthEnvelope {
    success: boolean;
    data?: CurrentUser;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const sessionToken = (await cookies()).get("nexus_session")?.value;
    if (!sessionToken) return null;

    const apiOrigin = process.env.API_SERVER_URL ?? "http://localhost:3001";
    try {
        const response = await fetch(`${apiOrigin}/api/v1/auth/me`, {
            headers: { Cookie: `nexus_session=${sessionToken}` },
            cache: "no-store",
        });
        if (!response.ok) return null;

        const result = (await response.json()) as AuthEnvelope;
        return result.success && result.data ? result.data : null;
    } catch {
        return null;
    }
}
