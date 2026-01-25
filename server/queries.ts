import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { priceRecords, monitorLogs, notifications } from "../drizzle/schema";

/**
 * Get the latest price for each flight date
 */
export async function getLatestPrices() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get the most recent price record for each flight date
    const result = await db
      .select({
        flightDate: priceRecords.flightDate,
        miles: priceRecords.miles,
        fees: priceRecords.fees,
        recordedAt: priceRecords.recordedAt,
      })
      .from(priceRecords)
      .orderBy(desc(priceRecords.recordedAt))
      .limit(100);

    // Group by date and keep only the latest record for each date
    const latestByDate = new Map<
      string,
      {
        flightDate: string;
        miles: number;
        fees: number;
        recordedAt: Date;
      }
    >();

    for (const record of result) {
      if (!latestByDate.has(record.flightDate)) {
        latestByDate.set(record.flightDate, record);
      }
    }

    return Array.from(latestByDate.values()).sort(
      (a, b) => a.flightDate.localeCompare(b.flightDate)
    );
  } catch (error) {
    console.error("[Queries] Failed to get latest prices:", error);
    return [];
  }
}

/**
 * Get recent monitor logs
 */
export async function getRecentLogs(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(monitorLogs)
      .orderBy(desc(monitorLogs.checkedAt))
      .limit(limit);
  } catch (error) {
    console.error("[Queries] Failed to get recent logs:", error);
    return [];
  }
}

/**
 * Get all notifications
 */
export async function getAllNotifications(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.sentAt))
      .limit(limit);
  } catch (error) {
    console.error("[Queries] Failed to get notifications:", error);
    return [];
  }
}

/**
 * Get price history for a specific date
 */
export async function getPriceHistory(flightDate: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(priceRecords)
      .where(eq(priceRecords.flightDate, flightDate))
      .orderBy(desc(priceRecords.recordedAt))
      .limit(100);
  } catch (error) {
    console.error("[Queries] Failed to get price history:", error);
    return [];
  }
}

/**
 * Get deals found by filter from recent notifications
 */
export async function getDealsByFilter() {
  const db = await getDb();
  if (!db) return {};

  try {
    const recentNotifications = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.sentAt))
      .limit(10);

    const filterTotals: Record<number, number> = {};

    for (const notification of recentNotifications) {
      try {
        const details = JSON.parse(notification.filterDetails || "{}");
        for (const [miles, count] of Object.entries(details)) {
          const milesNum = Number(miles);
          filterTotals[milesNum] = (filterTotals[milesNum] || 0) + Number(count);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    return filterTotals;
  } catch (error) {
    console.error("[Queries] Failed to get deals by filter:", error);
    return {};
  }
}

/**
 * Get monitoring statistics
 */
export async function getMonitorStats() {
  const db = await getDb();
  if (!db)
    return {
      totalChecks: 0,
      successfulChecks: 0,
      totalDealsFound: 0,
      lastCheck: null,
    };

  try {
    const stats = await db
      .select({
        totalChecks: sql<number>`COUNT(*)`,
        successfulChecks: sql<number>`SUM(CASE WHEN status != 'error' THEN 1 ELSE 0 END)`,
        totalDealsFound: sql<number>`SUM(dealsFound)`,
      })
      .from(monitorLogs);

    const lastCheckResult = await db
      .select()
      .from(monitorLogs)
      .orderBy(desc(monitorLogs.checkedAt))
      .limit(1);

    return {
      totalChecks: Number(stats[0]?.totalChecks || 0),
      successfulChecks: Number(stats[0]?.successfulChecks || 0),
      totalDealsFound: Number(stats[0]?.totalDealsFound || 0),
      lastCheck: lastCheckResult[0] || null,
    };
  } catch (error) {
    console.error("[Queries] Failed to get monitor stats:", error);
    return {
      totalChecks: 0,
      successfulChecks: 0,
      totalDealsFound: 0,
      lastCheck: null,
    };
  }
}
