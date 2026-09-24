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
    let response: Response;
    try {
        response = await fetch(
            `/api/v1/auth/${mode === "signup" ? "register" : "login"}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "same-origin",
                cache: "no-store",
                body: JSON.stringify(values),
            },
        );
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
}
