function CheckIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 10 3.2 3.2L15.5 6" />
        </svg>
    );
}

export function WorkspacePreview() {
    return (
        <div
            className="hero-visual"
            aria-label="Preview of the Nexus team workspace"
        >
            <div className="visual-glow" />
            <div className="workspace-window">
                <div className="window-sidebar">
                    <div className="mini-brand">
                        <span className="brand-symbol">
                            <i />
                            <i />
                            <i />
                            <i />
                        </span>
                        <span>Nexus</span>
                    </div>
                    <div className="mini-workspace">
                        <span className="workspace-avatar">N</span>
                        <span>
                            <b>Northern Studio</b>
                            <small>Workspace</small>
                        </span>
                        <span className="mini-chevron">⌄</span>
                    </div>
                    <div className="mini-nav-label">WORKSPACE</div>
                    <div className="mini-nav active">
                        <span>◫</span> Overview
                    </div>
                    <div className="mini-nav">
                        <span>▧</span> Projects <small>04</small>
                    </div>
                    <div className="mini-nav">
                        <span>♧</span> People
                    </div>
                    <div className="mini-nav-label mini-lower">YOUR SPACE</div>
                    <div className="mini-nav">
                        <span>◷</span> My focus
                    </div>
                    <div className="mini-profile">
                        <span className="profile-dot">AM</span>
                        <span>
                            <b>Alex Morgan</b>
                            <small>Owner</small>
                        </span>
                        <span className="mini-more">···</span>
                    </div>
                </div>
                <div className="window-content">
                    <div className="preview-top">
                        <span>Thursday, September 24</span>
                        <span className="preview-search">
                            ⌕ <small>Search anything</small>
                            <kbd>⌘ K</kbd>
                        </span>
                    </div>
                    <div className="preview-welcome">
                        <div>
                            <span className="preview-overline">
                                YOUR WORKSPACE
                            </span>
                            <h3>
                                Good morning, Alex <span>✳</span>
                            </h3>
                            <p>Here’s a little clarity for the day ahead.</p>
                        </div>
                        <button aria-label="Create new item">＋</button>
                    </div>
                    <div className="preview-metrics">
                        <div>
                            <span>IN MOTION</span>
                            <b>08</b>
                            <small>
                                <i className="trend-up">↗</i> projects underway
                            </small>
                        </div>
                        <div>
                            <span>ON YOUR PLATE</span>
                            <b>03</b>
                            <small>things to focus on</small>
                        </div>
                        <div>
                            <span>YOUR PEOPLE</span>
                            <b>12</b>
                            <small>working together</small>
                        </div>
                    </div>
                    <div className="preview-section-head">
                        <b>In focus</b>
                        <span>
                            View all <i>↗</i>
                        </span>
                    </div>
                    <div className="focus-card">
                        <span className="focus-mark mark-lilac">◒</span>
                        <span className="focus-name">
                            <b>Website refresh</b>
                            <small>
                                Brand &amp; experience <i>·</i> 6 people
                            </small>
                        </span>
                        <span className="focus-progress">
                            <span>
                                <i style={{ width: "72%" }} />
                            </span>
                            <small>72%</small>
                        </span>
                    </div>
                    <div className="focus-card">
                        <span className="focus-mark mark-peach">◉</span>
                        <span className="focus-name">
                            <b>Fall launch plan</b>
                            <small>
                                Marketing <i>·</i> 4 people
                            </small>
                        </span>
                        <span className="focus-progress">
                            <span>
                                <i style={{ width: "46%" }} />
                            </span>
                            <small>46%</small>
                        </span>
                    </div>
                    <div className="focus-card">
                        <span className="focus-mark mark-mint">◇</span>
                        <span className="focus-name">
                            <b>Customer interviews</b>
                            <small>
                                Research <i>·</i> 3 people
                            </small>
                        </span>
                        <span className="focus-progress">
                            <span>
                                <i style={{ width: "88%" }} />
                            </span>
                            <small>88%</small>
                        </span>
                    </div>
                    <div className="window-bottom">
                        <span>
                            <i /> Everyone’s in sync
                        </span>
                        <span>Updated just now</span>
                    </div>
                </div>
            </div>
            <div className="floating-note">
                <span className="floating-check">
                    <CheckIcon />
                </span>
                <span>
                    <b>A little more clarity.</b>
                    <small>One place for the whole team.</small>
                </span>
            </div>
        </div>
    );
}
