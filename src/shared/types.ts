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

export interface SiteBundle {
  pages: SitePage[];
  tree: TreeNode[];
}

export interface RootDetectionResult {
  detectedRoot: string;
  usedFallback: boolean;
}

export interface GenerationContext {
  cwd: string;
  scopePath?: string;
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
