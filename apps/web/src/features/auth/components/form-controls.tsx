import type { InputHTMLAttributes, ReactNode } from "react";

type AuthFieldProps = {
    id: string;
    label: ReactNode;
    error?: string;
    className?: string;
    children: ReactNode;
};

export function AuthField({
    id,
    label,
    error,
    className,
    children,
}: AuthFieldProps) {
    return (
        <div className={className}>
            <label className="field-label" htmlFor={id}>
                {label}
            </label>
            {children}
            {error && (
                <span className="field-error" id={`${id}-error`}>
                    {error}
                </span>
            )}
        </div>
    );
}

export function AuthInput({
    error,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
    return (
        <input
            {...props}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${props.id}-error` : undefined}
        />
    );
}

export function AuthSubmit({
    busy,
    error,
    mode,
}: {
    busy: boolean;
    error: string;
    mode: "login" | "signup";
}) {
    const isSignup = mode === "signup";
    return (
        <>
            {error && (
                <div className="form-error" role="alert">
                    <span aria-hidden="true">!</span>
                    {error}
                </div>
            )}
            <button
                className="button button-dark auth-submit"
                type="submit"
                disabled={busy}
            >
                {busy ? (
                    <>
                        <span className="button-spinner" />
                        {isSignup ? "Creating your workspace…" : "Signing you in…"}
                    </>
                ) : (
                    <>
                        {isSignup ? "Create your workspace" : "Sign in to Nexus"}
                        <span aria-hidden="true">↗</span>
                    </>
                )}
            </button>
            {isSignup && (
                <p className="form-terms">
                    By creating an account, you agree to use Nexus responsibly
                    with your team.
                </p>
            )}
        </>
    );
}
