import { appRouter } from "@travelPartner/api/routers/index";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createContext } from "./context";
import { getServices, type AppServices, type ServerEnv } from "./services";

export type { ServerEnv };

export function createApp(env: ServerEnv) {
  const services = getServices(env);

  const app = new Hono<{
    Bindings: ServerEnv;
    Variables: { services: AppServices };
  }>();

  app.use("*", async (c, next) => {
    c.set("services", services);
    await next();
  });

  app.use(
    "*",
    cors({
      origin: services.corsOrigin,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.on(["GET", "POST"], "/api/auth/*", (c) => {
    return services.auth.handler(c.req.raw);
  });

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext,
    }),
  );

  app.get("/", (c) => c.text("OK"));

  return app;
}
