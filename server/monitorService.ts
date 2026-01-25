import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "./db";
import { priceRecords, monitorLogs, notifications } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

const ALASKA_URL =
  "https://www.alaskaair.com/search/calendar?O=SA2&D=TPE&OD=2026-02-01&A=1&RT=false&RequestType=Calendar&int=flightresultsmicrosite%3Aviewby-calendar&locale=en-us&ShoppingMethod=onlineaward&FareType=Partner+Business&CM=2026-02&DD=2026-02-01";

const TARGET_MILES = 75000;

interface FlightPrice {
  date: string;
  miles: number;
  fees: number;
}

/**
 * Fetch and parse Alaska Airlines award calendar page
 */
export async function fetchFlightPrices(): Promise<FlightPrice[]> {
  try {
    const response = await axios.get(ALASKA_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const prices: FlightPrice[] = [];

    // Find all date buttons with aria-label containing fare information
    $('button[role="gridcell"]').each((_, element) => {
      const ariaLabel = $(element).attr("aria-label");
      if (!ariaLabel) return;

      // Parse aria-label: "Feb 1, 2026. Fare: 175k + $19"
      const match = ariaLabel.match(
        /([A-Za-z]+)\s+(\d+),\s+(\d{4})\.\s+Fare:\s+(\d+)k\s+\+\s+\$(\d+)/
      );
      if (!match) return;

      const [, month, day, year, milesStr, feesStr] = match;
      const monthMap: Record<string, string> = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
      };

      const monthNum = monthMap[month];
      if (!monthNum) return;

      const date = `${year}-${monthNum}-${day.padStart(2, "0")}`;
      const miles = parseInt(milesStr) * 1000;
      const fees = parseInt(feesStr);

      prices.push({ date, miles, fees });
    });

    return prices;
  } catch (error) {
    console.error("[MonitorService] Failed to fetch prices:", error);
    throw error;
  }
}

/**
 * Save price records to database
 */
export async function savePriceRecords(prices: FlightPrice[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[MonitorService] Database not available");
    return;
  }

  try {
    for (const price of prices) {
      await db.insert(priceRecords).values({
        flightDate: price.date,
        miles: price.miles,
        fees: price.fees,
      });
    }
  } catch (error) {
    console.error("[MonitorService] Failed to save price records:", error);
    throw error;
  }
}

/**
 * Check for 75k deals and send notifications
 */
export async function checkForDeals(
  prices: FlightPrice[]
): Promise<{ found: boolean; dates: string[] }> {
  const dealDates = prices
    .filter((p) => p.miles === TARGET_MILES)
    .map((p) => p.date);

  if (dealDates.length > 0) {
    const title = "🎉 75k 特價里程票發現!";
    const content = `發現 ${dealDates.length} 個 75k 特價里程票:\n\n${dealDates
      .map((d) => `• ${d}`)
      .join("\n")}\n\n立即前往阿拉斯加航空預訂!`;

    try {
      const success = await notifyOwner({ title, content });

      // Save notification record
      const db = await getDb();
      if (db) {
        await db.insert(notifications).values({
          title,
          content,
          flightDates: dealDates.join(","),
          sent: success ? 1 : 0,
        });
      }
    } catch (error) {
      console.error("[MonitorService] Failed to send notification:", error);
    }
  }

  return { found: dealDates.length > 0, dates: dealDates };
}

/**
 * Save monitor log to database
 */
export async function saveMonitorLog(
  status: "success" | "error" | "found_deal",
  datesChecked: number,
  dealsFound: number,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[MonitorService] Database not available");
    return;
  }

  try {
    await db.insert(monitorLogs).values({
      status,
      datesChecked,
      dealsFound,
      errorMessage: errorMessage || null,
    });
  } catch (error) {
    console.error("[MonitorService] Failed to save monitor log:", error);
  }
}

/**
 * Main monitoring function - fetches prices, checks for deals, and logs results
 */
export async function runMonitoring(): Promise<{
  success: boolean;
  datesChecked: number;
  dealsFound: number;
  dealDates: string[];
  error?: string;
}> {
  try {
    console.log("[MonitorService] Starting monitoring check...");

    // Fetch current prices
    const prices = await fetchFlightPrices();
    console.log(`[MonitorService] Fetched ${prices.length} flight prices`);

    // Save price records
    await savePriceRecords(prices);

    // Check for deals
    const { found, dates } = await checkForDeals(prices);

    // Save log
    const status = found ? "found_deal" : "success";
    await saveMonitorLog(status, prices.length, dates.length);

    console.log(
      `[MonitorService] Check complete - ${dates.length} deals found`
    );

    return {
      success: true,
      datesChecked: prices.length,
      dealsFound: dates.length,
      dealDates: dates,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[MonitorService] Monitoring failed:", errorMessage);

    // Save error log
    await saveMonitorLog("error", 0, 0, errorMessage);

    return {
      success: false,
      datesChecked: 0,
      dealsFound: 0,
      dealDates: [],
      error: errorMessage,
    };
  }
}
