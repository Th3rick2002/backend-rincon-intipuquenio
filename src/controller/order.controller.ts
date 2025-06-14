import { Order, OrderItem } from "../models/Order.model";
import { Product } from "../models/Product.model";
import { User } from "../models/User.model";
import { getDatabase } from "../database/databaseConnection";
import { Context } from "hono";
import { Collection, ObjectId } from "mongodb";

export class OrderController {
    private orderCollection: Collection<Order>;
    private productCollection: Collection<Product>;
    private userCollection: Collection<User>;

    constructor() {
        const database = getDatabase();
        this.orderCollection = database.collection<Order>('orders');
        this.productCollection = database.collection<Product>('products');
        this.userCollection = database.collection<User>('users');
    }

    public async createOrder(c: Context) {
        try {
            const data = await c.req.json();
            const user = c.get('user');

            // Obtener información del usuario
            const userData = await this.userCollection.findOne(
                { _id: new ObjectId(user.userId) } as any,
                { projection: { password: 0 } }
            );

            if (!userData) {
                return c.json({
                    success: false,
                    message: 'Usuario no encontrado'
                }, 404);
            }

            // Validar y procesar items del pedido
            const orderItems: OrderItem[] = [];
            let totalAmount = 0;

            for (const item of data.items) {
                // Verificar que el producto existe
                const product = await this.productCollection.findOne({
                    _id: new ObjectId(item.productId)
                } as any);

                if (!product) {
                    return c.json({
                        success: false,
                        message: `Producto con ID ${item.productId} no encontrado`
                    }, 404);
                }

                const subtotal = product.price * item.quantity;

                orderItems.push({
                    productId: item.productId,
                    productName: product.name,
                    productPrice: product.price,
                    quantity: item.quantity,
                    subtotal: subtotal
                });

                totalAmount += subtotal;
            }

            // Crear el pedido
            const newOrder: Omit<Order, '_id'> = {
                userId: user.userId,
                customerName: `${userData.name} ${userData.lastName}`,
                customerEmail: userData.email,
                items: orderItems,
                totalAmount: totalAmount,
                status: 'pending',
                orderDate: new Date(),
                deliveryAddress: data.deliveryAddress,
                phone: data.phone,
                notes: data.notes,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await this.orderCollection.insertOne(newOrder);

            return c.json({
                success: true,
                message: 'Pedido creado exitosamente',
                data: {
                    orderId: result.insertedId,
                    order: { ...newOrder, _id: result.insertedId }
                }
            });

        } catch (error) {
            console.error('Error en createOrder:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getMyOrders(c: Context) {
        try {
            const user = c.get('user');
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '10');
            const skip = (page - 1) * limit;

            const orders = await this.orderCollection
                .find({ userId: user.userId })
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            const total = await this.orderCollection.countDocuments({ userId: user.userId });
            const totalPages = Math.ceil(total / limit);

            if (orders.length === 0) {
                return c.json({
                    success: false,
                    message: 'No tienes pedidos registrados'
                });
            }

            return c.json({
                success: true,
                data: orders,
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
            console.error('Error en getMyOrders:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getOrderById(c: Context) {
        try {
            const id = c.req.param('id');
            const user = c.get('user');

            const order = await this.orderCollection.findOne({
                _id: new ObjectId(id)
            } as any);

            if (!order) {
                return c.json({
                    success: false,
                    message: 'Pedido no encontrado'
                }, 404);
            }

            // Si es cliente, solo puede ver sus propios pedidos
            if (user.role === 'client' && order.userId !== user.userId) {
                return c.json({
                    success: false,
                    message: 'No tienes permisos para ver este pedido'
                }, 403);
            }

            return c.json({
                success: true,
                data: order
            });

        } catch (error) {
            console.error('Error en getOrderById:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getAllOrders(c: Context) {
        try {
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '10');
            const skip = (page - 1) * limit;

            // Filtro por estado
            const status = c.req.query('status');
            let filter = {};

            if (status) {
                filter = { status };
            }

            const orders = await this.orderCollection
                .find(filter)
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            const total = await this.orderCollection.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);

            if (orders.length === 0) {
                return c.json({
                    success: false,
                    message: 'No hay pedidos registrados'
                });
            }

            return c.json({
                success: true,
                data: orders,
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
            console.error('Error en getAllOrders:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async updateOrderStatus(c: Context) {
        try {
            const id = c.req.param('id');
            const { status } = await c.req.json();

            const order = await this.orderCollection.findOne({
                _id: new ObjectId(id)
            } as any);

            if (!order) {
                return c.json({
                    success: false,
                    message: 'Pedido no encontrado'
                }, 404);
            }

            // Validar transiciones de estado válidas
            const validTransitions: Record<string, string[]> = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['preparing', 'cancelled'],
                'preparing': ['ready', 'cancelled'],
                'ready': ['delivered'],
                'delivered': [], // Estado final
                'cancelled': [] // Estado final
            };

            if (!validTransitions[order.status].includes(status)) {
                return c.json({
                    success: false,
                    message: `No se puede cambiar de ${order.status} a ${status}`
                }, 400);
            }

            const result = await this.orderCollection.updateOne(
                { _id: new ObjectId(id) } as any,
                {
                    $set: {
                        status: status,
                        updatedAt: new Date()
                    }
                }
            );

            return c.json({
                success: true,
                message: 'Estado del pedido actualizado correctamente',
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            console.error('Error en updateOrderStatus:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async cancelOrder(c: Context) {
        try {
            const id = c.req.param('id');
            const user = c.get('user');

            const order = await this.orderCollection.findOne({
                _id: new ObjectId(id)
            } as any);

            if (!order) {
                return c.json({
                    success: false,
                    message: 'Pedido no encontrado'
                }, 404);
            }

            // Solo el cliente propietario o admin puede cancelar
            if (user.role === 'client' && order.userId !== user.userId) {
                return c.json({
                    success: false,
                    message: 'No tienes permisos para cancelar este pedido'
                }, 403);
            }

            // Solo se pueden cancelar pedidos pending o confirmed
            if (!['pending', 'confirmed'].includes(order.status)) {
                return c.json({
                    success: false,
                    message: 'No se puede cancelar un pedido en este estado'
                }, 400);
            }

            const result = await this.orderCollection.updateOne(
                { _id: new ObjectId(id) } as any,
                {
                    $set: {
                        status: 'cancelled',
                        updatedAt: new Date()
                    }
                }
            );

            return c.json({
                success: true,
                message: 'Pedido cancelado correctamente',
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            console.error('Error en cancelOrder:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }

    public async getOrderStats(c: Context) {
        try {
            const stats = await this.orderCollection.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$totalAmount" }
                    }
                }
            ]).toArray();

            const totalOrders = await this.orderCollection.countDocuments();
            const totalRevenue = await this.orderCollection.aggregate([
                { $match: { status: { $in: ['delivered'] } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]).toArray();

            return c.json({
                success: true,
                data: {
                    statusStats: stats,
                    totalOrders,
                    totalRevenue: totalRevenue[0]?.total || 0
                }
            });

        } catch (error) {
            console.error('Error en getOrderStats:', error);
            return c.json({
                success: false,
                message: 'Error interno del servidor'
            }, 500);
        }
    }
}