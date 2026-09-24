import { z } from 'zod';

const workspaceSlug = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Use at least 3 characters.')
    .max(40, 'Use no more than 40 characters.')
    .regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        'Use letters, numbers, and hyphens.',
    );

const email = z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(320, 'Email address is too long.');

export const registerSchema = z
    .object({
        workspaceName: z.string().trim().min(2).max(120),
        workspaceSlug,
        name: z.string().trim().min(1).max(160),
        email,
        password: z.string().min(12).max(128),
    })
    .strict();

export const loginSchema = z
    .object({
        email,
        password: z.string().min(1).max(128),
    })
    .strict();

export const acceptInvitationSchema = z
    .object({
        name: z.string().trim().min(1).max(160).optional(),
        password: z.string().min(12).max(128).optional(),
    })
    .strict();

export const selectWorkspaceSchema = z
    .object({ tenantSlug: workspaceSlug })
    .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
