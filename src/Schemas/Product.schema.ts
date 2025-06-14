import {z} from 'zod';

export const productSchema = z.object({
    name: z.string().min(3).max(100),
    price: z.number().positive(),
    description: z.string().min(3).max(255),
    image: z.string().url().or(z.string())
});

export const productSchemaUpdate = z.object({
    name: z.string().min(3).max(100).optional(),
    price: z.number().positive().optional(),
    description: z.string().min(3).max(255).optional(),
    image: z.string().url().or(z.string()).optional()
});