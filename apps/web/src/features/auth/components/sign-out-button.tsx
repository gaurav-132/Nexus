"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { AuthApiError, logout } from "@/features/auth/api/client";

export function SignOutButton() {
    const router = useRouter();
    const logoutMutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            router.replace("/");
            router.refresh();
        },
    });
    const errorMessage =
        logoutMutation.error instanceof AuthApiError
            ? logoutMutation.error.message
            : logoutMutation.error
              ? "Couldn’t sign out. Please try again."
              : "";

    return (
        <div className="signout-control">
            <button
                className="signout-button"
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
            >
                <span aria-hidden="true">↗</span>
                {logoutMutation.isPending ? "Signing out…" : "Sign out"}
            </button>
            {errorMessage && (
                <span className="signout-error" role="alert">
                    {errorMessage}
                </span>
            )}
        </div>
    );
}
