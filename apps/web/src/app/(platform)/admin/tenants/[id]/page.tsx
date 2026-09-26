import Link from "next/link";
import { notFound } from "next/navigation";

import { TenantDetailsForm } from "@/features/admin/components/tenant-details-form";
import type { ManagedTenant } from "@/features/admin/api/client";
import { getAdminTenant } from "@/features/admin/server";

export default async function AdminTenantDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        notFound();
    }
    let tenant: ManagedTenant;
    try {
        tenant = await getAdminTenant(id);
    } catch {
        notFound();
    }

    return (
        <>
            <div className="admin-page-heading">
                <div>
                    <Link href="/admin/tenants" className="admin-back-link">
                        ← All tenants
                    </Link>
                    <span className="eyebrow">WORKSPACE DETAILS</span>
                    <h1>{tenant.name}</h1>
                    <p>/{tenant.slug} · {tenant.members?.length ?? 0} members</p>
                </div>
                <span className={`tenant-status tenant-status-${tenant.status}`}>
                    <i /> {tenant.status}
                </span>
            </div>
            <section className="admin-detail-grid">
                <article className="tenant-admin-card">
                    <span className="eyebrow">GENERAL</span>
                    <h2>Workspace settings</h2>
                    <TenantDetailsForm tenant={tenant} />
                </article>
                <article className="tenant-admin-card tenant-meta-card">
                    <span className="eyebrow">ACCOUNT</span>
                    <h2>Workspace record</h2>
                    <dl>
                        <div><dt>Tenant ID</dt><dd>{tenant.id}</dd></div>
                        <div><dt>Created</dt><dd>{new Date(tenant.createdAt).toLocaleString()}</dd></div>
                        <div><dt>Members</dt><dd>{tenant.members?.length ?? 0}</dd></div>
                    </dl>
                </article>
            </section>
            <section className="tenant-admin-card admin-members-card">
                <div className="admin-section-heading">
                    <div>
                        <span className="eyebrow">ACCESS</span>
                        <h2>Workspace members</h2>
                    </div>
                </div>
                {tenant.members?.length ? (
                    <div className="admin-table-wrap">
                        <table className="tenant-table">
                            <thead><tr><th>PERSON</th><th>ROLE</th><th>STATUS</th><th>JOINED</th></tr></thead>
                            <tbody>
                                {tenant.members.map((member) => (
                                    <tr key={member.id}>
                                        <td><b>{member.name}</b><small className="member-email">{member.email}</small></td>
                                        <td>{member.role}</td>
                                        <td>{member.status}</td>
                                        <td>{new Date(member.joinedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="admin-empty">No members are attached to this workspace.</p>
                )}
            </section>
        </>
    );
}
