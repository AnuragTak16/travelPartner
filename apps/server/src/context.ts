import type { Context as ApiContext } from "@travelPartner/api/context";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Context as HonoContext } from "hono";

import type { AppServices } from "./services";

type TrpcHonoContext = HonoContext<{
  Variables: { services: AppServices };
}>;

export async function createContext(
  opts: FetchCreateContextFnOptions,
  c: TrpcHonoContext,
): Promise<ApiContext> {
  const { auth, db } = c.get("services");

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: opts.req.headers,
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
