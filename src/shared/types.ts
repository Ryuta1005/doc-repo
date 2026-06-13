export interface MarkdownFile {
  absolutePath: string;
  relativePath: string;
}

export interface RootDetectionResult {
  detectedRoot: string;
  usedFallback: boolean;
}

export interface InitResult {
  status: "created" | "already-exists" | "failure";
  configPath: string;
  errorReason?: string;
}

export type ServePortSource = "cli" | "config" | "default";

export type RootSource = "config-rootDir" | "config-directory" | "git-root" | "cwd-fallback";

export interface ResolvedConfig {
  siteName: string;
  rootDir: string;
  includePatterns: string[];
  excludePatterns: string[];
  port: number;
  portSource: ServePortSource;
  rootSource: RootSource;
  configPath: string | null;
}

export interface ServeConfiguration {
  siteName: string;
  port: number;
  portSource: ServePortSource;
  rootDir: string;
  includePatterns: string[];
  excludePatterns: string[];
}

export type ServeStep = "start-server" | "start-watch";

export interface ServeStepResult {
  step: ServeStep;
  status: "success" | "failure" | "skipped";
  message: string;
  durationMs: number;
}

export type ServeFailureType = "invalid-port" | "port-conflict" | "unknown";

export interface ServeFailure {
  type: ServeFailureType;
  message: string;
  field?: string;
  hint?: string;
  exitCode: 1;
}

export interface ServeSession {
  status: "initializing" | "generating" | "serving" | "watching" | "stopped" | "failed";
  publicUrl?: string;
  exitCode: number;
  steps: ServeStepResult[];
  failures: ServeFailure[];
}

export type WatchEventType = "add" | "change" | "unlink";

export interface WatchEvent {
  eventType: WatchEventType;
  absolutePath: string;
  notificationPath: string;
}

export interface WatchHandle {
  close: () => Promise<void>;
}

export interface SseReloadPayload {
  type: "reload";
  reason: "regenerate-succeeded";
  occurredAt: string;
}
