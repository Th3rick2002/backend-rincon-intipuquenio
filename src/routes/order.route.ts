import { Hono } from "hono";
import { OrderController } from "../controller/order.controller";
import { zValidator } from "@hono/zod-validator";
import { isAutenticate } from "../middleware/token/isAutenticate";
import { isRole } from "../middleware/token/isRole";
import { jwtFromSignedCookie } from "../middleware/token/TokenFromCookie";
import { createOrderSchema, updateOrderStatusSchema, mongoIdSchema } from "../Schemas/order.schema";

const orderRouter = new Hono();
const orderController = new OrderController();

// Crear pedido (solo clientes autenticados)
orderRouter.post(
    '/orders',
    zValidator('json', createOrderSchema),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['client']),
    (c) => orderController.createOrder(c)
);

// Obtener mis pedidos (solo clientes autenticados)
orderRouter.get(
    '/orders/my-orders',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['client']),
    (c) => orderController.getMyOrders(c)
);

// Obtener todos los pedidos (solo admin)
orderRouter.get(
    '/orders',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => orderController.getAllOrders(c)
);

// Obtener estadísticas de pedidos (solo admin)
orderRouter.get(
    '/orders/stats',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => orderController.getOrderStats(c)
);

// Obtener pedido por ID (cliente puede ver solo los suyos, admin puede ver todos)
orderRouter.get(
    '/orders/:id',
    zValidator('param', mongoIdSchema),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin', 'client']),
    (c) => orderController.getOrderById(c)
);

// Actualizar estado del pedido (solo admin)
orderRouter.patch(
    '/orders/:id/status',
    zValidator('param', mongoIdSchema),
    zValidator('json', updateOrderStatusSchema),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => orderController.updateOrderStatus(c)
);

// Cancelar pedido (cliente puede cancelar los suyos, admin puede cancelar cualquiera)
orderRouter.patch(
    '/orders/:id/cancel',
    zValidator('param', mongoIdSchema),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin', 'client']),
    (c) => orderController.cancelOrder(c)
);

export default orderRouter;