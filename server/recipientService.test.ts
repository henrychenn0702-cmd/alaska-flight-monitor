import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock database first before importing
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

import * as recipientService from "./recipientService";

describe("recipientService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveRecipients", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await recipientService.getActiveRecipients();
      expect(result).toEqual([]);
    });
  });

  describe("getAllRecipients", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await recipientService.getAllRecipients();
      expect(result).toEqual([]);
    });
  });

  describe("addRecipient", () => {
    it("should return error when database is unavailable", async () => {
      const result = await recipientService.addRecipient("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });

    it("should validate email format", async () => {
      const result = await recipientService.addRecipient("invalid-email");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("removeRecipient", () => {
    it("should return error when database is unavailable", async () => {
      const result = await recipientService.removeRecipient(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });

  describe("updateRecipient", () => {
    it("should return error when database is unavailable", async () => {
      const result = await recipientService.updateRecipient(1, { name: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });

  describe("toggleRecipient", () => {
    it("should return error when database is unavailable", async () => {
      const result = await recipientService.toggleRecipient(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });
});
