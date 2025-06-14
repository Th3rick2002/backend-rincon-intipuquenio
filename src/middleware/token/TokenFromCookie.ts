import { verify } from 'jsonwebtoken'
import { MiddlewareHandler } from 'hono'
import { environments } from '../../services/environment.service'
import { getCookie, setCookie } from 'hono/cookie'

export const jwtFromCookie: MiddlewareHandler = async (c, next) => {
    const token = getCookie(c, 'access_token')

    if (!token) {
        return c.json({ success: false, message: 'Token no encontrado' }, 401)
    }

    try {
        const payload = verify(token, environments.jwt_secret)
        c.set('jwtPayload', payload)
        await next()
    } catch (err) {
        return c.json({ success: false, message: 'Token inválido o expirado' }, 401)
    }
}
