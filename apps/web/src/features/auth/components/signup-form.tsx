"use client";

import Link from "next/link";
import { useState } from "react";

import {
    AuthField,
    AuthInput,
    AuthSubmit,
} from "@/features/auth/components/form-controls";
import { slugifyWorkspace } from "@/features/auth/validation/schemas";
import { useAuthForm } from "@/features/auth/hooks/use-auth-form";

export function SignupForm() {
    const { busy, formError, fieldErrors, handleSubmit, clearFieldError } =
        useAuthForm("signup");
    const [workspaceSlug, setWorkspaceSlug] = useState("");
    const [slugWasEdited, setSlugWasEdited] = useState(false);

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-section-label">
                <span>01</span> YOUR WORKSPACE
            </div>
            <AuthField
                id="workspaceName"
                label="Workspace name"
                error={fieldErrors.workspaceName}
            >
                <AuthInput
                    id="workspaceName"
                    className="text-input"
                    name="workspaceName"
                    placeholder="e.g. Northern Studio"
                    autoComplete="organization"
                    maxLength={120}
                    onChange={(event) => {
                        clearFieldError("workspaceName");
                        if (!slugWasEdited)
                            setWorkspaceSlug(
                                slugifyWorkspace(event.currentTarget.value),
                            );
                    }}
                />
            </AuthField>
            <AuthField
                id="workspaceSlug"
                label="Workspace URL"
                error={fieldErrors.workspaceSlug}
                className="field-spaced"
            >
                <div className="slug-field">
                    <span>nexus.app/</span>
                    <AuthInput
                        id="workspaceSlug"
                        name="workspaceSlug"
                        value={workspaceSlug}
                        maxLength={40}
                        onChange={(event) => {
                            setSlugWasEdited(true);
                            setWorkspaceSlug(
                                slugifyWorkspace(event.currentTarget.value),
                            );
                            clearFieldError("workspaceSlug");
                        }}
                    />
                </div>
            </AuthField>

            <div className="form-section-label form-section-next">
                <span>02</span> YOUR ACCOUNT
            </div>
            <div className="form-row">
                <AuthField
                    id="firstName"
                    label="First name"
                    error={fieldErrors.firstName}
                >
                    <AuthInput
                        id="firstName"
                        className="text-input"
                        name="firstName"
                        autoComplete="given-name"
                        maxLength={80}
                        onChange={() => clearFieldError("firstName")}
                    />
                </AuthField>
                <AuthField
                    id="lastName"
                    label={
                        <>
                            Last name <em>Optional</em>
                        </>
                    }
                    error={fieldErrors.lastName}
                >
                    <AuthInput
                        id="lastName"
                        className="text-input"
                        name="lastName"
                        autoComplete="family-name"
                        maxLength={80}
                        onChange={() => clearFieldError("lastName")}
                    />
                </AuthField>
            </div>
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
                    autoComplete="email"
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
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    placeholder="At least 12 characters"
                    onChange={() => clearFieldError("password")}
                />
            </AuthField>
            <AuthSubmit busy={busy} error={formError} mode="signup" />
            <div className="auth-switch">
                Already have a workspace? <Link href="/login">Sign in</Link>
            </div>
        </form>
    );
}
