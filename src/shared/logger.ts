export type LogLevel = "info" | "error";

export interface Logger {
  log: (level: LogLevel, message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

export const WATCH_STATUS_CODES = {
  WATCH_STARTED: "WATCH_STARTED",
  CHANGE_DETECTED: "CHANGE_DETECTED",
  REGEN_STARTED: "REGEN_STARTED",
  REGEN_PENDING: "REGEN_PENDING",
  REGEN_SUCCEEDED: "REGEN_SUCCEEDED",
  REGEN_FAILED: "REGEN_FAILED",
  SHUTDOWN_STARTED: "SHUTDOWN_STARTED",
  SHUTDOWN_COMPLETED: "SHUTDOWN_COMPLETED",
} as const;

export const createLogger = (): Logger => {
  const log = (level: LogLevel, message: string): void => {
    const prefix = `[doc-repo:${level}]`;
    const line = `${prefix} ${message}`;

    if (level === "error") {
      console.error(line);
      return;
    }

    console.log(line);
  };

  return {
    log,
    info: (message: string) => log("info", message),
    error: (message: string) => log("error", message),
  };
};
