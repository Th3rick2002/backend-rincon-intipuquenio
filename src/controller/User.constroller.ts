import type {User} from "../models/User.model";
import {getDatabase} from "../database/databaseConnection";
import {Context} from "hono";
import { jwt } from "hono/jwt"
import {Collection} from "mongodb";
import {hashPassword, comparePassword} from "../middleware/hashPassword/hashPassword";
import {environments} from "../services/environment.service";

export class UserController {
    private collection: Collection<User>;

    constructor() {
        const database = getDatabase();
        this.collection = database.collection<User>('users');
    }

    public async login(c: Context){
        try {
            const data = await c.req.json();

            const existingUser = await this.verifyExistingUser(data.email);
            if (!existingUser){
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404)
            }

            const verifyPassword =await comparePassword(data.password, existingUser.password)
            if (!verifyPassword){
                return c.json({
                    success: false,
                    message: 'Datos incorrectos'
                }, 404)
            }

            return c.json({
                success: true,
                message: 'Usuario autenticado',
            })

        }catch (error) {
            throw error;
        }
    }

    public async createUser(c: Context) {
        try {
            const data = await c.req.json();

            const existingUser = await this.verifyExistingUser(data.email);
            if (existingUser) {
                return c.json({
                    success: false,
                    message: 'El usuario ya existe'
                }, 409)
            }

            data.password = await hashPassword(data.password);
            const result = await this.collection.insertOne(data);

            return c.json({
                success: true,
                data: result.insertedId ? result : null
            })
        }catch (error) {
            throw error;
        }
    }

    public async getUsers(c: Context){
        try {
            const users = await this.collection.find().toArray();

            if (users.length === 0) return c.json({success: false, message: 'No hay usuarios registrados'})

             return c.json({
                 success: true,
                 data: users
             })
        }catch (error) {
            throw error;
        }
    }

    public async getUserByEmail(c: Context) {
        try {
            const email = c.req.param('email')
            return await this.collection.findOne({email})
        }catch (error) {
            throw error;
        }
    }

    private async verifyExistingUser(email: string) {
        try {
            const user = await this.collection.findOne({email})
            return user
        }catch (error) {
            throw error;
        }
    }
}