import type {User} from "../models/User.model";
import {getDatabase} from "../database/databaseConnection";
import {Context} from "hono";
import {Collection, ObjectId} from "mongodb";
import {hashPassword, comparePassword} from "../middleware/hashPassword/hashPassword";
import {Protected} from "../middleware/token/generateToken";

export class UserController {
    private collection: Collection<User>;

    constructor() {
        const database = getDatabase();
        this.collection = database.collection<User>('users');
    }

    public async login(c: Context){
        try {
            const data = await c.req.json();

            const existingUser = await this.getUserByEmail(data.email);
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

            const userId = existingUser._id;
            const role = existingUser.role;
            const token =  Protected.generateToken(c, userId, role);
            const refreshToken = await Protected.generateRefreshToken(c, userId);

            return c.json({
                success: true,
                message: 'Usuario autenticado',
                accessToken: token,
                refreshToken: refreshToken,
            })

        }catch (error) {
            throw error;
        }
    }

    public async profile(c: Context) {
        try {
            const user = c.get('user')
            if (!user) {
                return c.json({
                    success: false,
                    message: 'No hay usuario autenticado'
                }, 401)
            }

            const userData = await this.collection.findOne({ _id: new ObjectId(user.userId) } as any,)
            if (!userData) {
                return c.json({
                    success: false,
                    message: 'No se pudo obtener el usuario'
                }, 404)
            }
            // @ts-ignore
            delete userData.password;

            return c.json({
                success: true,
                data: userData
            })
        }catch (e) {
            throw e;
        }
    }

    public async createUser(c: Context) {
        try {
            const data = await c.req.json();

            const existingUser = await this.verifyExistingUserByEmail(data.email);
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
            const users = await this.collection.find({}, {projection: {password: 0} }).toArray();

            if (users.length === 0) return c.json({success: false, message: 'No hay usuarios registrados'})

             return c.json({
                 success: true,
                 data: users
             })
        }catch (error) {
            throw error;
        }
    }

    public async updateUser(c: Context) {
        try {
            const id = c.req.param('id')
            const data = await c.req.json();

            const user = await this.verifyExistingUserById(id)
            if (!user) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404)
            }

            const verifyEmail = await this.collection.findOne({
                email: data.email,
                _id: { $ne: new ObjectId(id) }
            } as any)

            if (verifyEmail) {
                return c.json({
                    success: false,
                    message: 'El email ya existe'
                }, 409)
            }

            const result = await this.collection.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: data }
            )

            return c.json({
                success: true,
                message: 'Usuario actualizado correctamente',
                modifiedCount: result.modifiedCount
            })

        }catch (error) {
            throw error;
        }
    }

    public async getUserById(c: Context) {
        try {
            const id = c.req.param('id')

            const user = await this.collection.findOne({ _id: new ObjectId(id) } as any)

            if (!user) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404)
            }

            return c.json({
                success: true,
                data: user
            })
        }catch (error) {
            throw error;
        }
    }

    public async deleteUser(c: Context) {
        try {
            const id = c.req.param('id')

            const user = await this.collection.findOne({ _id: new ObjectId(id) } as any)

            if (!user) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404)
            }

            await this.collection.findOneAndDelete({_id: new ObjectId(id)} as any)
            return c.json({
                success: true,
                message: 'Usuario eliminado correctamente'
            })
        }catch (error) {
            throw error;
        }
    }

    private async getUserByEmail(email: string) {
        try {
            return await this.collection.findOne({email})
        }catch (error) {
            throw error;
        }
    }

    private async verifyExistingUserById(id: string) {
        try {
            const user = await this.collection.findOne({ _id: new ObjectId(id) } as any)
            return user
        }catch (error) {
            throw error;
        }
    }

    private async verifyExistingUserByEmail(email: string) {
        try {
            const user = await this.collection.findOne({ email })
            return user
        }catch (error) {
            throw error;
        }
    }
}