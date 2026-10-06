import { createAuth } from "@travelPartner/auth";
import { createPrismaClient, type Database } from "@travelPartner/db";

export type ServerEnv = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN: string;
  /** Optional Cloudflare Hyperdrive binding */
  HYPERDRIVE?: { connectionString: string };
};

export type AppServices = {
  db: Database;
  auth: ReturnType<typeof createAuth>;
  corsOrigin: string;
};

let cached: { key: string; services: AppServices } | null = null;

export function getServices(env: ServerEnv): AppServices {
  const databaseUrl = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL (or HYPERDRIVE) is required");
  }

  const key = [
    databaseUrl,
    env.BETTER_AUTH_SECRET,
    env.BETTER_AUTH_URL,
    env.CORS_ORIGIN,
  ].join("|");

  if (cached?.key === key) return cached.services;

  const db = createPrismaClient({ DATABASE_URL: databaseUrl });
  const auth = createAuth(
    {
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      CORS_ORIGIN: env.CORS_ORIGIN,
    },
    db,
  );

  const services = { db, auth, corsOrigin: env.CORS_ORIGIN };
  cached = { key, services };
  return services;
}
