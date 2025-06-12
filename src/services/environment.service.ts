import enviroment from 'env-var';

process.config

export const environments = {
    mongoURI: enviroment.get('MONGO_URI').required().asString(),
    dbName: enviroment.get('DB_NAME').required().asString(),
    port: enviroment.get('PORT').required().asPortNumber(),
    jwt_secret: enviroment.get('JWT_SECRET').required().asString()
}