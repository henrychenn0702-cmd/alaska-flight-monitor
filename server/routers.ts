import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  monitor: router({
    // Get latest flight prices
    getLatestPrices: publicProcedure.query(async () => {
      const { getLatestPrices } = await import("./queries");
      return await getLatestPrices();
    }),

    // Get recent monitor logs
    getRecentLogs: publicProcedure.query(async () => {
      const { getRecentLogs } = await import("./queries");
      return await getRecentLogs(50);
    }),

    // Get all notifications
    getNotifications: publicProcedure.query(async () => {
      const { getAllNotifications } = await import("./queries");
      return await getAllNotifications(50);
    }),

    // Get monitoring statistics
    getStats: publicProcedure.query(async () => {
      const { getMonitorStats } = await import("./queries");
      return await getMonitorStats();
    }),

    // Manually trigger a monitoring check
    runCheck: publicProcedure.mutation(async () => {
      const { runMonitoring } = await import("./monitorService");
      return await runMonitoring();
    }),
  }),
});

export type AppRouter = typeof appRouter;
