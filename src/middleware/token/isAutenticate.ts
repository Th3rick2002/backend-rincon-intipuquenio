import {JwtPayload} from "jsonwebtoken";
import { MiddlewareHandler } from "hono";

export const isAutenticate: MiddlewareHandler = async (c, next) => {
    const payload = c.get('jwtPayload') as JwtPayload | undefined;
    if (!payload ) {
        return c.json({
            success: false,
            message: 'token invalido'
        }, 401)
    }

    c.set('user', payload)
    await next()
}