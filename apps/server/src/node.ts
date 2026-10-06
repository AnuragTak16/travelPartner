import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { ENV } from "./env.server";

const app = createApp({
  DATABASE_URL: ENV.DATABASE_URL,
  BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: ENV.BETTER_AUTH_URL,
  CORS_ORIGIN: ENV.CORS_ORIGIN,
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
