export type ExecutionStatus = "success" | "failure";

export interface MarkdownFile {
  absolutePath: string;
  relativePath: string;
}

export interface SitePage {
  id: string;
  title: string;
  relativePath: string;
  html: string;
}

export interface TreeDirNode {
  type: "dir";
  name: string;
  children: TreeNode[];
}

export interface TreeFileNode {
  type: "file";
  name: string;
  id: string;
}

export type TreeNode = TreeDirNode | TreeFileNode;

// T005: 参照画像メタデータ型
// Markdown から参照された画像ファイルのメタデータ。
// リポジトリ相対パスで一意に特定され、実在ファイルの確認後に `.doc-repo/assets/` へコピーされる。
export interface ReferencedImage {
  /** リポジトリ相対パス。例: "docs/assets/screenshot.png" */
  repoRelativePath: string;
  /** 生成時の絶対パス（ファイル実在確認用）。null は未検証状態を示す。 */
  absolutePath?: string;
}

export interface ViewerAssets {
  styleFile: string;
  scriptFile: string;
}

export interface SiteBundle {
  pages: SitePage[];
  tree: TreeNode[];
  viewerAssets: ViewerAssets;
  siteName: string;
  // T005: 参照画像一覧（リポジトリ相対パスで重複排除）
  referencedImages: ReferencedImage[];
}

export interface RootDetectionResult {
  detectedRoot: string;
  usedFallback: boolean;
}

export interface GenerationContext {
  cwd: string;
  scopePath?: string;
  /** サイドバー上部などに表示するサイト名。 */
  siteName?: string;
  /** 設定ファイルから解決済みの設定。指定された場合、cwd ベースの自動検出より優先される。 */
  resolvedRootDir?: string;
  /** 設定ファイルから解決済みの include パターン。 */
  includePatterns?: string[];
  /** 設定ファイルから解決済みの exclude パターン。 */
  excludePatterns?: string[];
}

export interface GenerationResult {
  status: ExecutionStatus;
  exitCode: number;
  outputDir: string;
  targetPath: string;
  markdownFileCount: number;
  message: string;
  warnings: string[];
  errorReason?: string;
  hint?: string;
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
  outputDir: string;
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
  outputDir: string;
  includePatterns: string[];
  excludePatterns: string[];
}

export type ServeStep = "initial-generate" | "start-server" | "start-watch";

export interface ServeStepResult {
  step: ServeStep;
  status: "success" | "failure" | "skipped";
  message: string;
  durationMs: number;
}

export type ServeFailureType =
  | "invalid-port"
  | "port-conflict"
  | "initial-generate-failed"
  | "missing-output"
  | "unknown";

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
