import path from "node:path";
import fs from "fs-extra";
import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import { createServeError } from "../../../shared/errors.js";
import { mapToHttpError, toHttpErrorPayload } from "../errors/httpErrorMapper.js";
import type { SseWritableConnection } from "../sse/sseConnectionRegistry.js";

interface SseHooks {
  onSseConnect: (response: SseWritableConnection) => { connectionId: string; onClose?: () => void };
  onSseDisconnect: (connectionId: string) => void;
}

interface StartStaticServerInput {
  outputDir: string;
  port: number;
  host?: string;
  staticAssetOverrides?: Record<string, string>;
  apiHooks?: {
    onGetSiteConfig?: () => Promise<unknown>;
    onListDocuments: () => Promise<unknown>;
    onGetDocument: (rawPathQuery: string | null) => Promise<unknown>;
    onSaveDocument: (payload: unknown) => Promise<unknown>;
    onUploadDocumentImage: (formData: FormData) => Promise<unknown>;
  };
  sseHooks?: SseHooks;
}

interface StartStaticServerResult {
  url: string;
  close: () => Promise<void>;
}

const viewerIndexHtml = (hasStylesheet: boolean): string => `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Doc Repo</title>
    ${hasStylesheet ? '<link rel="stylesheet" href="/styles.css" />' : ""}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/app.js"></script>
  </body>
</html>`;

const resolveWorkspaceTarget = (
  rootDir: string,
  normalizedPath: string,
): { ok: true; filePath: string } | { ok: false } => {
  const workspaceRelative = normalizedPath.startsWith("/assets/")
    ? normalizedPath.slice("/assets/".length)
    : normalizedPath.slice(1);
  const target = path.resolve(rootDir, workspaceRelative);
  const relative = path.relative(rootDir, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false };
  }

  return { ok: true, filePath: target };
};

