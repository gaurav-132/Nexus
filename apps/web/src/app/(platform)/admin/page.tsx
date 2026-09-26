import Link from "next/link";

import {
    getAdminOverview,
    getAdminTenantPage,
} from "@/features/admin/server";

export default async function AdminHomePage() {
    const [overview, tenants] = await Promise.all([
        getAdminOverview(),
        getAdminTenantPage(1, 6),
    ]);

    return (
        <>
            <div className="admin-page-heading">
                <div>
                    <span className="eyebrow">PLATFORM OVERVIEW</span>
                    <h1>Good morning.</h1>
                    <p>Manage Nexus workspaces and their platform access.</p>
                </div>
                <Link className="admin-primary-button" href="/admin/tenants">
                    Manage tenants <span aria-hidden="true">↗</span>
                </Link>
            </div>
            <section className="admin-metrics" aria-label="Platform totals">
                <article>
                    <span>ALL WORKSPACES</span>
                    <b>{overview.tenants}</b>
                    <small>Created in Nexus</small>
                </article>
                <article>
                    <span>ACTIVE</span>
                    <b>{overview.active}</b>
                    <small>Available to their teams</small>
                </article>
                <article>
                    <span>SUSPENDED</span>
                    <b>{overview.suspended}</b>
                    <small>Access paused</small>
                </article>
                <article>
                    <span>MEMBERS</span>
                    <b>{overview.members}</b>
                    <small>Across all workspaces</small>
                </article>
            </section>
            <section className="admin-recent-card">
                <div className="admin-section-heading">
                    <div>
                        <span className="eyebrow">RECENTLY CREATED</span>
                        <h2>New workspaces</h2>
                    </div>
                    <Link href="/admin/tenants">View all →</Link>
                </div>
                {tenants.data.length ? (
                    <div className="admin-recent-list">
                        {tenants.data.slice(0, 6).map((tenant) => (
                            <Link
                                href={`/admin/tenants/${tenant.id}`}
                                key={tenant.id}
                                className="admin-recent-row"
                            >
                                <span className="admin-tenant-monogram">
                                    {tenant.name.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="admin-recent-name">
                                    <b>{tenant.name}</b>
                                    <small>/{tenant.slug}</small>
                                </span>
                                <span className={`tenant-status tenant-status-${tenant.status}`}>
                                    <i /> {tenant.status}
                                </span>
                                <span className="admin-recent-arrow">↗</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="admin-empty">No workspaces yet.</p>
                )}
            </section>
        </>
    );
}
