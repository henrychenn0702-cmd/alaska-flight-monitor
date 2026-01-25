import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { emailRecipients } from "../drizzle/schema";
import type { InsertEmailRecipient } from "../drizzle/schema";

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get all active email recipients
 */
export async function getActiveRecipients(): Promise<string[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[RecipientService] Database not available");
    return [];
  }

  try {
    const recipients = await db
      .select()
      .from(emailRecipients)
      .where(eq(emailRecipients.active, 1));

    return recipients.map((r) => r.email);
  } catch (error) {
    console.error("[RecipientService] Failed to get active recipients:", error);
    return [];
  }
}

/**
 * Get all email recipients with details
 */
export async function getAllRecipients() {
  const db = await getDb();
  if (!db) {
    console.warn("[RecipientService] Database not available");
    return [];
  }

  try {
    const recipients = await db.select().from(emailRecipients);
    return recipients;
  } catch (error) {
    console.error("[RecipientService] Failed to get all recipients:", error);
    return [];
  }
}

/**
 * Add a new email recipient
 */
export async function addRecipient(
  email: string,
  name?: string
): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  // Validate email
  if (!isValidEmail(email)) {
    return { success: false, error: "Invalid email format" };
  }

  try {
    // Check if email already exists
    const existing = await db
      .select()
      .from(emailRecipients)
      .where(eq(emailRecipients.email, email));

    if (existing.length > 0) {
      return { success: false, error: "Email already exists" };
    }

    // Insert new recipient
    await db.insert(emailRecipients).values({
      email,
      name: name || null,
      active: 1,
    } as InsertEmailRecipient);

    console.log(`[RecipientService] Added new recipient: ${email}`);

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[RecipientService] Failed to add recipient:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove an email recipient
 */
export async function removeRecipient(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    await db.delete(emailRecipients).where(eq(emailRecipients.id, id));

    console.log(`[RecipientService] Removed recipient with id: ${id}`);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[RecipientService] Failed to remove recipient:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update recipient name or active status
 */
export async function updateRecipient(
  id: number,
  updates: { name?: string | null; active?: number }
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.active !== undefined) {
      updateData.active = updates.active;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true };
    }

    await db
      .update(emailRecipients)
      .set(updateData)
      .where(eq(emailRecipients.id, id));

    console.log(`[RecipientService] Updated recipient with id: ${id}`);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[RecipientService] Failed to update recipient:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Toggle recipient active status
 */
export async function toggleRecipient(
  id: number
): Promise<{ success: boolean; active?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Get current recipient
    const recipient = await db
      .select()
      .from(emailRecipients)
      .where(eq(emailRecipients.id, id));

    if (recipient.length === 0) {
      return { success: false, error: "Recipient not found" };
    }

    const newActive = recipient[0].active === 1 ? 0 : 1;

    await db
      .update(emailRecipients)
      .set({ active: newActive })
      .where(eq(emailRecipients.id, id));

    console.log(
      `[RecipientService] Toggled recipient ${id} to active=${newActive}`
    );

    return { success: true, active: newActive };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[RecipientService] Failed to toggle recipient:", error);
    return { success: false, error: errorMessage };
  }
}