const toContentType = (targetPath: string): string => {
  if (targetPath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (targetPath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (targetPath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }
  if (targetPath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "application/octet-stream";
};

const toHttpErrorResponse = (error: unknown): Response => {
  const mapped = mapToHttpError(error);
  return new Response(JSON.stringify(toHttpErrorPayload(mapped.code, mapped.message)), {
    status: mapped.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};

export const mapServerStartError = (error: unknown, port: number): Error => {
  const errno = error as NodeJS.ErrnoException;
  if (errno?.code === "EADDRINUSE") {
    return createServeError("port-conflict", `port ${port} は既に使用されています。`);
  }

  if (error instanceof Error) {
    return error;
  }

  return createServeError("unknown", "サーバー起動中に不明なエラーが発生しました。");
};

export const startStaticServer = async (input: StartStaticServerInput): Promise<StartStaticServerResult> => {
  if (!(await fs.pathExists(input.outputDir))) {
    throw createServeError("unknown", `配信対象ディレクトリが見つかりません: ${input.outputDir}`);
  }

  const host = input.host ?? "localhost";
  const app = new Hono();

  app.onError((error) => toHttpErrorResponse(error));

  app.get("/api/documents", async (c) => {
    if (!input.apiHooks) {
      return c.text("Not Found", 404);
    }

    const payload = await input.apiHooks.onListDocuments();
    return c.json(payload);
  });

  app.get("/api/site-config", async (c) => {
    if (!input.apiHooks?.onGetSiteConfig) {
      return c.text("Not Found", 404);
    }

    const payload = await input.apiHooks.onGetSiteConfig();
    return c.json(payload);
  });

  app.get("/api/document", async (c) => {
    if (!input.apiHooks) {
      return c.text("Not Found", 404);
    }

    const payload = await input.apiHooks.onGetDocument(c.req.query("path") ?? null);
    return c.json(payload);
  });

  app.post("/api/document/save", async (c) => {
    if (!input.apiHooks) {
      return c.text("Not Found", 404);
    }

    const payload = await c.req.json().catch(() => undefined);
    const result = await input.apiHooks.onSaveDocument(payload);
    if (
      typeof result === "object" &&
      result !== null &&
      "status" in result &&
      (result as { status?: string }).status === "failed" &&
      "error" in result
    ) {
      const category = (result as { error?: { category?: string } }).error?.category;
      const status = category === "invalid-target" ? 400 : category === "unwritable-target" ? 404 : 500;
      return c.json(result, status);
    }

    return c.json(result);
  });

  app.post("/api/document/image", async (c) => {
    if (!input.apiHooks) {
      return c.text("Not Found", 404);
    }

    const formData = await c.req.formData().catch(() => undefined);
    if (!formData) {
      return c.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "multipart/form-data is required",
          },
        },
        400,
      );
    }

    const result = await input.apiHooks.onUploadDocumentImage(formData);
    return c.json(result);
  });

  app.get("/events", async (c) => {
    if (!input.sseHooks) {
      return c.text("Not Found", 404);
    }

    return streamSSE(c, async (stream) => {
      let resolveClosed: (() => void) | undefined;
      const closed = new Promise<void>((resolve) => {
        resolveClosed = resolve;
      });

      const closeConnection = (): void => {
        resolveClosed?.();
        resolveClosed = undefined;
      };

      const connection = input.sseHooks?.onSseConnect({
        get writableEnded() {
          return stream.closed;
        },
        get destroyed() {
          return stream.aborted;
        },
        write: (chunk) => {
          void stream.write(chunk);
        },
        end: () => {
          closeConnection();
          if (!stream.closed) {
            void stream.close();
          }
        },
      });

      stream.onAbort(() => {
        if (connection) {
          input.sseHooks?.onSseDisconnect(connection.connectionId);
          connection.onClose?.();
        }
        closeConnection();
      });

      await stream.write(": connected\n\n");
      await closed;
    });
  });

  app.get("*", async (c) => {
    const requested = c.req.path || "/";
    const safePath = decodeURIComponent(requested);
    const normalized = safePath === "/" ? "/index.html" : safePath;
    const isRootIndex = normalized === "/index.html";
    const overridePath = input.staticAssetOverrides?.[normalized];

    if (isRootIndex) {
      const content = viewerIndexHtml(Boolean(input.staticAssetOverrides?.["/styles.css"]));
      c.header("Content-Type", "text/html; charset=utf-8");
      return c.body(content);
    }

    if (overridePath) {
      if (!(await fs.pathExists(overridePath))) {
        return c.text("Not Found", 404);
      }

      const content = await fs.readFile(overridePath);
      c.header("Content-Type", toContentType(overridePath));
      return c.body(content);
    }

    if (normalized.endsWith(".md")) {
      const content = viewerIndexHtml(Boolean(input.staticAssetOverrides?.["/styles.css"]));
      c.header("Content-Type", "text/html; charset=utf-8");
      return c.body(content);
    }

    const resolved = resolveWorkspaceTarget(input.outputDir, normalized);
    if (!resolved.ok) {
      return c.text("Forbidden", 403);
    }

    const resolvedTarget = resolved.filePath;

    if (!(await fs.pathExists(resolvedTarget))) {
      if (path.posix.extname(normalized) === "") {
        const content = viewerIndexHtml(Boolean(input.staticAssetOverrides?.["/styles.css"]));
        c.header("Content-Type", "text/html; charset=utf-8");
        return c.body(content);
      }
      return c.text("Not Found", 404);
    }

    const stat = await fs.stat(resolvedTarget);
    const filePath = stat.isDirectory() ? path.join(resolvedTarget, "index.html") : resolvedTarget;

    if (!(await fs.pathExists(filePath))) {
      return c.text("Not Found", 404);
    }

    const fileStat = await fs.stat(filePath);
    if (!fileStat.isFile()) {
      return c.text("Not Found", 404);
    }

    const content = await fs.readFile(filePath);
    c.header("Content-Type", toContentType(filePath));
    return c.body(content);
  });

  const server = createAdaptorServer({
    fetch: async (request) => {
      try {
        return await app.fetch(request);
      } catch (error) {
        return toHttpErrorResponse(error);
      }
    },
    hostname: host,
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", (error) => reject(mapServerStartError(error, input.port)));
    server.listen(input.port, host, () => {
      server.removeAllListeners("error");
      resolve();
    });
  });

  return {
    url: `http://${host}:${input.port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
};
