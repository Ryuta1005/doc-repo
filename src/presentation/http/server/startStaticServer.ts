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
  };
  sseHooks?: SseHooks;
}

interface StartStaticServerResult {
  url: string;
  close: () => Promise<void>;
}

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
    throw createServeError("missing-output", `.doc-repo が見つかりません: ${input.outputDir}`);
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
    const overridePath = input.staticAssetOverrides?.[normalized];

    if (overridePath) {
      if (!(await fs.pathExists(overridePath))) {
        return c.text("Not Found", 404);
      }

      const content = await fs.readFile(overridePath);
      c.header("Content-Type", toContentType(overridePath));
      return c.body(content);
    }

    const target = path.resolve(input.outputDir, `.${normalized}`);
    const relative = path.relative(input.outputDir, target);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return c.text("Forbidden", 403);
    }

    const markdownHtmlTarget = normalized.endsWith(".md")
      ? path.resolve(input.outputDir, `.${normalized.replace(/\.md$/i, ".html")}`)
      : undefined;
    const resolvedTarget =
      (await fs.pathExists(target)) || !markdownHtmlTarget ? target : markdownHtmlTarget;

    if (!(await fs.pathExists(resolvedTarget))) {
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
