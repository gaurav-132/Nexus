import type { Metadata } from "next";

import type { WorkspaceUser } from "@/features/auth/server-auth";

export const metadata: Metadata = { title: "Workspace" };

function Sparkle() {
    return (
        <span className="empty-sparkle" aria-hidden="true">
            ✳
        </span>
    );
}

export default function WorkspaceHome({ user }: { user: WorkspaceUser }) {
    const [firstName] = user.name.split(" ");
    const membership = user.activeMembership;
    const today = new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date());

    return (
        <div className="dashboard-content">
            <div className="dashboard-heading">
                <div>
                    <span className="eyebrow">{today.toUpperCase()}</span>
                    <h1>
                        Good to have you here, {firstName}
                        <span className="heading-spark">✳</span>
                    </h1>
                    <p>
                        This is the shared home for everything happening at{" "}
                        {membership.tenant.name}.
                    </p>
                </div>
                <span className="workspace-live">
                    <i /> Workspace active
                </span>
            </div>
            <section className="dashboard-welcome-card">
                <div className="welcome-text">
                    <span className="welcome-kicker">YOUR SPACE IS READY</span>
                    <h2>
                        A clear place
                        <br />
                        to move forward.
                    </h2>
                    <p>
                        You’re the {membership.role} of <b>{membership.tenant.name}</b>.
                        Your workspace is set up and ready to grow with your
                        team.
                    </p>
                    <div className="welcome-tags">
                        <span>
                            <i>✓</i> Workspace created
                        </span>
                        <span>
                            <i>✓</i> Your account secured
                        </span>
                    </div>
                </div>
                <div className="welcome-art" aria-hidden="true">
                    <div className="art-ring ring-back" />
                    <div className="art-ring ring-front" />
                    <div className="art-square square-one">N</div>
                    <div className="art-square square-two">✳</div>
                    <div className="art-dot dot-one" />
                    <div className="art-dot dot-two" />
                    <span className="art-caption">
                        PEOPLE · PRIORITIES · PROGRESS
                    </span>
                </div>
            </section>
            <div className="dashboard-section-header">
                <div>
                    <span className="eyebrow">YOUR NEXT CHAPTER</span>
                    <h2>Make it yours.</h2>
                </div>
                <span className="muted-label">A good place to start</span>
            </div>
            <section className="next-steps-grid">
                <article className="next-step-card">
                    <span className="step-number">01</span>
                    <span className="step-icon step-icon-peach">♧</span>
                    <div>
                        <span className="step-status">COMING NEXT</span>
                        <h3>Bring your people in.</h3>
                        <p>
                            Give your team a shared place to see what’s
                            happening and where they fit.
                        </p>
                    </div>
                    <span className="step-arrow" aria-hidden="true">
                        ↗
                    </span>
                </article>
                <article className="next-step-card">
                    <span className="step-number">02</span>
                    <span className="step-icon step-icon-lilac">▧</span>
                    <div>
                        <span className="step-status">COMING NEXT</span>
                        <h3>Shape your first project.</h3>
                        <p>
                            Turn a good idea into a clear plan everyone can move
                            forward together.
                        </p>
                    </div>
                    <span className="step-arrow" aria-hidden="true">
                        ↗
                    </span>
                </article>
                <article className="next-step-card">
                    <span className="step-number">03</span>
                    <span className="step-icon step-icon-mint">◷</span>
                    <div>
                        <span className="step-status">COMING NEXT</span>
                        <h3>Find your team’s rhythm.</h3>
                        <p>
                            Keep priorities and progress visible as your work
                            takes shape.
                        </p>
                    </div>
                    <span className="step-arrow" aria-hidden="true">
                        ↗
                    </span>
                </article>
            </section>
            <section className="profile-strip">
                <div className="profile-strip-heading">
                    <span className="eyebrow">WORKSPACE DETAILS</span>
                    <h2>The essentials.</h2>
                </div>
                <div className="detail-cell">
                    <span>WORKSPACE URL</span>
                    <b>nexus.app/{membership.tenant.slug}</b>
                </div>
                <div className="detail-cell">
                    <span>YOUR ROLE</span>
                    <b className="role-badge">{membership.role}</b>
                </div>
                <div className="detail-cell">
                    <span>SIGNED IN AS</span>
                    <b>{user.email}</b>
                </div>
            </section>
            <section className="quiet-note">
                <Sparkle />
                <span>
                    <b>A thoughtful start.</b> The tools in your sidebar will
                    appear as Nexus grows around the way your team works.
                </span>
            </section>
        </div>
    );
}
