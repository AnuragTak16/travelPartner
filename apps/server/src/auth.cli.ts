import { ENV } from "./env.server";
import { getServices } from "./services";

/** Module-level auth instance for `auth generate` CLI only. */
export const auth = getServices({
  DATABASE_URL: ENV.DATABASE_URL,
  BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: ENV.BETTER_AUTH_URL,
  CORS_ORIGIN: ENV.CORS_ORIGIN,
}).auth;
