import { describe, it, expect, beforeAll } from "vitest";
import { initializeEmailService, sendDealNotification } from "./emailService";

describe("emailService", () => {
  beforeAll(() => {
    // Initialize with environment variable
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      initializeEmailService(apiKey);
    }
  });

  it("should validate SendGrid credentials by sending a test email", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    // Skip test if credentials not provided
    if (!apiKey || !fromEmail) {
      console.warn("Skipping email test: SENDGRID_API_KEY or SENDGRID_FROM_EMAIL not set");
      return;
    }

    // Send a test email to the owner
    const testDeals = [
      { date: "2026-02-01", miles: 175000, fees: 18 },
      { date: "2026-02-02", miles: 175000, fees: 18 },
    ];

    const result = await sendDealNotification(
      process.env.OWNER_EMAIL || fromEmail,
      testDeals,
      175000
    );

    expect(result).toBe(true);
  }, 30000); // 30 second timeout for API call
});
