"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthApiError, submitAuth } from "@/features/auth/api/client";
import {
    validateAuthValues,
    type AuthFieldErrors,
    type AuthMode,
} from "@/features/auth/validation/schemas";

export function useAuthForm(mode: AuthMode) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");
        setFieldErrors({});

        const formData = new FormData(event.currentTarget);
        const rawValues = Object.fromEntries(
            [...formData.entries()].map(([key, value]) => [key, String(value)]),
        );
        const validation = validateAuthValues(mode, rawValues);
        if (Object.keys(validation.errors).length > 0) {
            setFieldErrors(validation.errors);
            setFormError("Please check the highlighted fields.");
            return;
        }

        setBusy(true);
        try {
            await submitAuth(mode, validation.values);
            router.replace("/app");
            router.refresh();
        } catch (error) {
            if (error instanceof AuthApiError) {
                setFieldErrors(error.fieldErrors);
                setFormError(error.message);
            } else {
                setFormError("Something went wrong. Please try again.");
            }
        } finally {
            setBusy(false);
        }
    }

    function clearFieldError(field: string) {
        setFieldErrors((current) => {
            if (!(field in current)) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
        setFormError("");
    }

    return { busy, formError, fieldErrors, handleSubmit, clearFieldError };
}
