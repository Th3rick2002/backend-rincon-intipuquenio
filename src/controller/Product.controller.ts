import { Product } from "../models/Product.model";
import { getDatabase } from "../database/databaseConnection";
import { Context } from "hono";
import { Collection, ObjectId } from "mongodb";
import { join } from 'path';
import { unlinkSync } from 'fs';

export class ProductController {
    private collection: Collection<Product>;

    constructor() {
        const database = getDatabase();
        this.collection = database.collection<Product>('products');
    }

    public async getProducts(c: Context) {
        try {
            // Agregar paginación opcional
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '10');
            const skip = (page - 1) * limit;

            // Agregar filtro de búsqueda opcional
            const search = c.req.query('search');
            let filter = {};

            if (search) {
                filter = {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            // Obtener productos con paginación
            const products = await this.collection
                .find(filter)
                .sort({ createdAt: -1 }) // Más recientes primero
                .skip(skip)
                .limit(limit)
                .toArray();

            // Contar total para metadata
            const total = await this.collection.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);

            if (products.length === 0) {
                return c.json({
                    success: false,
                    message: 'No hay productos registrados'
                });
            }

            return c.json({
                success: true,
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            console.error('Error en getProducts:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getProductById(c: Context) {
        try {
            const id = c.req.param('id');

            const product = await this.collection.findOne({ _id: new ObjectId(id) } as any);

            if (!product) {
                return c.json({
                    success: false,
                    message: 'Producto no encontrado'
                }, 404);
            }

            return c.json({
                success: true,
                data: product
            });
        } catch (error) {
            console.error('Error en getProductById:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async createProduct(c: Context) {
        try {
            const body = await c.req.parseBody();

            // Validar que se envió una imagen
            const imagePath = c.get('imagePath');
            if (!imagePath) {
                return c.json({
                    success: false,
                    message: 'La imagen es requerida'
                }, 400);
            }

            const data = {
                name: String(body.name),
                price: Number(body.price),
                description: String(body.description),
                image: imagePath,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validar datos básicos
            if (!data.name || !data.price || !data.description) {
                return c.json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                }, 400);
            }

            if (data.price <= 0) {
                return c.json({
                    success: false,
                    message: 'El precio debe ser mayor a 0'
                }, 400);
            }

            // Verificar que no existe un producto con el mismo nombre
            const existingProduct = await this.getProductByName(data.name);
            if (existingProduct) {
                // Eliminar imagen subida si el producto ya existe
                try {
                    const fsPath = join(process.cwd(), 'public', imagePath);
                    unlinkSync(fsPath);
                } catch (e) {
                    console.log('No se pudo eliminar la imagen temporal');
                }

                return c.json({
                    success: false,
                    message: 'Ya existe un producto con ese nombre'
                }, 409);
            }

            const result = await this.collection.insertOne(data);

            return c.json({
                success: true,
                message: 'Producto creado exitosamente',
                data: {
                    insertedId: result.insertedId,
                    product: { ...data, _id: result.insertedId }
                }
            });
        } catch (error) {
            console.error('Error en createProduct:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async updateProduct(c: Context) {
        try {
            const id = c.req.param('id');
            const body = await c.req.parseBody();

            const product = await this.getProductByIdInDB(id);
            if (!product) {
                return c.json({
                    success: false,
                    message: 'El producto no existe'
                }, 404);
            }

            // Construir datos a actualizar
            const updateData: Partial<Product> = {
                updatedAt: new Date()
            };

            // Actualizar campos si se proporcionan
            if (body.name && typeof body.name === 'string') {
                // Verificar que no existe otro producto con ese nombre
                const existingProduct = await this.collection.findOne({
                    name: body.name,
                    _id: { $ne: new ObjectId(id) }
                } as any);

                if (existingProduct) {
                    return c.json({
                        success: false,
                        message: 'Ya existe un producto con ese nombre'
                    }, 409);
                }
                updateData.name = body.name;
            }

            if (body.description && typeof body.description === 'string') {
                updateData.description = body.description;
            }

            if (body.price && typeof body.price === 'string') {
                const price = Number(body.price);
                if (price <= 0) {
                    return c.json({
                        success: false,
                        message: 'El precio debe ser mayor a 0'
                    }, 400);
                }
                updateData.price = price;
            }

            // Manejar actualización de imagen
            const newImagePath = c.get('imagePath');
            if (newImagePath) {
                updateData.image = newImagePath;

                // Eliminar imagen anterior del servidor
                const oldImage = product.image;
                if (oldImage) {
                    const fsPath = join(process.cwd(), 'public', oldImage);
                    try {
                        unlinkSync(fsPath);
                    } catch (e) {
                        console.log('No se pudo eliminar la imagen anterior');
                    }
                }
            }

            // Verificar que hay algo que actualizar
            const hasUpdates = Object.keys(updateData).length > 1; // > 1 porque updatedAt siempre está
            if (!hasUpdates) {
                return c.json({
                    success: false,
                    message: 'No se proporcionaron datos para actualizar'
                }, 400);
            }

            const result = await this.collection.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: updateData }
            );

            return c.json({
                success: true,
                message: 'Producto actualizado correctamente',
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            console.error('Error en updateProduct:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async deleteProduct(c: Context) {
        try {
            const id = c.req.param('id');
            const product = await this.getProductByIdInDB(id);

            if (!product) {
                return c.json({
                    success: false,
                    message: 'Producto no existe'
                }, 404);
            }

            // Eliminar imagen del servidor
            if (product.image) {
                const imagePath = join(process.cwd(), 'public', product.image);
                try {
                    unlinkSync(imagePath);
                } catch (e) {
                    console.log('No se pudo eliminar la imagen del producto');
                }
            }

            await this.collection.findOneAndDelete({ _id: new ObjectId(id) } as any);

            return c.json({
                success: true,
                message: 'Producto eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en deleteProduct:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    private async getProductByIdInDB(id: string): Promise<Product | null> {
        try {
            return await this.collection.findOne({ _id: new ObjectId(id) } as any);
        } catch (error) {
            console.error('Error en getProductById:', error);
            return null;
        }
    }

    private async getProductByName(name: string): Promise<Product | null> {
        try {
            return await this.collection.findOne({ name });
        } catch (error) {
            console.error('Error en getProductByName:', error);
            return null;
        }
    }
}