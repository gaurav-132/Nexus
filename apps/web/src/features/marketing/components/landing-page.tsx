import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LandingSections } from "@/features/marketing/components/landing-sections";
import { WorkspacePreview } from "@/features/marketing/components/workspace-preview";

export function LandingPage() {
    return (
        <div className="site-frame">
            <SiteHeader />
            <main>
                <section className="hero wrap">
                    <div className="hero-copy">
                        <div className="eyebrow">
                            <span className="eyebrow-dot" /> A workspace with
                            room to grow
                        </div>
                        <h1>
                            Bring your team’s work <span>into focus.</span>
                        </h1>
                        <p className="hero-lede">
                            Nexus gives your team one clear place to bring
                            people, priorities, and progress together.
                        </p>
                        <div className="hero-actions">
                            <Link className="button button-dark" href="/signup">
                                Create your workspace{" "}
                                <span aria-hidden="true">↗</span>
                            </Link>
                            <Link className="text-link" href="#product">
                                See what Nexus is for{" "}
                                <span aria-hidden="true">↓</span>
                            </Link>
                        </div>
                        <div className="hero-note">
                            <span className="avatar-stack">
                                <i>A</i>
                                <i>M</i>
                                <i>J</i>
                            </span>
                            <span>Made for the way your team works.</span>
                        </div>
                    </div>

                    <WorkspacePreview />
                </section>

                <LandingSections />
            </main>
            <SiteFooter />
        </div>
    );
}
