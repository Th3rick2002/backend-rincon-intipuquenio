import {Hono} from "hono";
import { jwt } from "hono/jwt"
import {UserController} from "../controller/User.controller";
import {zValidator} from "@hono/zod-validator";
import {createUser, loginUser} from "../Schemas/User.schema";
import {Protected} from "../middleware/token/generateToken";
import {isAutenticate} from "../middleware/token/isAutenticate";
import {environments} from "../services/environment.service";
import {jwtFromCookie} from "../middleware/token/TokenFromCookie"

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

authRouter.post(
    '/auth/refresh',
    (c) => Protected.refreshToken(c)
)

authRouter.get(
    '/auth/profile',
    jwtFromCookie,
    isAutenticate,
    (c) => userController.profile(c)
)

export default authRouter;