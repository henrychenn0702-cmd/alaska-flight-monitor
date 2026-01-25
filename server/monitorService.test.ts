import { describe, expect, it, vi, beforeEach } from "vitest";
import * as monitorService from "./monitorService";

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

describe("monitorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchFlightPrices", () => {
    it("should parse flight prices from HTML correctly", async () => {
      const axios = await import("axios");
      const mockHtml = `
        <html>
          <body>
            <button role="gridcell" aria-label="Feb 1, 2026. Fare: 175k + $19">1 175k + $19</button>
            <button role="gridcell" aria-label="Feb 2, 2026. Fare: 75k + $19">2 75k + $19</button>
            <button role="gridcell" aria-label="Feb 3, 2026. Fare: 250k + $24">3 250k + $24</button>
          </body>
        </html>
      `;

      vi.mocked(axios.default.get).mockResolvedValue({ data: mockHtml });

      const prices = await monitorService.fetchFlightPrices();

      expect(prices).toHaveLength(3);
      expect(prices[0]).toEqual({
        date: "2026-02-01",
        miles: 175000,
        fees: 19,
      });
      expect(prices[1]).toEqual({
        date: "2026-02-02",
        miles: 75000,
        fees: 19,
      });
      expect(prices[2]).toEqual({
        date: "2026-02-03",
        miles: 250000,
        fees: 24,
      });
    });

    it("should handle empty response", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockResolvedValue({ data: "<html></html>" });

      const prices = await monitorService.fetchFlightPrices();

      expect(prices).toHaveLength(0);
    });

    it("should throw error on network failure", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockRejectedValue(new Error("Network error"));

      await expect(monitorService.fetchFlightPrices()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("checkForDeals", () => {
    it("should detect 75k deals", async () => {
      const prices = [
        { date: "2026-02-01", miles: 175000, fees: 19 },
        { date: "2026-02-02", miles: 75000, fees: 19 },
        { date: "2026-02-03", miles: 75000, fees: 19 },
      ];

      const result = await monitorService.checkForDeals(prices);

      expect(result.found).toBe(true);
      expect(result.dates).toHaveLength(2);
      expect(result.dates).toContain("2026-02-02");
      expect(result.dates).toContain("2026-02-03");
    });

    it("should return empty when no deals found", async () => {
      const prices = [
        { date: "2026-02-01", miles: 175000, fees: 19 },
        { date: "2026-02-02", miles: 250000, fees: 24 },
      ];

      const result = await monitorService.checkForDeals(prices);

      expect(result.found).toBe(false);
      expect(result.dates).toHaveLength(0);
    });

    it("should call notifyOwner when deals are found", async () => {
      const { notifyOwner } = await import("./_core/notification");
      const prices = [{ date: "2026-02-02", miles: 75000, fees: 19 }];

      await monitorService.checkForDeals(prices);

      expect(notifyOwner).toHaveBeenCalledWith({
        title: "🎉 75k 特價里程票發現!",
        content: expect.stringContaining("2026-02-02"),
      });
    });
  });

  describe("runMonitoring", () => {
    it("should return success result when monitoring completes", async () => {
      const axios = await import("axios");
      const mockHtml = `
        <html>
          <body>
            <button role="gridcell" aria-label="Feb 1, 2026. Fare: 175k + $19">1 175k + $19</button>
          </body>
        </html>
      `;

      vi.mocked(axios.default.get).mockResolvedValue({ data: mockHtml });

      const result = await monitorService.runMonitoring();

      expect(result.success).toBe(true);
      expect(result.datesChecked).toBe(1);
      expect(result.dealsFound).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      const axios = await import("axios");
      vi.mocked(axios.default.get).mockRejectedValue(new Error("Test error"));

      const result = await monitorService.runMonitoring();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
    });
  });
});
