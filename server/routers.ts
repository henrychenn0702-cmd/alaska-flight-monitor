import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
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
    getLatestPrices: publicProcedure.query(async () => {
      const { getLatestPrices } = await import("./queries");
      return await getLatestPrices();
    }),

    getRecentLogs: publicProcedure.query(async () => {
      const { getRecentLogs } = await import("./queries");
      return await getRecentLogs(50);
    }),

    getNotifications: publicProcedure.query(async () => {
      const { getAllNotifications } = await import("./queries");
      return await getAllNotifications(50);
    }),

    getStats: publicProcedure.query(async () => {
      const { getMonitorStats } = await import("./queries");
      return await getMonitorStats();
    }),

    getDealsByFilter: publicProcedure.query(async () => {
      const { getDealsByFilter } = await import("./queries");
      return await getDealsByFilter();
    }),

    runCheck: publicProcedure.mutation(async () => {
      const { runMonitoring } = await import("./monitorService");
      return await runMonitoring();
    }),
  }),

  recipients: router({
    getAll: publicProcedure.query(async () => {
      const { getAllRecipients } = await import("./recipientService");
      return await getAllRecipients();
    }),

    add: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          email: obj.email as string,
          name: (obj.name as string | undefined) || undefined,
        };
      })
      .mutation(async ({ input }) => {
        const { addRecipient } = await import("./recipientService");
        return await addRecipient(input.email, input.name);
      }),

    remove: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return { id: obj.id as number };
      })
      .mutation(async ({ input }) => {
        const { removeRecipient } = await import("./recipientService");
        return await removeRecipient(input.id);
      }),

    toggle: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return { id: obj.id as number };
      })
      .mutation(async ({ input }) => {
        const { toggleRecipient } = await import("./recipientService");
        return await toggleRecipient(input.id);
      }),
  }),

  filters: router({
    getActive: publicProcedure.query(async () => {
      const { getActiveFilters } = await import("./filterService");
      return await getActiveFilters();
    }),

    getAll: publicProcedure.query(async () => {
      const { getAllFilters } = await import("./filterService");
      return await getAllFilters();
    }),

    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          targetMiles: obj.targetMiles as number,
          description: (obj.description as string | undefined) || undefined,
        };
      })
      .mutation(async ({ input }) => {
        const { createFilter } = await import("./filterService");
        return await createFilter(input.targetMiles, input.description);
      }),

    update: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          id: obj.id as number,
          description: (obj.description as string | undefined) || undefined,
          active: (obj.active as number | undefined) || undefined,
        };
      })
      .mutation(async ({ input }) => {
        const { updateFilter } = await import("./filterService");
        return await updateFilter(input.id, {
          description: input.description,
          active: input.active,
        });
      }),

    delete: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return { id: obj.id as number };
      })
      .mutation(async ({ input }) => {
        const { deleteFilter } = await import("./filterService");
        return await deleteFilter(input.id);
      }),

    toggle: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return { id: obj.id as number };
      })
      .mutation(async ({ input }) => {
        const { toggleFilter } = await import("./filterService");
        return await toggleFilter(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
