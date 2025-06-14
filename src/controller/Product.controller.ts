import {Product} from "../models/Product.model";
import {getDatabase} from "../database/databaseConnection";
import {Context} from "hono";
import {Collection, ObjectId} from "mongodb";
import { join } from 'path';

export class ProductController {
    private collection: Collection<Product>;

    constructor() {
        const database = getDatabase();
        this.collection = database.collection<Product>('products');
    }

    public async getProducts(c: Context) {
        try {
            const products = await this.collection.find({}).toArray();

            if (products.length === 0) return c.json({success: false, message: 'No hay productos registrados'})

            return c.json({
                success: true,
                data: products
            })
        }catch (error) {
            throw error;
        }
    }

    public async createProduct(c: Context) {
        try{
            const body = await c.req.parseBody();

            const data = {
                name: String(body.name),
                price: Number(body.price),
                description: String(body.description),
                image: c.get('imagePath'),
            }

            const existingProduct = await this.getProductByName(data.name);
            if (existingProduct) {
                return c.json({
                    success: false,
                    message: 'El producto ya existe'
                }, 409)
            }

            const result = await this.collection.insertOne(data);

            return c.json({
                success: true,
                data: result.insertedId ? result : null
            })
        }catch (error) {
            throw error;
        }
    }

    public async updateProduct(c: Context) {
        try {
            const id = c.req.param('id')
            const data = await c.req.parseBody();

            const product = await this.getProductById(id)
            if (!product){
                return c.json({
                    success: false,
                    message: 'El producto no existe'
                }, 404)
            }

            const name = typeof data.name === 'string' ? data.name : product.name;
            const description = typeof data.description === 'string' ? data.description : product.description;
            const price = typeof data.price === 'string' ? Number(data.price) : product.price;

            const updateData: Partial<Product> = {
                name,
                description,
                price,
                updatedAt: new Date()
            }

            const newImagePath = c.get('imagePath');
            if (newImagePath) {
                updateData.image = newImagePath;

                // Borrar imagen anterior del servidor
                const oldImage = product.image;
                const fsPath = join(process.cwd(), 'public', oldImage);
                try {
                    await Bun.file(fsPath).unlink();
                } catch {
                    // No explotes si no existe
                }
            }

            const result = await this.collection.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: data }
            )

            return c.json({
                success: true,
                message: 'Producto actualizado correctamente',
                modifiedCount: result.modifiedCount
            })

        }catch (error) {
            throw error;
        }
    }

    public async deleteProduct(c: Context) {
        try {
            const id = c.req.param('id');
            const product = await this.getProductById(id);

            if (!product) {
                return c.json({ success: false, message: 'Producto no existe' }, 404);
            }

            // Eliminar imagen del servidor
            const imagePath = join(process.cwd(), 'public', product.image);
            try {
                Bun.file(imagePath).unlink();
            } catch {
                // Ignorar si no existe
            }

            await this.collection.findOneAndDelete({ _id: new ObjectId(id) } as any);

            return c.json({
                success: true,
                message: 'Producto eliminado'
            });
        }catch (error) {
            throw error;
        }
    }

    private async getProductById(id: string) {
        try {
            return this.collection.findOne({ _id: new ObjectId(id) } as any)
        }catch (error) {
            throw error;
        }
    }

    private async getProductByName(name: string) {
        try {
            return await this.collection.findOne({name})
        }catch (error) {
            throw error;
        }
    }
}