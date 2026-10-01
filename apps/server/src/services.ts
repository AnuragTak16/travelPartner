import { createAuth } from "@travelPartner/auth";
import { createPrismaClient } from "@travelPartner/db";

import { ENV } from "./env.server";

export const db = createPrismaClient(ENV);
export const auth = createAuth(ENV, db);
