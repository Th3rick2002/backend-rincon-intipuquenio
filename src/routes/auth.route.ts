import {Hono} from "hono";
import {UserController} from "../controller/User.constroller";
import {zValidator} from "@hono/zod-validator";
import {createUser, loginUser} from "../Schemas/User.schema";

const authRouter = new Hono();
const userController = new UserController()

authRouter.post(
    '/auth/register',
    zValidator('json', createUser),
    (c)=> userController.createUser(c)
)

authRouter.post(
    '/auth/login',
    zValidator('json', loginUser),
    async (c) => userController.login(c)
)

export default authRouter;