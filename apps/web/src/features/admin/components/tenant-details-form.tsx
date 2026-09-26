"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
    AdminApiError,
    updateManagedTenant,
    type ManagedTenant,
} from "@/features/admin/api/client";

export function TenantDetailsForm({ tenant }: { tenant: ManagedTenant }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [name, setName] = useState(tenant.name);
    const [slug, setSlug] = useState(tenant.slug);
    const mutation = useMutation({
        mutationFn: (values: { name: string; slug: string }) =>
            updateManagedTenant(tenant.id, values),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
            router.refresh();
        },
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        mutation.mutate({ name: name.trim(), slug: slug.trim().toLowerCase() });
    }

    return (
        <form className="tenant-details-form" onSubmit={submit}>
            <label>
                Workspace name
                <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>
            <label>
                Workspace URL
                <div className="tenant-slug-input">
                    <span>nexus.app/</span>
                    <input
                        required
                        minLength={3}
                        maxLength={80}
                        pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                    />
                </div>
            </label>
            {mutation.error && (
                <p className="admin-mutation-error" role="alert">
                    {mutation.error instanceof AdminApiError
                        ? mutation.error.message
                        : "Could not update workspace."}
                </p>
            )}
            {mutation.isSuccess && (
                <p className="admin-success" role="status">Workspace updated.</p>
            )}
            <button className="admin-primary-button" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save changes"}
            </button>
        </form>
    );
}
