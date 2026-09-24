import type { AuthValues } from "@/features/auth/validation/schemas";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
    success: false;
    error?: {
        code?: string;
        message?: string;
        details?: unknown;
        requestId?: string;
    };
};

export class AuthApiError extends Error {
    readonly fieldErrors: Record<string, string>;
    readonly requestId?: string;

    constructor(
        message: string,
        fieldErrors: Record<string, string> = {},
        requestId?: string,
    ) {
        super(message);
        this.name = "AuthApiError";
        this.fieldErrors = fieldErrors;
        this.requestId = requestId;
    }
}

function readFieldErrors(details: unknown): Record<string, string> {
    if (!details || typeof details !== "object" || Array.isArray(details))
        return {};
    return Object.fromEntries(
        Object.entries(details).flatMap(([field, messages]) => {
            if (typeof messages === "string") return [[field, messages]];
            if (Array.isArray(messages) && typeof messages[0] === "string") {
                return [[field, messages[0]]];
            }
            return [];
        }),
    );
}

export async function submitAuth(
    mode: "login" | "signup",
    values: AuthValues,
): Promise<void> {
    const endpoint = mode === "signup" ? "register" : "login";
    await requestAuth(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
    });
}

export async function logout(): Promise<void> {
    const result = await requestAuth<{ signedOut: boolean }>("logout", {
        method: "POST",
    });
    if (!result.signedOut) {
        throw new AuthApiError(
            "We couldn’t complete sign out. Please try again.",
        );
    }
}

export async function selectWorkspace(tenantSlug: string): Promise<void> {
    const result = await requestAuth<{ workspaceSelected: boolean }>(
        "select-workspace",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantSlug }),
        },
    );
    if (!result.workspaceSelected) {
        throw new AuthApiError(
            "Couldn’t select that workspace. Please try again.",
        );
    }
}

async function requestAuth<T>(
    endpoint: "register" | "login" | "logout" | "select-workspace",
    options: RequestInit,
): Promise<T> {
    let response: Response;
    try {
        const headers = new Headers(options.headers);
        headers.set("Accept", "application/json");
        response = await fetch(`/api/v1/auth/${endpoint}`, {
            ...options,
            headers,
            credentials: "same-origin",
            cache: "no-store",
        });
    } catch {
        throw new AuthApiError(
            "Nexus couldn’t reach the server. Check your connection and try again.",
        );
    }

    let body: ApiSuccess<unknown> | ApiFailure;
    try {
        body = (await response.json()) as ApiSuccess<unknown> | ApiFailure;
    } catch {
        throw new AuthApiError(
            "The server returned an unreadable response. Please try again.",
        );
    }

    if (!response.ok || !body || body.success !== true) {
        const failure = body as ApiFailure;
        throw new AuthApiError(
            failure.error?.message ??
                "We couldn’t complete your request. Please try again.",
            readFieldErrors(failure.error?.details),
            failure.error?.requestId,
        );
    }

    return body.data as T;
}
