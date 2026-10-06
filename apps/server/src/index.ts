import { createApp, type ServerEnv } from "./app";

/**
 * Cloudflare Workers entry — runtime secrets/bindings supply env.
 * Optional HYPERDRIVE binding overrides DATABASE_URL when configured.
 */
export default {
  async fetch(request: Request, env: ServerEnv, ctx: ExecutionContext) {
    return createApp(env).fetch(request, env, ctx);
  },
};
