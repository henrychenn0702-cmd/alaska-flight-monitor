import { runMonitoring } from "./monitorService";

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Start the monitoring scheduler
 * Runs every 15 minutes
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log("[Scheduler] Already running");
    return;
  }

  console.log("[Scheduler] Starting monitoring scheduler (every 15 minutes)");

  // Run immediately on start
  runMonitoring().catch((error) => {
    console.error("[Scheduler] Initial monitoring failed:", error);
  });

  // Then run every 15 minutes (900000 ms)
  schedulerInterval = setInterval(() => {
    runMonitoring().catch((error) => {
      console.error("[Scheduler] Scheduled monitoring failed:", error);
    });
  }, 15 * 60 * 1000);
}

/**
 * Stop the monitoring scheduler
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped monitoring scheduler");
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
