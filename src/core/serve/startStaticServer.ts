import http from "node:http";
import path from "node:path";
import fs from "fs-extra";

import { createServeError } from "../../shared/errors.js";

interface SseHooks {
  onSseConnect: (response: http.ServerResponse) => { connectionId: string; onClose?: () => void };
  onSseDisconnect: (connectionId: string) => void;
}

interface StartStaticServerInput {
  outputDir: string;
  port: number;
  host?: string;
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

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url?.startsWith("/events")) {
        if (!input.sseHooks) {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(": connected\n\n");

        const connection = input.sseHooks.onSseConnect(res);
        req.on("close", () => {
          input.sseHooks?.onSseDisconnect(connection.connectionId);
          connection.onClose?.();
        });
        return;
      }

      const requested = req.url?.split("?")[0] ?? "/";
      const safePath = decodeURIComponent(requested);
      const normalized = safePath === "/" ? "/index.html" : safePath;
      const target = path.resolve(input.outputDir, `.${normalized}`);
      const relative = path.relative(input.outputDir, target);

      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      if (!(await fs.pathExists(target))) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }

      res.setHeader("Content-Type", toContentType(target));
      const content = await fs.readFile(target);
      res.statusCode = 200;
      res.end(content);
    } catch {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
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
