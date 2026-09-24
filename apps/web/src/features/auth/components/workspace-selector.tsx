"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { AuthApiError, selectWorkspace } from "@/features/auth/api/client";
import type { CurrentUser } from "@/features/auth/server-auth";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export function WorkspaceSelector({ user }: { user: CurrentUser }) {
    const router = useRouter();
    const selection = useMutation({
        mutationFn: selectWorkspace,
        onSuccess: () => router.refresh(),
    });
    const errorMessage =
        selection.error instanceof AuthApiError
            ? selection.error.message
            : selection.error
              ? "Couldn’t open that workspace. Please try again."
              : "";

    return (
        <main className="workspace-picker">
            <span className="eyebrow">YOUR NEXUS ACCOUNT</span>
            <h1>Choose a workspace</h1>
            <p>
                {user.name}, select the workspace you want to continue to.
            </p>
            <div className="workspace-picker-list">
                {user.memberships.map((membership) => (
                    <button
                        className="workspace-picker-option"
                        key={membership.id}
                        type="button"
                        disabled={selection.isPending}
                        onClick={() => selection.mutate(membership.tenant.slug)}
                    >
                        <span className="workspace-picker-avatar">
                            {membership.tenant.name[0]?.toUpperCase() ?? "N"}
                        </span>
                        <span className="workspace-picker-copy">
                            <b>{membership.tenant.name}</b>
                            <small>{membership.role}</small>
                        </span>
                        <span aria-hidden="true">↗</span>
                    </button>
                ))}
            </div>
            {selection.isPending && (
                <p className="workspace-picker-status" role="status">
                    Opening workspace…
                </p>
            )}
            {errorMessage && (
                <p className="workspace-picker-error" role="alert">
                    {errorMessage}
                </p>
            )}
            <div className="workspace-picker-footer">
                <span>Signed in as {user.email}</span>
                <SignOutButton />
            </div>
        </main>
    );
}
