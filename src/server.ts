import { Hono } from 'hono'
import {cors} from "hono/cors";
import {prettyJSON} from "hono/pretty-json";
import {logger} from "hono/logger";
import {initDatabase} from "./services/db.service";
import {serveStatic} from "hono/bun";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import productRoute from "./routes/product.route";

const app = new Hono()

// configuration
app.use(
    '*',
    cors({
        origin: 'https://localhost:5173',
        credentials: true,
    }))
app.use(prettyJSON())
app.use(logger())

//services
initDatabase()

//routes
app.get('/health', (c)=> c.text('OK'))
app.route('/api', userRoute)
app.route('/api', authRoute)
app.route('/api', productRoute)
app.use('/images/*', serveStatic({ root: './public' }))


export default app