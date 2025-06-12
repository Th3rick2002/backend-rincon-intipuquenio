import {MongoClient, Db} from "mongodb";
import {environments} from "../services/environment.service";

class DatabaseConnection {
    private static _instance: MongoClient;
    private static _db: Db

    public static getInstance(): MongoClient {
        if (!this._instance) {
            this._instance = new MongoClient(environments.mongoURI);
        }
        return this._instance;
    }

    async connectDB() {
        try {
            await DatabaseConnection.getInstance().connect();
            //DatabaseConnection._db = DatabaseConnection.getInstance().db(environments.dbName);
        }catch (error) {
            console.log('Error al conectar la base de datos:' + error);
        }
    }

    public static getDB(): Db {
        if (!this._db) {
            DatabaseConnection._db = DatabaseConnection.getInstance().db(environments.dbName);
            //throw Error('No se ha conectado a la base de datos, instancie primero la coneccion');
        }
        return DatabaseConnection._db;
    }
}

const db = new DatabaseConnection()
export default db;

export const getDatabase = (): Db =>  DatabaseConnection.getDB();