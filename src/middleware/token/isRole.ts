import {MiddlewareHandler} from "hono";

export type UserRole = 'admin' | 'client';

export function isRole(roles: UserRole[]): MiddlewareHandler {
    return async (c, next) => {
        const payload = c.get('user')
        if (!payload) {
            return c.json({
                success: false,
                message: 'token invalido'
            }, 401)
        }

        if (!roles.includes(payload.role)){
            return c.json({
                success: false,
                message: 'Acceso denegado, rol no permitido'
            }, 403)
        }
        await next()
    }
}