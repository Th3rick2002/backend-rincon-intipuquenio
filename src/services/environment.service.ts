import enviroment from 'env-var';

process.config

export const environments = {
    mongoURI: enviroment.get('MONGO_URI').required().asString(),
    dbName: enviroment.get('DB_NAME').required().asString(),
    port: enviroment.get('PORT').required().asPortNumber(),
    jwt_secret: enviroment.get('JWT_SECRET').required().asString(),
    jwt_expire: enviroment.get('JWT_EXPIRED_IN').required().asString(),
    jwt_refresh_secret: enviroment.get('JWT_REFRESH_SECRET').required().asString(),
    jwt_refresh_expire: enviroment.get('JWT_REFRESH_EXPIRED_IN').required().asString(),
}