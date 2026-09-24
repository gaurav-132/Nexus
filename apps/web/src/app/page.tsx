import { AuthPage } from "@/features/auth/components/auth-page";
import { WorkspaceSelector } from "@/features/auth/components/workspace-selector";
import { getCurrentUser } from "@/features/auth/server-auth";
import WorkspaceHome from "@/features/workspace/components/workspace-home";
import WorkspaceLayout from "@/features/workspace/components/workspace-layout";

export default async function HomePage() {
    const user = await getCurrentUser();

    if (!user) return <AuthPage mode="login" />;
    const activeMembership = user.activeMembership;
    if (!activeMembership) return <WorkspaceSelector user={user} />;

    const workspaceUser = { ...user, activeMembership };

    return (
        <WorkspaceLayout user={workspaceUser}>
            <WorkspaceHome user={workspaceUser} />
        </WorkspaceLayout>
    );
}
