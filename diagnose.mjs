import { getDb } from "./server/db.js";
import { filterSettings, priceRecords } from "./drizzle/schema.js";
import { desc } from "drizzle-orm";

console.log("=== Diagnosing Filter and Price Detection ===\n");

const db = await getDb();

if (!db) {
  console.error("❌ Database not available");
  process.exit(1);
}

// Check filters
console.log("1. Checking active filters:");
const filters = await db.select().from(filterSettings);
console.log(`   Found ${filters.length} filters:`);
filters.forEach((f) => {
  console.log(`   - ${f.targetMiles / 1000}k (${f.description})`);
  console.log(`     Active: ${f.active === 1 ? "✅ Yes" : "❌ No"}`);
  console.log(`     Target Miles: ${f.targetMiles}`);
});

// Check latest prices
console.log("\n2. Checking latest price records:");
const prices = await db
  .select()
  .from(priceRecords)
  .orderBy(desc(priceRecords.recordedAt))
  .limit(10);

console.log(`   Found ${prices.length} recent price records:`);
prices.forEach((p) => {
  console.log(`   - ${p.flightDate}: ${p.miles / 1000}k + $${p.fees}`);
  console.log(`     Recorded at: ${p.recordedAt}`);
});

// Check if any prices match active filters
console.log("\n3. Checking for matches:");
const activeFilters = filters.filter((f) => f.active === 1);
if (activeFilters.length === 0) {
  console.log("   ❌ No active filters found!");
} else {
  for (const filter of activeFilters) {
    const matchingPrices = prices.filter((p) => p.miles === filter.targetMiles);
    console.log(`   Filter ${filter.targetMiles / 1000}k:`);
    console.log(`     Matching prices: ${matchingPrices.length}`);
    if (matchingPrices.length > 0) {
      matchingPrices.forEach((p) => {
        console.log(`       ✅ ${p.flightDate}: ${p.miles / 1000}k`);
      });
    } else {
      console.log(`       ❌ No matching prices found`);
      console.log(`       Available miles in data: ${[...new Set(prices.map((p) => p.miles / 1000))].join("k, ")}k`);
    }
  }
}

process.exit(0);
