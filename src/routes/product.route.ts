import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { ProductController } from "../controller/Product.controller";
import { zValidator } from "@hono/zod-validator";
import { productSchema, productSchemaUpdate } from "../Schemas/Product.schema";
import { isAutenticate } from "../middleware/token/isAutenticate";
import { isRole } from "../middleware/token/isRole";
import {uploadImage} from "../middleware/uploadImage/uploadImage";
import { environments } from "../services/environment.service";

const productRouter = new Hono();
const productController = new ProductController()

productRouter.get(
    '/products',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin', 'client']),
    (c)=> productController.getProducts(c)
)

productRouter.post(
    '/products',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin']),
    uploadImage,

    (c)=> productController.createProduct(c)
)

productRouter.patch(
    '/products/:id',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin', 'client']),
    zValidator('json', productSchemaUpdate),
    (c)=> productController.updateProduct(c)
)

productRouter.delete(
    '/products/:id',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin']),
    (c) => productController.deleteProduct(c)
)

export default productRouter;