import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthFormLoader } from "@/features/auth/components/form-loader";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
    const isSignup = mode === "signup";
    return (
        <div className="site-frame auth-page">
            <SiteHeader compact />
            <main className="auth-main wrap">
                <section className="auth-panel">
                    <div className="auth-heading">
                        <span className="eyebrow">
                            {isSignup
                                ? "A GOOD PLACE TO BEGIN"
                                : "WELCOME BACK"}
                        </span>
                        <h1>
                            {isSignup ? (
                                <>
                                    Make a little
                                    <br />
                                    room for <span>what’s next.</span>
                                </>
                            ) : (
                                <>
                                    Pick up where
                                    <br />
                                    your team <span>left off.</span>
                                </>
                            )}
                        </h1>
                        <p>
                            {isSignup
                                ? "Create a home for your team’s work. Your workspace is ready in a couple of minutes."
                                : "Sign in to your Nexus workspace and get back in sync."}
                        </p>
                    </div>
                    <AuthFormLoader mode={mode} />
                    <div className="auth-reassurance">
                        <span className="reassurance-icon">✳</span>
                        <span>
                            <b>Your team, in one place.</b>
                            <small>
                                Workspace access is private to your team.
                            </small>
                        </span>
                        <span className="reassurance-arrow">↗</span>
                    </div>
                </section>
                <aside className="auth-aside">
                    <div className="aside-shape shape-large" />
                    <div className="aside-shape shape-small" />
                    <div className="aside-content">
                        <span className="aside-kicker">
                            <i /> A SPACE TO MOVE FORWARD
                        </span>
                        <h2>
                            Clearer work.
                            <br />
                            Closer teams.
                        </h2>
                        <p>
                            Bring the people and priorities behind your work
                            into the same conversation.
                        </p>
                        <div className="aside-pills">
                            <span>People</span>
                            <i>·</i>
                            <span>Priorities</span>
                            <i>·</i>
                            <span>Progress</span>
                        </div>
                    </div>
                    <div className="aside-quote">
                        <span className="quote-mark">“</span>
                        <p>
                            The best work happens when everyone can see where
                            they fit.
                        </p>
                        <span className="quote-rule" />
                    </div>
                    <span className="aside-coordinate">
                        NEXUS / YOUR TEAM’S SPACE
                    </span>
                </aside>
            </main>
            <SiteFooter />
        </div>
    );
}
