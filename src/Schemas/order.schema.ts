import { z } from 'zod';

const orderItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de producto inválido"),
    quantity: z.number().int().positive("La cantidad debe ser mayor a 0")
});

export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, "Debe incluir al menos un producto"),
    deliveryAddress: z.string().min(10).max(200).optional(),
    phone: z.string().min(8).max(15).optional(),
    notes: z.string().max(500).optional()
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
});

export const mongoIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de MongoDB inválido")
});