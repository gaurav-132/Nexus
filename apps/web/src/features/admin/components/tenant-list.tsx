"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import Link from "next/link";

import {
    AdminApiError,
    listManagedTenants,
    updateManagedTenant,
} from "@/features/admin/api/client";

export function TenantList() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const deferredSearch = useDeferredValue(search);
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["admin", "tenants", page, deferredSearch, status],
        queryFn: () =>
            listManagedTenants({
                page,
                pageSize: 20,
                search: deferredSearch || undefined,
                status: status || undefined,
            }),
    });
    const mutation = useMutation({
        mutationFn: (input: { id: string; status: "active" | "suspended" }) =>
            updateManagedTenant(input.id, { status: input.status }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] }),
    });
    const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));

    return (
        <section className="tenant-admin-card">
            <div className="tenant-admin-toolbar">
                <label className="admin-search">
                    <span aria-hidden="true">⌕</span>
                    <input
                        aria-label="Search workspaces"
                        placeholder="Search by workspace name or URL"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                    />
                </label>
                <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {query.isPending ? (
                <div className="admin-table-message">Loading workspaces…</div>
            ) : query.error ? (
                <div className="admin-table-message admin-error" role="alert">
                    {query.error instanceof AdminApiError
                        ? query.error.message
                        : "Could not load workspaces. Try again."}
                    <button type="button" onClick={() => query.refetch()}>
                        Retry
                    </button>
                </div>
            ) : query.data?.data.length ? (
                <>
                    <div className="admin-table-wrap">
                        <table className="tenant-table">
                            <thead>
                                <tr>
                                    <th>WORKSPACE</th>
                                    <th>STATUS</th>
                                    <th>MEMBERS</th>
                                    <th>CREATED</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {query.data.data.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td>
                                            <Link
                                                href={`/admin/tenants/${tenant.id}`}
                                                className="tenant-name-link"
                                            >
                                                <b>{tenant.name}</b>
                                                <small>/{tenant.slug}</small>
                                            </Link>
                                        </td>
                                        <td>
                                            <span
                                                className={`tenant-status tenant-status-${tenant.status}`}
                                            >
                                                <i /> {tenant.status}
                                            </span>
                                        </td>
                                        <td>{tenant.memberCount ?? 0}</td>
                                        <td>
                                            {new Intl.DateTimeFormat("en", {
                                                dateStyle: "medium",
                                            }).format(new Date(tenant.createdAt))}
                                        </td>
                                        <td>
                                            <button
                                                className="tenant-status-action"
                                                type="button"
                                                disabled={mutation.isPending}
                                                onClick={() =>
                                                    mutation.mutate({
                                                        id: tenant.id,
                                                        status:
                                                            tenant.status ===
                                                            "active"
                                                                ? "suspended"
                                                                : "active",
                                                    })
                                                }
                                            >
                                                {tenant.status === "active"
                                                    ? "Suspend"
                                                    : "Reactivate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {mutation.error && (
                        <p className="admin-mutation-error" role="alert">
                            {mutation.error instanceof AdminApiError
                                ? mutation.error.message
                                : "Workspace update failed."}
                        </p>
                    )}
                    <div className="tenant-pagination">
                        <span>
                            {query.data.total} workspace
                            {query.data.total === 1 ? "" : "s"}
                        </span>
                        <div>
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                Previous
                            </button>
                            <span>
                                {page} / {pages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= pages}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="admin-table-message">
                    No workspaces match those filters.
                </div>
            )}
        </section>
    );
}
