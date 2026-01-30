import { runMonitoring } from "./monitorService";

let schedulerInterval: NodeJS.Timeout | null = null;
let watchdogInterval: NodeJS.Timeout | null = null;
let lastExecutionTime: number = 0;
let executionCount: number = 0;
let restartCount: number = 0;

// Watchdog configuration
const WATCHDOG_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const SCHEDULER_TIMEOUT = 20 * 60 * 1000; // If no execution for 20 minutes, restart

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
  
  // Start watchdog to monitor scheduler health
  startWatchdog();
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
  
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
    console.log("[Scheduler] Stopped watchdog");
  }
}

/**
 * Start watchdog to monitor scheduler health
 * If scheduler hasn't executed in SCHEDULER_TIMEOUT, restart it
 */
function startWatchdog() {
  if (watchdogInterval) {
    console.log("[Scheduler Watchdog] Already running");
    return;
  }

  console.log("[Scheduler Watchdog] Starting watchdog (checks every 5 minutes)");

  watchdogInterval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTime;

    console.log(
      `[Scheduler Watchdog] Health check: last execution ${Math.round(timeSinceLastExecution / 1000)}s ago`
    );

    // If scheduler hasn't executed in SCHEDULER_TIMEOUT, restart it
    if (timeSinceLastExecution > SCHEDULER_TIMEOUT) {
      console.warn(
        `[Scheduler Watchdog] Scheduler appears dead (no execution for ${Math.round(
          timeSinceLastExecution / 1000
        )}s). Restarting...`
      );

      // Stop and restart scheduler
      stopScheduler();
      restartCount++;
      console.log(`[Scheduler Watchdog] Restart #${restartCount}`);
      
      // Restart scheduler
      startScheduler();
    }
  }, WATCHDOG_INTERVAL);
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
  const now = Date.now();
  const timeSinceLastExecution = lastExecutionTime ? now - lastExecutionTime : 0;

  return {
    isRunning: schedulerInterval !== null,
    lastExecutionTime,
    executionCount,
    restartCount,
    lastExecutionTimeFormatted: lastExecutionTime ? new Date(lastExecutionTime).toISOString() : null,
    timeSinceLastExecutionMs: timeSinceLastExecution,
    timeSinceLastExecutionSeconds: Math.round(timeSinceLastExecution / 1000),
    watchdogRunning: watchdogInterval !== null,
  };
}
