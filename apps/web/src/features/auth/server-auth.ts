import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface CurrentUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: string;
    tenant: { id: string; name: string; slug: string };
}

interface AuthEnvelope {
    success: boolean;
    data?: CurrentUser;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
    const sessionToken = (await cookies()).get("nexus_session")?.value;
    if (!sessionToken) redirect("/login");

    const apiOrigin = process.env.API_SERVER_URL ?? "http://localhost:3001";
    try {
        const response = await fetch(`${apiOrigin}/api/v1/auth/me`, {
            headers: { Cookie: `nexus_session=${sessionToken}` },
            cache: "no-store",
        });
        if (!response.ok) redirect("/login");
        const result = (await response.json()) as AuthEnvelope;
        if (!result.success || !result.data) redirect("/login");
        return result.data;
    } catch (error) {
        if (error && typeof error === "object" && "digest" in error)
            throw error;
        redirect("/login");
    }
}
