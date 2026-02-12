import { getEnv } from "./env";
import { logger } from "./logger";

let _interval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(): void {
  const url = getEnv().BETTERSTACK_HEARTBEAT_URL;
  if (!url) {
    logger.info("No BETTERSTACK_HEARTBEAT_URL set, heartbeat disabled");
    return;
  }

  async function ping() {
    try {
      await fetch(url!, { method: "GET" });
    } catch (err) {
      logger.warn("Heartbeat ping failed", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Ping immediately, then every 60 seconds
  ping();
  _interval = setInterval(ping, 60_000);
  logger.info("Heartbeat started (60s interval)");
}

export function stopHeartbeat(): void {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}
