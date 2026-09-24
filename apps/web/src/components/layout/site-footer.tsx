import Link from "next/link";

import { Brand } from "@/components/layout/brand";

export function SiteFooter() {
    return (
        <footer className="site-footer wrap">
            <div className="footer-main">
                <Brand />
                <p>Bring your team’s work into focus.</p>
            </div>
            <div className="footer-links">
                <Link href="/#product">The idea</Link>
                <Link href="/login">Sign in</Link>
                <Link href="/signup">Create a workspace</Link>
            </div>
            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} Nexus</span>
                <span>Made for teams building what’s next.</span>
            </div>
        </footer>
    );
}
