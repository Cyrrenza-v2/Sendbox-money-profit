import { getHealthSnapshot } from "./healthMonitor.js";

let lastRun = null;
let runCount = 0;

export async function runReconciliation(source = "manual") {
  const startedAt = new Date().toISOString();
  const health = await getHealthSnapshot();
  runCount += 1;
  lastRun = { source, startedAt, completedAt: new Date().toISOString(), status: "COMPLETED", servicesChecked: health.services.length, corrections: 0 };
  return lastRun;
}

export function getReconciliationStatus() {
  return { status: lastRun?.status || "READY", lastRun, runCount, schedule: "every 5 minutes" };
}
