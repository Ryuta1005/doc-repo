import fs from "fs-extra";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { createHttpError, type HttpError } from "./errors/httpErrorTypes.js";
import { mapToHttpError } from "./errors/httpErrorMapper.js";
import { handleDocumentsDetailRoute } from "./routes/documentsDetailRoute.js";
import { handleDocumentsListRoute } from "./routes/documentsListRoute.js";
import { registerRoutes } from "./routes/index.js";
import { handleDocumentSaveRoute } from "./routes/documentSaveRoute.js";
import { handleDocumentCreateRoute } from "./routes/documentCreateRoute.js";
import { handleDocumentImageUploadRoute } from "./routes/documentImageUploadRoute.js";
import { startStaticServer } from "./server/startStaticServer.js";
import type { SseWritableConnection } from "./sse/sseConnectionRegistry.js";
import { validateDocumentPathQuery } from "./validation/documentRequestValidator.js";

const execFileAsync = promisify(execFile);

interface SseHooks {
  onSseConnect: (response: SseWritableConnection) => { connectionId: string; onClose?: () => void };
  onSseDisconnect: (connectionId: string) => void;
}

export interface CreateServerInput {
  port: number;
  siteName?: string;
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  host?: string;
  sseHooks?: SseHooks;
}

export interface CreateServerResult {
  url: string;
  close: () => Promise<void>;
}

export interface HttpBoundaryPipelineInput {
  rootDir: string;
  siteName?: string;
  scopeDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface HttpBoundaryPipeline {
  readonly routes: ReturnType<typeof registerRoutes>;
  getSiteConfig: () => Promise<unknown>;
  listDocuments: () => Promise<unknown>;
  getDocument: (rawPathQuery: string | null) => Promise<unknown>;
  saveDocument: (payload: unknown) => Promise<unknown>;
  createDocument: (payload: unknown) => Promise<unknown>;
  uploadDocumentImage: (formData: FormData) => Promise<unknown>;
}

export const resolvePackageRoot = (): string => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const resolveViewerDistDir = (packageRoot: string): string => path.join(packageRoot, "dist/viewer");

export const resolveViewerStaticAssetOverrides = async (
  viewerDistDir: string,
): Promise<Record<string, string> | undefined> => {
  const viewerBundlePath = path.join(viewerDistDir, "app.js");
  const viewerAssetsPath = path.join(viewerDistDir, "assets");

  if (!(await fs.pathExists(viewerBundlePath))) {
    return undefined;
  }

  const overrides: Record<string, string> = {
    "/app.js": viewerBundlePath,
  };

  if (await fs.pathExists(viewerAssetsPath)) {
    const assetFiles = await fs.readdir(viewerAssetsPath);
    const styleFile = assetFiles.filter((file) => file.endsWith(".css")).sort()[0];
    if (styleFile) {
      overrides["/styles.css"] = path.join(viewerAssetsPath, styleFile);
    }
  }

  return overrides;
};

const buildViewerBundleIfPossible = async (packageRoot: string): Promise<void> => {
  const viewerEntryPath = path.join(packageRoot, "src/viewer/main.tsx");
  if (!(await fs.pathExists(viewerEntryPath))) {
    throw new Error("React Viewer bundle was not found. Check the package build output.");
  }

  try {
    await execFileAsync("npm", ["run", "build:viewer"], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build React Viewer bundle: ${detail}`);
  }
};

export const ensureViewerStaticAssetOverrides = async (packageRoot: string): Promise<Record<string, string>> => {
  const viewerDistDir = resolveViewerDistDir(packageRoot);
  const existing = await resolveViewerStaticAssetOverrides(viewerDistDir);
  if (existing) {
    return existing;
  }

  await buildViewerBundleIfPossible(packageRoot);
  const built = await resolveViewerStaticAssetOverrides(viewerDistDir);
  if (!built) {
    throw new Error("dist/viewer/app.js was not found after building the React Viewer bundle.");
  }

  return built;
};

const toHttpError = (error: unknown): HttpError => {
  if (typeof error === "object" && error !== null && "status" in error && "code" in error && "message" in error) {
    return error as HttpError;
  }

  return mapToHttpError(error);
};

export const createHttpBoundaryPipeline = (input: HttpBoundaryPipelineInput): HttpBoundaryPipeline => {
  return {
    routes: registerRoutes(),
    getSiteConfig: async () => ({
      name: input.siteName ?? "Doc Repo",
    }),
    listDocuments: async () => {
      try {
        return await handleDocumentsListRoute({
          rootDir: input.rootDir,
          scopeDir: input.scopeDir,
          includePatterns: input.includePatterns,
          excludePatterns: input.excludePatterns,
        });
      } catch (error) {
        throw toHttpError(error);
      }
    },
    getDocument: async (rawPathQuery: string | null) => {
      const validated = validateDocumentPathQuery(rawPathQuery);
      if (!validated.ok) {
        throw createHttpError(400, "INVALID_REQUEST", validated.reason);
      }

      try {
        return await handleDocumentsDetailRoute({
          rootDir: input.rootDir,
          identifier: validated.identifier,
        });
      } catch (error) {
        throw toHttpError(error);
      }
    },
    saveDocument: async (payload: unknown) => {
      try {
        return await handleDocumentSaveRoute({
          rootDir: input.rootDir,
          includePatterns: input.includePatterns,
          excludePatterns: input.excludePatterns,
          payload,
        });
      } catch (error) {
        throw toHttpError(error);
      }
    },
    createDocument: async (payload: unknown) => {
      try {
        return await handleDocumentCreateRoute({
          rootDir: input.rootDir,
          includePatterns: input.includePatterns,
          excludePatterns: input.excludePatterns,
          payload,
        });
      } catch (error) {
        throw toHttpError(error);
      }
    },
    uploadDocumentImage: async (formData: FormData) => {
      try {
        return await handleDocumentImageUploadRoute({
          rootDir: input.rootDir,
          formData,
        });
      } catch (error) {
        throw toHttpError(error);
      }
    },
  };
};

// HTTP route/validation/error mapping is split into presentation modules,
// and the runtime adapter delegates static serving to existing infrastructure.
export const createServer = async (input: CreateServerInput): Promise<CreateServerResult> => {
  const staticAssetOverrides = await ensureViewerStaticAssetOverrides(resolvePackageRoot());
  const pipeline = createHttpBoundaryPipeline({
    rootDir: input.rootDir,
    siteName: input.siteName,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  return await startStaticServer({
    outputDir: input.rootDir,
    port: input.port,
    host: input.host,
    staticAssetOverrides,
    apiHooks: {
      onGetSiteConfig: async () => await pipeline.getSiteConfig(),
      onListDocuments: async () => await pipeline.listDocuments(),
      onGetDocument: async (rawPathQuery) => await pipeline.getDocument(rawPathQuery),
      onSaveDocument: async (payload) => await pipeline.saveDocument(payload),
      onCreateDocument: async (payload) => await pipeline.createDocument(payload),
      onUploadDocumentImage: async (formData) => await pipeline.uploadDocumentImage(formData),
    },
    sseHooks: input.sseHooks,
  });
};
