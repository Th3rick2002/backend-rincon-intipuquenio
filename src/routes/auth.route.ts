import {Hono} from "hono";
import { jwt } from "hono/jwt"
import {UserController} from "../controller/User.constroller";
import {zValidator} from "@hono/zod-validator";
import {createUser, loginUser} from "../Schemas/User.schema";
import {Protected} from "../middleware/token/generateToken";
import {isAutenticate} from "../middleware/token/isAutenticate";
import {environments} from "../services/environment.service";

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
    jwt({ secret: environments.jwt_secret }),
    isAutenticate,
    (c) => userController.profile(c))

export default authRouter;