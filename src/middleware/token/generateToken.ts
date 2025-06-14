import jwt from "jsonwebtoken"
import {Context} from "hono";
import {environments} from "../../services/environment.service";
import {getCookie, deleteCookie} from "hono/cookie";
import {IJwtPayload} from "../../interface/JWTPayload.interface";

export class Protected {
    static generateToken(c: Context, userId: string, role: string) {
        if (!environments.jwt_secret) throw new Error('JWT_SECRET no definido en variables de entorno')

        const expiresIn = environments.jwt_expire || '6h';

        //@ts-ignore
        const token = jwt.sign(
            { userId, role , type: 'access' },
            environments.jwt_secret,
            { expiresIn }
        )

        c.header(
            'Set-Cookie',
            `access_token=${token}; HttpOnly; Path=/; SameSite=None; Max-Age=${expiresIn}`,
        )
        return token;
    }

    static async generateRefreshToken(c: Context, userId: string) {
        if (!environments.jwt_refresh_secret) throw new Error('JWT_SECRET no definido en variables de entorno')

        const expiresIn = environments.jwt_refresh_expire || '3d';

        //@ts-ignore
        const refresToken = jwt.sign(
            { userId, type: 'refresh' },
            environments.jwt_refresh_secret,
            { expiresIn }
        )

        c.header(
            'Set-Cookie',
            `refresh_token=${refresToken};HttpOnly; Path=/; SameSite=None; Max-Age=${expiresIn}`
        )
        return refresToken
    }

    static async verifyToken(c: Context) {
        const token = getCookie(c, 'access_token')
        if (!token) {
            return c.json({
                success: false,
                message: 'No token provided'
            }, 401)
        }

        try {
            const payload = jwt.verify(token, environments.jwt_secret) as IJwtPayload;
            return payload;
        }catch (e) {
            if (e instanceof jwt.JsonWebTokenError) {
                c.json({
                    success: false,
                    message: 'Invalid token',
                    error: 'The token provided is not valid'
                })
            }  else if (e instanceof jwt.TokenExpiredError) {
                deleteCookie(c, 'access_token', {
                    httpOnly: true,
                    sameSite: 'strict'
                });
                c.json({
                    success: false,
                    message: 'Token expired',
                    error: 'Your session has expired, please log in again'
                }, 401);
            } else {
                c.json({
                    success: false,
                    message: 'Authentication error',
                    error: e instanceof Error ? e.message : 'Unknown error'
                }, 401);
            }
        }
    }

    static async refreshToken(c: Context) {
        const refreshToken = getCookie(c, 'refresh_token')
        if (!refreshToken){
            return  c.json({
                success: false,
                message: 'No refresh token provided'
            }, 401)
        }

        try {
            const payload = jwt.verify(refreshToken, environments.jwt_refresh_secret) as IJwtPayload;

            if (payload.type !== 'refresh') {
                return c.json({
                    success: false,
                    message: 'Invalid token',
                    error: 'The token type provided is not valid'
                }, 403)
            }

            const newToken = Protected.generateToken(c, payload.userId, payload.role)
            return c.json({
                success: true,
                message: 'Token refreshed',
                accessToken: newToken
            })
        }catch (e) {
            deleteCookie(c, 'refresh_token', {
                httpOnly: true,
                path: '/',
                secure: true,
                sameSite: 'strict'
            })

            if (e instanceof jwt.TokenExpiredError) {
                return c.json({ success: false, message: 'Refresh token expirado' }, 401)
            }

            return c.json({ success: false, message: 'Refresh token inválido' }, 401)
        }
    }
}