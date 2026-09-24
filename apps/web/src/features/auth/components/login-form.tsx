"use client";

import Link from "next/link";

import {
    AuthField,
    AuthInput,
    AuthSubmit,
} from "@/features/auth/components/form-controls";
import { useAuthForm } from "@/features/auth/hooks/use-auth-form";

export function LoginForm() {
    const { busy, formError, fieldErrors, handleSubmit, clearFieldError } =
        useAuthForm("login");

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <AuthField
                id="workspaceSlug"
                label="Workspace URL"
                error={fieldErrors.workspaceSlug}
            >
                <div className="slug-field login-slug">
                    <span>nexus.app/</span>
                    <AuthInput
                        id="workspaceSlug"
                        name="workspaceSlug"
                        placeholder="your-workspace"
                        autoComplete="organization"
                        maxLength={40}
                        onChange={() => clearFieldError("workspaceSlug")}
                    />
                </div>
            </AuthField>
            <p className="field-hint">
                The address your team chose when setting up Nexus.
            </p>

            <AuthField
                id="email"
                label="Work email"
                error={fieldErrors.email}
                className="field-spaced"
            >
                <AuthInput
                    id="email"
                    className="text-input"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@company.com"
                    maxLength={320}
                    onChange={() => clearFieldError("email")}
                />
            </AuthField>
            <AuthField
                id="password"
                label="Password"
                error={fieldErrors.password}
                className="field-spaced"
            >
                <AuthInput
                    id="password"
                    className="text-input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    maxLength={128}
                    onChange={() => clearFieldError("password")}
                />
            </AuthField>

            <AuthSubmit busy={busy} error={formError} mode="login" />
            <div className="auth-switch">
                New to Nexus? <Link href="/signup">Create a workspace</Link>
            </div>
        </form>
    );
}
