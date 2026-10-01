import type { Session } from "@travelPartner/auth";
import type { Database } from "@travelPartner/db";

export type Context = {
  session: Session | null;
  db: Database;
};
