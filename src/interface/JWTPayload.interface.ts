export interface IJwtPayload {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
    type?: string;
}