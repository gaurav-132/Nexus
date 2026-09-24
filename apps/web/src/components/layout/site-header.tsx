import Link from "next/link";

import { Brand } from "@/components/layout/brand";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
    return (
        <header className="site-header wrap">
            <Brand />
            {!compact && (
                <nav className="site-nav" aria-label="Main navigation">
                    <Link href="/#product">The idea</Link>
                    <Link href="/#principles">How we work</Link>
                </nav>
            )}
            <div className="header-actions">
                <Link className="header-signin" href="/login">
                    Sign in
                </Link>
                <Link className="button button-small" href="/signup">
                    Get started <span aria-hidden="true">↗</span>
                </Link>
            </div>
        </header>
    );
}
