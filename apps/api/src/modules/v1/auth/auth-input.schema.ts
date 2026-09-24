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
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().max(80).optional().default(''),
        email,
        password: z.string().min(12).max(128),
    })
    .strict();

export const loginSchema = z
    .object({
        workspaceSlug,
        email,
        password: z.string().min(1).max(128),
    })
    .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
