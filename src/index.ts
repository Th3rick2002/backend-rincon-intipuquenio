import app from "./server";
import {environments} from "./services/environment.service";

Bun.serve({
  fetch: app.fetch,
  port: environments.port || 5000,
  hostname: '0.0.0.0'
})