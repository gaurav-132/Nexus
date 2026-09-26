import { z } from 'zod';

export const tenantListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(['active', 'suspended']).optional(),
});

export const updateTenantSchema = z
    .object({
        name: z.string().trim().min(2).max(120).optional(),
        slug: z
            .string()
            .trim()
            .toLowerCase()
            .min(3)
            .max(80)
            .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
            .optional(),
        status: z.enum(['active', 'suspended']).optional(),
    })
    .strict()
    .refine((input) => Object.keys(input).length > 0, {
        message: 'Provide at least one tenant field to update.',
    });

export type TenantListQuery = z.infer<typeof tenantListQuerySchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
