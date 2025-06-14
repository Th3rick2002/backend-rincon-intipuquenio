import type { User } from "../models/User.model";
import { getDatabase } from "../database/databaseConnection";
import { Context } from "hono";
import { Collection, ObjectId } from "mongodb";
import { hashPassword, comparePassword } from "../middleware/hashPassword/hashPassword";
import { Protected } from "../middleware/token/generateToken";

export class UserController {
    private collection: Collection<User>;

    constructor() {
        const database = getDatabase();
        this.collection = database.collection<User>('users');
    }

    public async login(c: Context) {
        try {
            const data = await c.req.json();

            const existingUser = await this.getUserByEmail(data.email);
            if (!existingUser) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404);
            }

            const verifyPassword = await comparePassword(data.password, existingUser.password);
            if (!verifyPassword) {
                return c.json({
                    success: false,
                    message: 'Datos incorrectos'
                }, 401);
            }

            const userId = existingUser._id;
            const role = existingUser.role;
            const token = Protected.generateToken(c, userId, role);
            const refreshToken = await Protected.generateRefreshToken(c, userId);

            // Actualizar último login
            await this.collection.updateOne(
                { _id: new ObjectId(userId) } as any,
                { $set: { lastLogin: new Date() } }
            );

            return c.json({
                success: true,
                message: 'Usuario autenticado',
                accessToken: token,
                refreshToken: refreshToken,
            });

        } catch (error) {
            console.error('Error en login:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async profile(c: Context) {
        try {
            const user = c.get('user');
            if (!user) {
                return c.json({
                    success: false,
                    message: 'No hay usuario autenticado'
                }, 401);
            }

            const userData = await this.collection.findOne(
                { _id: new ObjectId(user.userId) } as any,
                { projection: { password: 0 } }
            );

            if (!userData) {
                return c.json({
                    success: false,
                    message: 'No se pudo obtener el usuario'
                }, 404);
            }

            return c.json({
                success: true,
                data: userData
            });
        } catch (error) {
            console.error('Error en profile:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
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
                }, 409);
            }

            // Hash de la contraseña
            data.password = await hashPassword(data.password);

            // Agregar timestamps
            data.createdAt = new Date();
            data.updatedAt = new Date();

            // Si no se especifica rol, asignar 'client' por defecto
            if (!data.role) {
                data.role = 'client';
            }

            const result = await this.collection.insertOne(data);

            return c.json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: { insertedId: result.insertedId }
            });
        } catch (error) {
            console.error('Error en createUser:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getUsers(c: Context) {
        try {
            const users = await this.collection.find(
                {},
                { projection: { password: 0 } }
            ).toArray();

            if (users.length === 0) {
                return c.json({
                    success: false,
                    message: 'No hay usuarios registrados'
                });
            }

            return c.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Error en getUsers:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async updateUser(c: Context) {
        try {
            const id = c.req.param('id');
            const data = await c.req.json();
            const currentUser = c.get('user');

            // Verificar que el usuario existe
            const user = await this.verifyExistingUserById(id);
            if (!user) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404);
            }

            // Si el usuario es 'client', solo puede actualizar su propio perfil
            if (currentUser.role === 'client' && currentUser.userId !== id) {
                return c.json({
                    success: false,
                    message: 'No tienes permisos para actualizar este usuario'
                }, 403);
            }

            // Si se está actualizando el email, verificar que no exista
            if (data.email) {
                const verifyEmail = await this.collection.findOne({
                    email: data.email,
                    _id: { $ne: new ObjectId(id) }
                } as any);

                if (verifyEmail) {
                    return c.json({
                        success: false,
                        message: 'El email ya existe'
                    }, 409);
                }
            }

            // Si se está actualizando la contraseña, hashearla
            if (data.password) {
                data.password = await hashPassword(data.password);
            }

            // Solo admin puede cambiar roles
            if (data.role && currentUser.role !== 'admin') {
                delete data.role;
            }

            // Agregar timestamp de actualización
            data.updatedAt = new Date();

            const result = await this.collection.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: data }
            );

            return c.json({
                success: true,
                message: 'Usuario actualizado correctamente',
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            console.error('Error en updateUser:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getUserById(c: Context) {
        try {
            const id = c.req.param('id');

            const user = await this.collection.findOne(
                { _id: new ObjectId(id) } as any,
                { projection: { password: 0 } }
            );

            if (!user) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404);
            }

            return c.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error en getUserById:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async deleteUser(c: Context) {
        try {
            const id = c.req.param('id');
            const currentUser = c.get('user');

            // No permitir que un usuario se elimine a sí mismo
            if (currentUser.userId === id) {
                return c.json({
                    success: false,
                    message: 'No puedes eliminar tu propia cuenta'
                }, 400);
            }

            const user = await this.collection.findOne({ _id: new ObjectId(id) } as any);

            if (!user) {
                return c.json({
                    success: false,
                    message: 'El usuario no existe'
                }, 404);
            }

            await this.collection.findOneAndDelete({ _id: new ObjectId(id) } as any);

            return c.json({
                success: true,
                message: 'Usuario eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en deleteUser:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    private async getUserByEmail(email: string) {
        try {
            return await this.collection.findOne({ email });
        } catch (error) {
            throw error;
        }
    }

    private async verifyExistingUserById(id: string) {
        try {
            const user = await this.collection.findOne({ _id: new ObjectId(id) } as any);
            return user;
        } catch (error) {
            throw error;
        }
    }

    private async verifyExistingUserByEmail(email: string) {
        try {
            const user = await this.collection.findOne({ email });
            return user;
        } catch (error) {
            throw error;
        }
    }
}