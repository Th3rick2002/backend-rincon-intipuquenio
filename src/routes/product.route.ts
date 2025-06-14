import { Hono } from "hono";
import { ProductController } from "../controller/Product.controller";
import { zValidator } from "@hono/zod-validator";
import { isAutenticate } from "../middleware/token/isAutenticate";
import { isRole } from "../middleware/token/isRole";
import { uploadImage } from "../middleware/uploadImage/uploadImage";
import { jwtFromSignedCookie } from "../middleware/token/TokenFromCookie";
import { z } from "zod";

const productRouter = new Hono();
const productController = new ProductController();

// Validador para ID de MongoDB
const mongoIdValidator = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de MongoDB inválido")
});

// Obtener todos los productos (público - sin autenticación)
productRouter.get(
    '/products',
    (c) => productController.getProducts(c)
);

// Obtener producto por ID (público - sin autenticación)
productRouter.get(
    '/products/:id',
    zValidator('param', mongoIdValidator),
    (c) => productController.getProductById(c)
);

// Crear producto (solo admin)
productRouter.post(
    '/products',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    uploadImage,
    (c) => productController.createProduct(c)
);

// Actualizar producto (solo admin)
productRouter.patch(
    '/products/:id',
    zValidator('param', mongoIdValidator),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    uploadImage, // Permitir actualizar imagen opcionalmente
    (c) => productController.updateProduct(c)
);

// Eliminar producto (solo admin)
productRouter.delete(
    '/products/:id',
    zValidator('param', mongoIdValidator),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => productController.deleteProduct(c)
);

export default productRouter;