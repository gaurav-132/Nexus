"use client";

import dynamic from "next/dynamic";

const LoginForm = dynamic(
    () =>
        import("@/features/auth/components/login-form").then(
            (module) => module.LoginForm,
        ),
    {
        loading: () => (
            <div
                className="auth-form-loading"
                aria-label="Loading sign in form"
            />
        ),
    },
);
const SignupForm = dynamic(
    () =>
        import("@/features/auth/components/signup-form").then(
            (module) => module.SignupForm,
        ),
    {
        loading: () => (
            <div
                className="auth-form-loading"
                aria-label="Loading signup form"
            />
        ),
    },
);

export function AuthFormLoader({ mode }: { mode: "login" | "signup" }) {
    return mode === "signup" ? <SignupForm /> : <LoginForm />;
}
