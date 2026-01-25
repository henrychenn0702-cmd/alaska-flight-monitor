import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Price records table - stores flight price data for each date
 */
export const priceRecords = mysqlTable("priceRecords", {
  id: int("id").autoincrement().primaryKey(),
  /** Date of the flight (YYYY-MM-DD format) */
  flightDate: varchar("flightDate", { length: 10 }).notNull(),
  /** Miles required (e.g., 75000, 175000, 250000) */
  miles: int("miles").notNull(),
  /** Additional fees in USD (e.g., 19, 24) */
  fees: int("fees").notNull(),
  /** Timestamp when this price was recorded */
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type PriceRecord = typeof priceRecords.$inferSelect;
export type InsertPriceRecord = typeof priceRecords.$inferInsert;

/**
 * Monitor logs table - tracks each monitoring check
 */
export const monitorLogs = mysqlTable("monitorLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** Status of the check: success, error, or found_deal */
  status: mysqlEnum("status", ["success", "error", "found_deal"]).notNull(),
  /** Number of dates checked */
  datesChecked: int("datesChecked").default(0),
  /** Number of 75k deals found */
  dealsFound: int("dealsFound").default(0),
  /** Error message if status is error */
  errorMessage: text("errorMessage"),
  /** Timestamp of the check */
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
});

export type MonitorLog = typeof monitorLogs.$inferSelect;
export type InsertMonitorLog = typeof monitorLogs.$inferInsert;

/**
 * Notifications table - records all sent notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Title of the notification */
  title: text("title").notNull(),
  /** Content/body of the notification */
  content: text("content").notNull(),
  /** Flight dates that triggered this notification */
  flightDates: text("flightDates").notNull(),
  /** Whether notification was sent successfully (1 = true, 0 = false) */
  sent: int("sent").default(0).notNull(),
  /** Timestamp when notification was sent */
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Filter settings table - stores user's custom price filter preferences
 */
export const filterSettings = mysqlTable("filterSettings", {
  id: int("id").autoincrement().primaryKey(),
  /** Target miles price to monitor (e.g., 75000, 100000) */
  targetMiles: int("targetMiles").notNull(),
  /** Whether this filter is active */
  active: int("active").default(1).notNull(),
  /** Optional description for this filter */
  description: text("description"),
  /** Timestamp when this filter was created */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Timestamp when this filter was last updated */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FilterSetting = typeof filterSettings.$inferSelect;
export type InsertFilterSetting = typeof filterSettings.$inferInsert;