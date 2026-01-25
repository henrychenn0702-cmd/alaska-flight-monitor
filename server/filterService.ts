import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { filterSettings } from "../drizzle/schema";
import type { InsertFilterSetting } from "../drizzle/schema";

/**
 * Get all active filter settings
 */
export async function getActiveFilters() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(filterSettings)
      .where(eq(filterSettings.active, 1));
  } catch (error) {
    console.error("[FilterService] Failed to get active filters:", error);
    return [];
  }
}

/**
 * Get all filter settings (including inactive)
 */
export async function getAllFilters() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(filterSettings);
  } catch (error) {
    console.error("[FilterService] Failed to get all filters:", error);
    return [];
  }
}

/**
 * Create a new filter setting
 */
export async function createFilter(
  targetMiles: number,
  description?: string
): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Check if filter already exists
    const existing = await db
      .select()
      .from(filterSettings)
      .where(eq(filterSettings.targetMiles, targetMiles));

    if (existing.length > 0) {
      return { success: false, error: "此價格篩選器已存在" };
    }

    const result = await db.insert(filterSettings).values({
      targetMiles,
      description: description || null,
      active: 1,
    });

    return {
      success: true,
      id: (result as any).insertId,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[FilterService] Failed to create filter:", error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Update a filter setting
 */
export async function updateFilter(
  id: number,
  updates: Partial<Omit<InsertFilterSetting, "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    await db
      .update(filterSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(filterSettings.id, id));

    return { success: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[FilterService] Failed to update filter:", error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a filter setting
 */
export async function deleteFilter(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    await db.delete(filterSettings).where(eq(filterSettings.id, id));
    return { success: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[FilterService] Failed to delete filter:", error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Toggle filter active status
 */
export async function toggleFilter(id: number): Promise<{
  success: boolean;
  active?: number;
  error?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Get current filter
    const filter = await db
      .select()
      .from(filterSettings)
      .where(eq(filterSettings.id, id));

    if (filter.length === 0) {
      return { success: false, error: "篩選器不存在" };
    }

    const newActive = filter[0].active === 1 ? 0 : 1;

    await db
      .update(filterSettings)
      .set({
        active: newActive,
        updatedAt: new Date(),
      })
      .where(eq(filterSettings.id, id));

    return { success: true, active: newActive };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[FilterService] Failed to toggle filter:", error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Check if a price matches any active filter
 */
export async function isPriceMatchingFilter(miles: number): Promise<boolean> {
  const activeFilters = await getActiveFilters();
  return activeFilters.some((filter) => filter.targetMiles === miles);
}

/**
 * Get all matching prices for active filters
 */
export async function getMatchingFilters(miles: number) {
  const activeFilters = await getActiveFilters();
  return activeFilters.filter((filter) => filter.targetMiles === miles);
}
