"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function signOut() {
        setBusy(true);
        try {
            await fetch("/api/v1/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: "{}",
            });
        } finally {
            router.replace("/login");
            router.refresh();
            setBusy(false);
        }
    }

    return (
        <button
            className="signout-button"
            type="button"
            onClick={signOut}
            disabled={busy}
        >
            <span aria-hidden="true">↗</span>
            {busy ? "Signing out…" : "Sign out"}
        </button>
    );
}
