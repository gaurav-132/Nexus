"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthApiError, submitAuth } from "@/features/auth/api/client";
import {
    validateAuthValues,
    type AuthFieldErrors,
    type AuthMode,
    type AuthValues,
} from "@/features/auth/validation/schemas";

export function useAuthForm(mode: AuthMode) {
    const router = useRouter();
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const authMutation = useMutation({
        mutationFn: (values: AuthValues) => submitAuth(mode, values),
    });

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

        try {
            await authMutation.mutateAsync(validation.values);
            router.replace("/");
            router.refresh();
        } catch (error) {
            if (error instanceof AuthApiError) {
                setFieldErrors(error.fieldErrors);
                setFormError(error.message);
            } else {
                setFormError("Something went wrong. Please try again.");
            }
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

    return {
        busy: authMutation.isPending,
        formError,
        fieldErrors,
        handleSubmit,
        clearFieldError,
    };
}
