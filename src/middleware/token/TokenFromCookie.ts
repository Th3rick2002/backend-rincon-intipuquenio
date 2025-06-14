import { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'jsonwebtoken';
import { environments } from '../../services/environment.service';
import { IJwtPayload } from '../../interface/JWTPayload.interface';

export const jwtFromSignedCookie: MiddlewareHandler = async (c, next) => {
    try {
        // Obtener el token de la cookie (sin firmar por ahora)
        const token = getCookie(c, 'access_token');

        if (!token) {
            return c.json({
                success: false,
                message: 'Token no encontrado en cookies'
            }, 401);
        }

        // Verificar el token
        const payload = verify(token, environments.jwt_secret) as IJwtPayload;

        // Verificar que es un token de acceso
        if (payload.type !== 'access') {
            return c.json({
                success: false,
                message: 'Tipo de token inválido'
            }, 401);
        }

        // Establecer el payload en el contexto
        c.set('jwtPayload', payload);

        await next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return c.json({
                success: false,
                message: 'Token expirado',
                error: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
            }, 401);
        } else if (err.name === 'JsonWebTokenError') {
            return c.json({
                success: false,
                message: 'Token inválido',
                error: 'El token proporcionado no es válido'
            }, 401);
        } else {
            console.error('Error verificando token:', err);
            return c.json({
                success: false,
                message: 'Error de autenticación'
            }, 401);
        }
    }
};