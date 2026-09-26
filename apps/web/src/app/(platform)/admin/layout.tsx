import { redirect } from "next/navigation";

import {
    AdminAccessDenied,
    AdminShell,
} from "@/features/admin/components/admin-shell";
import {
    getCurrentUser,
    hasPlatformAdminAccess,
} from "@/features/auth/server-auth";

export default async function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const user = await getCurrentUser();
    if (!user) redirect("/admin/login");
    if (!(await hasPlatformAdminAccess())) {
        return <AdminAccessDenied email={user.email} />;
    }
    return <AdminShell user={user}>{children}</AdminShell>;
}
