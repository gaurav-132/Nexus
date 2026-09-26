import { AuthPage } from "@/features/auth/components/auth-page";
import { hasPlatformAdminAccess } from "@/features/auth/server-auth";

export default async function AdminLoginPage() {
    if (await hasPlatformAdminAccess()) {
        const { redirect } = await import("next/navigation");
        redirect("/admin");
    }
    return <AuthPage mode="login" redirectTo="/admin" />;
}
