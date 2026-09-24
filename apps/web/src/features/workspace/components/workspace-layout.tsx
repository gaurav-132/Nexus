import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireCurrentUser } from "@/features/auth/server-auth";

export default async function WorkspaceLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const user = await requireCurrentUser();
    const initials =
        `${user.firstName[0] ?? "N"}${user.lastName?.[0] ?? ""}`.toUpperCase();

    return (
        <div className="app-frame">
            <aside className="app-sidebar">
                <div className="app-brand-row">
                    <Brand />
                    <span className="sidebar-menu">⌘</span>
                </div>
                <div className="app-workspace-switch">
                    <span className="workspace-avatar">
                        {user.tenant.name[0]?.toUpperCase() ?? "N"}
                    </span>
                    <span className="workspace-switch-copy">
                        <b>{user.tenant.name}</b>
                        <small>Workspace</small>
                    </span>
                    <span className="mini-chevron">⌄</span>
                </div>
                <div className="app-nav-label">YOUR WORKSPACE</div>
                <nav className="app-nav" aria-label="Workspace navigation">
                    <Link className="app-nav-link selected" href="/app">
                        <span>◫</span>Overview
                    </Link>
                    <span className="app-nav-link disabled">
                        <span>▧</span>Projects <i>SOON</i>
                    </span>
                    <span className="app-nav-link disabled">
                        <span>♧</span>People <i>SOON</i>
                    </span>
                </nav>
                <div className="sidebar-spacer" />
                <div className="sidebar-bottom-note">
                    <span className="note-spark">✳</span>
                    <div>
                        <b>Start with what matters.</b>
                        <p>Nexus grows with your team.</p>
                    </div>
                </div>
                <div className="app-user-card">
                    <span className="user-avatar">{initials}</span>
                    <span className="user-card-copy">
                        <b>
                            {user.firstName} {user.lastName ?? ""}
                        </b>
                        <small>{user.role}</small>
                    </span>
                    <SignOutButton />
                </div>
            </aside>
            <div className="app-main-column">
                <header className="app-topbar">
                    <div className="breadcrumb">
                        <span>{user.tenant.name}</span>
                        <i>/</i>
                        <b>Overview</b>
                    </div>
                    <div className="topbar-right">
                        <span className="connection-status">
                            <i /> All systems ready
                        </span>
                        <span className="topbar-avatar">{initials}</span>
                    </div>
                </header>
                <main className="app-content">{children}</main>
                <footer className="app-footer">
                    <span>© {new Date().getFullYear()} Nexus</span>
                    <span>One team. One shared direction.</span>
                </footer>
            </div>
        </div>
    );
}
