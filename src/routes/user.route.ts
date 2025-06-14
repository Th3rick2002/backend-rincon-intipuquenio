import { Hono } from 'hono';
import { UserController } from "../controller/User.controller";
import { zValidator } from "@hono/zod-validator";
import { updateUser, validID } from "../Schemas/User.schema";
import { isAutenticate } from "../middleware/token/isAutenticate";
import { isRole } from "../middleware/token/isRole";
import { jwtFromSignedCookie } from "../middleware/token/TokenFromCookie";

const userRouter = new Hono();
const userController = new UserController();

// Obtener todos los usuarios (solo admin)
userRouter.get(
    '/users',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => userController.getUsers(c)
);

// Obtener usuario por ID (solo admin)
userRouter.get(
    '/users/:id',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => userController.getUserById(c)
);

// Actualizar usuario (admin puede actualizar cualquiera, client solo a sí mismo)
userRouter.patch(
    '/users/:id',
    zValidator('json', updateUser),
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin', 'client']),
    (c) => userController.updateUser(c)
);

// Eliminar usuario (solo admin)
userRouter.delete(
    '/users/:id',
    jwtFromSignedCookie,
    isAutenticate,
    isRole(['admin']),
    (c) => userController.deleteUser(c)
);

export default userRouter;