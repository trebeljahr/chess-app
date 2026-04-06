import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { AppContext } from "./context.js";

const t = initTRPC.context<AppContext>().create({
  transformer: superjson
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in first."
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
