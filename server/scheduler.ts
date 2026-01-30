import { runMonitoring } from "./monitorService";

let schedulerInterval: NodeJS.Timeout | null = null;
let lastExecutionTime: number = 0;
let executionCount: number = 0;

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
  const executeMonitoring = async () => {
    const now = Date.now();
    executionCount++;
    lastExecutionTime = now;
    console.log(`[Scheduler] Execution #${executionCount} at ${new Date(now).toISOString()}`);
    
    try {
      await runMonitoring();
    } catch (error) {
      console.error("[Scheduler] Monitoring failed:", error);
    }
  };

  executeMonitoring();

  // Then run every 15 minutes (900000 ms)
  schedulerInterval = setInterval(executeMonitoring, 15 * 60 * 1000);
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

/**
 * Get scheduler health status
 */
export function getSchedulerStatus() {
  return {
    isRunning: schedulerInterval !== null,
    lastExecutionTime,
    executionCount,
    lastExecutionTimeFormatted: lastExecutionTime ? new Date(lastExecutionTime).toISOString() : null,
  };
}
