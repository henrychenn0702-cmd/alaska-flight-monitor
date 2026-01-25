import { runMonitoring } from "./server/monitorService.js";

console.log("=== Manual Monitoring Check ===\n");

try {
  const result = await runMonitoring();
  console.log("\n✅ Check completed:");
  console.log(`   Success: ${result.success}`);
  console.log(`   Dates checked: ${result.datesChecked}`);
  console.log(`   Deals found: ${result.dealsFound}`);
  if (result.dealDates.length > 0) {
    console.log(`   Deal dates: ${result.dealDates.join(", ")}`);
  }
} catch (error) {
  console.error("\n❌ Check failed:", error.message);
}

process.exit(0);
