import type { Context as ApiContext } from "@travelPartner/api/context";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";

import { db } from "./services";
import { auth } from "./services";

export async function createContext(opts: CreateExpressContextOptions): Promise<ApiContext> {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: fromNodeHeaders(opts.req.headers),
    });
  } catch {
    session = null;
  }
  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
