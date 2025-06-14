import { Hono } from 'hono';
import { jwt } from "hono/jwt"
import { UserController } from "../controller/User.controller";
import {zValidator} from "@hono/zod-validator";
import { updateUser, validID} from "../Schemas/User.schema";
import {isAutenticate} from "../middleware/token/isAutenticate";
import {isRole} from "../middleware/token/isRole";
import {environments} from "../services/environment.service";

const userRouter = new Hono();
const userController = new UserController()

userRouter.get(
    '/users',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin']),
    (c)=> userController.getUsers(c)
)

userRouter.get(
    '/users/:id',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin']),
    (c) => userController.getUserById(c)
)

userRouter.patch(
    '/users/:id',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin', 'client']),
    zValidator('json', updateUser),
    (c)=> userController.updateUser(c)
)

userRouter.delete(
    '/users/:id',
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    isRole(['admin']),
    (c) => userController.deleteUser(c)
)

export default userRouter;