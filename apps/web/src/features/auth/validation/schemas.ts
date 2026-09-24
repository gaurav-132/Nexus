export type AuthMode = "login" | "signup";
export type AuthFieldErrors = Record<string, string>;

export type LoginValues = {
    email: string;
    password: string;
};

export type SignupValues = LoginValues & {
    workspaceName: string;
    workspaceSlug: string;
    name: string;
};

export type AuthValues = LoginValues | SignupValues;

function normalizeSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
}

export function slugifyWorkspace(value: string): string {
    return normalizeSlug(value);
}

export function validateAuthValues(
    mode: AuthMode,
    values: Record<string, string>,
): { values: AuthValues; errors: AuthFieldErrors } {
    const errors: AuthFieldErrors = {};
    const email = (values.email ?? "").trim().toLowerCase();
    const password = values.password ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
    } else if (email.length > 320) {
        errors.email = "Email address is too long.";
    }

    if (mode === "signup") {
        const workspaceName = (values.workspaceName ?? "").trim();
        const workspaceSlug = normalizeSlug(values.workspaceSlug ?? "");
        const name = (values.name ?? "").trim();

        if (workspaceName.length < 2 || workspaceName.length > 120) {
            errors.workspaceName = "Use between 2 and 120 characters.";
        }
        if (workspaceSlug.length < 3) {
            errors.workspaceSlug = "Use at least 3 characters.";
        }
        if (name.length < 1 || name.length > 160) {
            errors.name = "Enter your name (up to 160 characters).";
        }
        if (password.length < 12 || password.length > 128) {
            errors.password = "Use a password between 12 and 128 characters.";
        }

        return {
            values: {
                workspaceName,
                workspaceSlug,
                name,
                email,
                password,
            },
            errors,
        };
    }

    if (password.length < 1 || password.length > 128) {
        errors.password = "Enter a password (up to 128 characters).";
    }

    return { values: { email, password }, errors };
}
