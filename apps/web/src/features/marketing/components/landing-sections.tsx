import Link from "next/link";

export function LandingSections() {
    return (
        <>
            <section className="principles-section" id="product">
                <div className="wrap principles-wrap">
                    <div className="section-heading">
                        <span className="eyebrow">
                            LESS SCATTER. MORE SIGNAL.
                        </span>
                        <h2>
                            Good work needs
                            <br />a little room to breathe.
                        </h2>
                    </div>
                    <div className="principle-grid" id="principles">
                        <article className="principle-card">
                            <span className="principle-number">01</span>
                            <div className="principle-icon icon-sun">✳</div>
                            <h3>Start with the whole picture.</h3>
                            <p>
                                Give your people a shared view of what matters,
                                who’s involved, and what comes next.
                            </p>
                        </article>
                        <article className="principle-card">
                            <span className="principle-number">02</span>
                            <div className="principle-icon icon-lines">⌁</div>
                            <h3>Keep the context close.</h3>
                            <p>
                                Bring your workspace and team together so the
                                details don’t get lost between conversations.
                            </p>
                        </article>
                        <article className="principle-card">
                            <span className="principle-number">03</span>
                            <div className="principle-icon icon-squares">▦</div>
                            <h3>Grow at your own pace.</h3>
                            <p>
                                Begin with a simple space for your team. Let the
                                way you work shape what it becomes.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="closing-cta wrap">
                <div className="closing-orbit orbit-one" />
                <div className="closing-orbit orbit-two" />
                <div className="closing-content">
                    <span className="eyebrow">A GOOD PLACE TO BEGIN</span>
                    <h2>
                        Make space for
                        <br />
                        your team’s next idea.
                    </h2>
                    <p>Set up your workspace in a couple of minutes.</p>
                    <Link className="button button-light" href="/signup">
                        Create your workspace <span aria-hidden="true">↗</span>
                    </Link>
                </div>
                <div className="closing-asterisk" aria-hidden="true">
                    ✳
                </div>
            </section>
        </>
    );
}
