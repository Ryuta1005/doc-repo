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

export type SaveNewlineStyle = "lf" | "crlf";

export interface SaveRequestOptions {
  newlineStyle: SaveNewlineStyle;
  hasTrailingNewline: boolean;
}

export interface SaveRequest {
  identifier: string;
  originalIdentifier?: string;
  markdownContent: string;
  options: SaveRequestOptions;
  proceed?: boolean;
}

export interface SaveWarning {
  code: "UNSUPPORTED_SEGMENT_DETECTED";
  message: string;
}

export interface SaveSuccessResponse {
  status: "saved";
  savedDocument: {
    identifier: string;
  };
  warnings: SaveWarning[];
}

export interface SaveWarningResponse {
  status: "warning";
  warnings: SaveWarning[];
  allowProceed: true;
}

export type SaveFailureCategory = "invalid-target" | "unwritable-target" | "transient-io";

export interface SaveFailureResponse {
  status: "failed";
  error: {
    category: SaveFailureCategory;
    code: string;
    message: string;
    retryable: boolean;
  };
}

export type SaveResponse = SaveSuccessResponse | SaveWarningResponse | SaveFailureResponse;

export interface SaveValidationResult {
  isValidTarget: boolean;
  reasons: string[];
  warningMessages: string[];
}

export interface SaveResult {
  status: "saved" | "failed";
  failureCategory: SaveFailureCategory | null;
  message: string;
  retryable: boolean;
}

export type CreateAnchorNodeType = "file" | "folder";

export interface CreateDocumentAnchor {
  nodeType: CreateAnchorNodeType;
  nodePath: string;
}

export interface CreateDocumentRequest {
  anchor: CreateDocumentAnchor;
  filename: string;
}

export type CreateFailureCode =
  | "INVALID_INPUT"
  | "OUT_OF_SCOPE"
  | "ALREADY_EXISTS"
  | "UNWRITABLE_TARGET"
  | "TRANSIENT_IO";

export type CreateFailureReason =
  | "filename:required"
  | "filename:path-segment"
  | "filename:path-separator"
  | "filename:empty-display-name"
  | "filename:invalid"
  | "target:out-of-scope"
  | "target:already-exists"
  | "target:unavailable"
  | "target:temporary-failure";

export interface CreateDocumentSuccessResponse {
  status: "created";
  document: {
    identifier: string;
    displayName: string;
  };
}

export interface CreateDocumentFailureResponse {
  status: "rejected";
  error: {
    code: CreateFailureCode;
    reason: CreateFailureReason;
    message: string;
    retryable: boolean;
  };
}

export type CreateDocumentResponse = CreateDocumentSuccessResponse | CreateDocumentFailureResponse;
