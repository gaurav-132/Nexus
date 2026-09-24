export type AuthMode = "login" | "signup";
export type AuthFieldErrors = Record<string, string>;

export type LoginValues = {
    workspaceSlug: string;
    email: string;
    password: string;
};

export type SignupValues = LoginValues & {
    workspaceName: string;
    firstName: string;
    lastName: string;
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
    const workspaceSlug = normalizeSlug(values.workspaceSlug ?? "");
    const email = (values.email ?? "").trim().toLowerCase();
    const password = values.password ?? "";

    if (workspaceSlug.length < 3) {
        errors.workspaceSlug = "Use at least 3 characters.";
    } else if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(workspaceSlug)) {
        errors.workspaceSlug = "Use letters, numbers, and hyphens.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
    } else if (email.length > 320) {
        errors.email = "Email address is too long.";
    }

    if (mode === "signup") {
        const workspaceName = (values.workspaceName ?? "").trim();
        const firstName = (values.firstName ?? "").trim();
        const lastName = (values.lastName ?? "").trim();

        if (workspaceName.length < 2 || workspaceName.length > 120) {
            errors.workspaceName = "Use between 2 and 120 characters.";
        }
        if (firstName.length < 1 || firstName.length > 80) {
            errors.firstName = "Enter a first name (up to 80 characters).";
        }
        if (lastName.length > 80) {
            errors.lastName = "Use no more than 80 characters.";
        }
        if (password.length < 12 || password.length > 128) {
            errors.password = "Use a password between 12 and 128 characters.";
        }

        return {
            values: {
                workspaceName,
                workspaceSlug,
                firstName,
                lastName,
                email,
                password,
            },
            errors,
        };
    }

    if (password.length < 1 || password.length > 128) {
        errors.password = "Enter a password (up to 128 characters).";
    }

    return { values: { workspaceSlug, email, password }, errors };
}
