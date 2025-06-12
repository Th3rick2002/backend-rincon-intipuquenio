import { Hono } from 'hono'
import {cors} from "hono/cors";
import {prettyJSON} from "hono/pretty-json";
import {logger} from "hono/logger";
import {initDatabase} from "./services/db.service";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";

const app = new Hono()

// configuration
app.use('*', cors())
app.use(prettyJSON())
app.use(logger())

//services
initDatabase()

//routes
app.get('/health', (c)=> c.text('OK'))
app.route('/api', userRoute)
app.route('/api', authRoute)

export default app