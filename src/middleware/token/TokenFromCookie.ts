import { MiddlewareHandler } from 'hono'
import { getSignedCookie } from 'hono/cookie'
import { verify } from 'jsonwebtoken'
import { environments } from '../../services/environment.service'

export const jwtFromSignedCookie: MiddlewareHandler = async (c, next) => {
    const cookies = await getSignedCookie(c, environments.jwt_secret)
    const token = cookies.access_token

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
