import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock database first before importing
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

import * as filterService from "./filterService";

describe("filterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveFilters", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await filterService.getActiveFilters();
      expect(result).toEqual([]);
    });
  });

  describe("getAllFilters", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await filterService.getAllFilters();
      expect(result).toEqual([]);
    });
  });

  describe("createFilter", () => {
    it("should return error when database is unavailable", async () => {
      const result = await filterService.createFilter(75000, "Test");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });

  describe("updateFilter", () => {
    it("should return error when database is unavailable", async () => {
      const result = await filterService.updateFilter(1, { description: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });

  describe("deleteFilter", () => {
    it("should return error when database is unavailable", async () => {
      const result = await filterService.deleteFilter(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });

  describe("toggleFilter", () => {
    it("should return error when database is unavailable", async () => {
      const result = await filterService.toggleFilter(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database not available");
    });
  });

  describe("isPriceMatchingFilter", () => {
    it("should return false when no active filters", async () => {
      const result = await filterService.isPriceMatchingFilter(75000);
      expect(result).toBe(false);
    });
  });

  describe("getMatchingFilters", () => {
    it("should return empty array when no active filters", async () => {
      const result = await filterService.getMatchingFilters(75000);
      expect(result).toEqual([]);
    });
  });
});
