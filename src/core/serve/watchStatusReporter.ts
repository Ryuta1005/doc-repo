import type { Logger } from "../../shared/logger.js";
import { WATCH_STATUS_CODES } from "../../shared/logger.js";

export interface WatchStatusReporter {
  watchStarted: () => void;
  changeDetected: (eventType: string, absolutePath: string) => void;
  regenerateStarted: () => void;
  regeneratePending: () => void;
  regenerateSucceeded: (reloadCount: number) => void;
  regenerateFailed: (reason: string) => void;
  shutdownStarted: () => void;
  shutdownCompleted: () => void;
  shutdownError: (component: string, reason: string) => void;
}

export const createWatchStatusReporter = (logger: Logger): WatchStatusReporter => {
  return {
    watchStarted: () => {
      logger.info(`[${WATCH_STATUS_CODES.WATCH_STARTED}] watch started`);
    },
    changeDetected: (eventType: string, absolutePath: string) => {
      logger.info(`[${WATCH_STATUS_CODES.CHANGE_DETECTED}] type=${eventType} path=${absolutePath}`);
    },
    regenerateStarted: () => {
      logger.info(`[${WATCH_STATUS_CODES.REGEN_STARTED}] regenerate started`);
    },
    regeneratePending: () => {
      logger.info(`[${WATCH_STATUS_CODES.REGEN_PENDING}] pending change queued`);
    },
    regenerateSucceeded: (reloadCount: number) => {
      logger.info(`[${WATCH_STATUS_CODES.REGEN_SUCCEEDED}] regenerate succeeded`);
      logger.info(`[doc-repo] reload: dispatched clients=${reloadCount}`);
    },
    regenerateFailed: (reason: string) => {
      logger.error(`[${WATCH_STATUS_CODES.REGEN_FAILED}] regenerate failed reason=${reason}`);
    },
    shutdownStarted: () => {
      logger.info(`[${WATCH_STATUS_CODES.SHUTDOWN_STARTED}] shutdown started`);
    },
    shutdownCompleted: () => {
      logger.info(`[${WATCH_STATUS_CODES.SHUTDOWN_COMPLETED}] shutdown completed`);
    },
    shutdownError: (component: string, reason: string) => {
      logger.error(`[doc-repo] shutdown: cleanup failed component=${component} reason=${reason}`);
    },
  };
};
