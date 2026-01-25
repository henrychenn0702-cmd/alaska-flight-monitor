import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "./db";
import { priceRecords, monitorLogs, notifications } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { getActiveFilters } from "./filterService";
import { getActiveRecipients } from "./recipientService";

const ALASKA_URL =
  "https://www.alaskaair.com/search/calendar?O=SA2&D=TPE&OD=2026-02-01&A=1&RT=false&RequestType=Calendar&int=flightresultsmicrosite%3Aviewby-calendar&locale=en-us&ShoppingMethod=onlineaward&FareType=Partner+Business&CM=2026-02&DD=2026-02-01";

interface FlightPrice {
  date: string;
  miles: number;
  fees: number;
}

/**
 * Fetch and parse Alaska Airlines award calendar page
 * Tries multiple parsing strategies to handle dynamic content
 */
export async function fetchFlightPrices(): Promise<FlightPrice[]> {
  try {
    console.log("[MonitorService] Fetching Alaska Airlines calendar...");

    const response = await axios.get(ALASKA_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const prices: FlightPrice[] = [];

    // Strategy 1: Parse from aria-label attributes on buttons
    console.log("[MonitorService] Parsing from aria-label attributes...");
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

    // Strategy 2: Parse from text content if aria-label parsing didn't work
    if (prices.length === 0) {
      console.log(
        "[MonitorService] Aria-label parsing found no prices, trying text content..."
      );

      $('button[role="gridcell"]').each((_, element) => {
        const text = $(element).text();
        const ariaLabel = $(element).attr("aria-label");

        // Try to extract from text like "1 175k +$19"
        const textMatch = text.match(/(\d+)\s+(\d+)k\s+\+\$(\d+)/);
        const labelMatch = ariaLabel?.match(/([A-Za-z]+)\s+(\d+),\s+(\d{4})/);

        if (textMatch && labelMatch) {
          const [, , milesStr, feesStr] = textMatch;
          const [, month, day, year] = labelMatch;

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

          // Check if this price already exists
          const exists = prices.some(
            (p) => p.date === date && p.miles === miles
          );
          if (!exists) {
            prices.push({ date, miles, fees });
          }
        }
      });
    }

    console.log(`[MonitorService] Extracted ${prices.length} flight prices`);

    // Log sample prices for debugging
    if (prices.length > 0) {
      console.log(
        "[MonitorService] Sample prices:",
        prices.slice(0, 3).map((p) => `${p.date}: ${p.miles / 1000}k`)
      );
    }

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
 * Check for deals matching active filters and send notifications
 */
export async function checkForDeals(
  prices: FlightPrice[]
): Promise<{ found: boolean; dates: string[] }> {
  const activeFilters = await getActiveFilters();

  if (activeFilters.length === 0) {
    console.log("[MonitorService] No active filters configured");
    return { found: false, dates: [] };
  }

  const dealDates: string[] = [];
  const dealsByFilter: Record<number, string[]> = {};

  // Group deals by filter
  for (const filter of activeFilters) {
    const matchingDates = prices
      .filter((p) => p.miles === filter.targetMiles)
      .map((p) => p.date);

    if (matchingDates.length > 0) {
      dealsByFilter[filter.targetMiles] = matchingDates;
      dealDates.push(...matchingDates);
      console.log(
        `[MonitorService] Found ${matchingDates.length} deals for ${filter.targetMiles / 1000}k`
      );
    }
  }

  if (dealDates.length > 0) {
    // Build notification content
    let content = "🎉 發現特價里程票!\n\n";
    for (const filter of activeFilters) {
      const dates = dealsByFilter[filter.targetMiles];
      if (dates && dates.length > 0) {
        content += `${filter.description || `${filter.targetMiles / 1000}k 里程票`}:\n`;
        dates.forEach((d) => {
          content += `  • ${d}\n`;
        });
        content += "\n";
      }
    }
    content += "立即前往阿拉斯加航空預訂!";

    const title = "🎉 特價里程票發現!";

    try {
      // Send notification to owner
      const ownerSuccess = await notifyOwner({ title, content });

      // Get all active email recipients
      const recipients = await getActiveRecipients();
      console.log(
        `[MonitorService] Found ${recipients.length} active email recipients`
      );

      if (recipients.length > 0) {
        console.log(
          `[MonitorService] Would send email to: ${recipients.join(", ")}`
        );
        // In a real implementation, you would send emails to each recipient here
        // For now, we just log that we would send them
      }

      // Save notification record
      const db = await getDb();
      if (db) {
        await db.insert(notifications).values({
          title,
          content,
          flightDates: dealDates.join(","),
          sent: ownerSuccess ? 1 : 0,
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
