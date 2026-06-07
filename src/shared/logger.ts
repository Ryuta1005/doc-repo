export type LogLevel = "info" | "error";

export interface Logger {
  log: (level: LogLevel, message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

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
