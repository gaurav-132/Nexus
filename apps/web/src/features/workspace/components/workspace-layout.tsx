import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { WorkspaceUser } from "@/features/auth/server-auth";

export default async function WorkspaceLayout({
    children,
    user,
}: Readonly<{ children: React.ReactNode; user: WorkspaceUser }>) {
    const initials = user.name.slice(0, 2).toUpperCase();
    const membership = user.activeMembership;

    return (
        <div className="app-frame">
            <aside className="app-sidebar">
                <div className="app-brand-row">
                    <Brand />
                    <span className="sidebar-menu">⌘</span>
                </div>
                <div className="app-workspace-switch">
                    <span className="workspace-avatar">
                        {membership.tenant.name[0]?.toUpperCase() ?? "N"}
                    </span>
                    <span className="workspace-switch-copy">
                        <b>{membership.tenant.name}</b>
                        <small>Workspace</small>
                    </span>
                    <span className="mini-chevron">⌄</span>
                </div>
                <div className="app-nav-label">YOUR WORKSPACE</div>
                <nav className="app-nav" aria-label="Workspace navigation">
                    <Link className="app-nav-link selected" href="/">
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
                            {user.name}
                        </b>
                        <small>{membership.role}</small>
                    </span>
                    <SignOutButton />
                </div>
            </aside>
            <div className="app-main-column">
                <header className="app-topbar">
                    <div className="breadcrumb">
                        <span>{membership.tenant.name}</span>
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
