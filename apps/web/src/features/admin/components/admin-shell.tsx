import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { CurrentUser } from "@/features/auth/server-auth";

export function AdminShell({
    children,
    user,
}: Readonly<{ children: React.ReactNode; user: CurrentUser }>) {
    return (
        <div className="admin-frame">
            <aside className="admin-sidebar">
                <Link href="/" className="admin-brand">
                    <Brand />
                    <span>CONTROL ROOM</span>
                </Link>
                <span className="admin-nav-label">PLATFORM</span>
                <nav className="admin-nav" aria-label="Admin navigation">
                    <Link href="/admin">Overview</Link>
                    <Link href="/admin/tenants">Tenants</Link>
                </nav>
                <div className="admin-sidebar-bottom">
                    <span>Signed in as</span>
                    <b>{user.name}</b>
                    <small>{user.email}</small>
                    <SignOutButton />
                </div>
            </aside>
            <div className="admin-main">
                <header className="admin-topbar">
                    <span>NEXUS / PLATFORM ADMIN</span>
                    <span className="admin-secure"><i /> SECURE SESSION</span>
                </header>
                <main className="admin-content">{children}</main>
                <footer className="admin-footer">
                    <span>Nexus Platform Administration</span>
                    <span>Operator actions are restricted and logged.</span>
                </footer>
            </div>
        </div>
    );
}

export function AdminAccessDenied({ email }: { email: string }) {
    return (
        <main className="admin-denied">
            <span className="eyebrow">PLATFORM ADMINISTRATION</span>
            <h1>This account doesn’t have admin access.</h1>
            <p>
                Signed in as <b>{email}</b>. Contact a platform administrator
                to request access.
            </p>
            <SignOutButton />
        </main>
    );
}
