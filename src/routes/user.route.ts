import { Hono } from 'hono';
import { UserController } from "../controller/User.constroller";
import {zValidator} from "@hono/zod-validator";
import { updateUser, validID} from "../Schemas/User.schema";

const userRouter = new Hono();
const userController = new UserController()

userRouter.get(
    '/users',
    (c)=> userController.getUsers(c)
)

export default userRouter;