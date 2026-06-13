import { createLogger } from "../../shared/logger.js";
import { createWatchStatusReporter } from "./watchStatusReporter.js";
import type { WatchEvent } from "../../shared/types.js";

interface RefreshCoordinatorInput {
  onRegenerate: () => Promise<{ ok: true } | { ok: false; reason: string }>;
  onReload: () => number;
  debounceMs?: number;
}

export interface RefreshCoordinator {
  notifyChange: (event: WatchEvent) => void;
  drain: () => Promise<void>;
}

export const createRefreshCoordinator = (input: RefreshCoordinatorInput): RefreshCoordinator => {
  const debounceMs = input.debounceMs ?? 300;
  const logger = createLogger();
  const reporter = createWatchStatusReporter(logger);

  let timer: NodeJS.Timeout | undefined;
  let isRunning = false;
  let pending = false;
  let inFlight: Promise<void> | undefined;

  const runOnce = async (): Promise<void> => {
    reporter.regenerateStarted();
    const result = await input.onRegenerate();

    if (result.ok) {
      const reloadCount = input.onReload();
      reporter.regenerateSucceeded(reloadCount);
      return;
    }

    reporter.regenerateFailed(result.reason);
  };

  const kick = (): void => {
    if (isRunning) {
      pending = true;
      reporter.regeneratePending();
      return;
    }

    isRunning = true;
    inFlight = (async () => {
      do {
        pending = false;
        await runOnce();
      } while (pending);
      isRunning = false;
    })();
  };

  return {
    notifyChange: (event) => {
      reporter.changeDetected(event.eventType, event.notificationPath);

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        timer = undefined;
        kick();
      }, debounceMs);
    },
    drain: async () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
        kick();
      }
      await inFlight;
    },
  };
};
