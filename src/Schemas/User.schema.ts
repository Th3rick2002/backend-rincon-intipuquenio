import {z} from 'zod'

const baseUserSchema = z.object({
    name: z.string().min(1).max(20),
    lastname: z.string().min(1).max(20),
    email: z.string().email(),
    password: z.string().min(8).max(30),
})

export const createUser = baseUserSchema.extend({
    role: z.string().min(1).max(10).optional()
})

export const updateUser = baseUserSchema.extend({
    role: z.string().min(1).max(10).optional()
})

export const loginUser = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(30),
})

export const validID = z.string().uuid()