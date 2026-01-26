import { runMonitoring } from "./server/monitorService.js";
import { initializeEmailService } from "./server/emailService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("=== Manual Monitoring Check ===\n");

// Initialize email service
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  initializeEmailService(sendgridApiKey);
  console.log("[Manual Check] Email service initialized\n");
} else {
  console.warn("[Manual Check] SENDGRID_API_KEY not set, email notifications will be disabled\n");
}

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
