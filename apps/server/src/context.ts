import type { Context as ApiContext } from "@travelPartner/api/context";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";

import { db } from "./services";
import { auth } from "./services";

export async function createContext(opts: CreateExpressContextOptions): Promise<ApiContext> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(opts.req.headers),
  });
  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
