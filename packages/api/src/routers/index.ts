import { protectedProcedure, publicProcedure, router } from "../index";

import { travelRouter } from "./travel";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  travel: travelRouter,
});
export type AppRouter = typeof appRouter;
