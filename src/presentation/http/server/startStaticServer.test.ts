import { describe, expect, it } from "vitest";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import fs from "fs-extra";

import { AppError } from "../../../shared/errors.js";
import { createHttpBoundaryPipeline } from "../createServer.js";

const findFreePort = async (): Promise<number> =>
  await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("failed to resolve free port"));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });

const getHttp = async (url: string): Promise<{ status: number; contentType: string; body: string }> =>
  await new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () =>
        resolve({
          status: res.statusCode ?? 0,
          contentType: res.headers["content-type"] ?? "",
          body,
        }),
      );
    });
    req.on("error", reject);
  });

describe("startStaticServer.ts", () => {
  it("close 実行後に同一ポートを再利用できること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-"));
    await fs.outputFile(path.join(tempRoot, "index.html"), "<h1>ok</h1>");

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({ outputDir: tempRoot, port: freePort });
    await started.close();

    await new Promise<void>((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", reject);
      probe.listen(freePort, () => {
        probe.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });

    await fs.remove(tempRoot);
  });

  it("ポート競合時に PORT_CONFLICT を返すこと。", async () => {
    const { mapServerStartError } = await import("./startStaticServer.js");
    const error = new Error("listen EADDRINUSE");
    (error as NodeJS.ErrnoException).code = "EADDRINUSE";

    const mapped = mapServerStartError(error, 4000);

    expect(mapped).toBeInstanceOf(AppError);
    expect((mapped as AppError).code).toBe("PORT_CONFLICT");
  });

  it("/api/documents と /api/document を実 HTTP で JSON 配信すること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-api-success-"));
    await fs.outputFile(path.join(tempRoot, "index.html"), "<h1>ok</h1>");
    await fs.outputFile(path.join(tempRoot, "docs", "a.md"), "# A\n\nbody");

    const freePort = await findFreePort();
    const pipeline = createHttpBoundaryPipeline({ rootDir: tempRoot });
    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({
      outputDir: tempRoot,
      port: freePort,
      apiHooks: {
        onListDocuments: async () => await pipeline.listDocuments(),
        onGetDocument: async (rawPathQuery) => await pipeline.getDocument(rawPathQuery),
        onSaveDocument: async () => ({ status: "saved", savedDocument: { identifier: "docs/a.md" }, warnings: [] }),
      },
    });

    try {
      const list = await getHttp(`http://localhost:${freePort}/api/documents`);
      expect(list).toMatchObject({
        status: 200,
        contentType: "application/json",
      });
      expect(JSON.parse(list.body)).toEqual([
        expect.objectContaining({
          identifier: "docs/a.md",
          title: "a",
        }),
      ]);

      const detail = await getHttp(`http://localhost:${freePort}/api/document?path=docs%2Fa.md`);
      expect(detail).toMatchObject({
        status: 200,
        contentType: "application/json",
      });
      expect(JSON.parse(detail.body)).toMatchObject({
        identifier: "docs/a.md",
        title: "A",
        html: expect.stringContaining("<h1>A</h1>"),
      });
    } finally {
      await started.close();
      await fs.remove(tempRoot);
    }
  });

  it("/api/document の不正 path と存在しない文書を HTTP 400/404 JSON にすること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-api-errors-"));
    await fs.outputFile(path.join(tempRoot, "index.html"), "<h1>ok</h1>");

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const pipeline = createHttpBoundaryPipeline({ rootDir: tempRoot });
    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({
      outputDir: tempRoot,
      port: freePort,
      apiHooks: {
        onListDocuments: async () => await pipeline.listDocuments(),
        onGetDocument: async (rawPathQuery) => await pipeline.getDocument(rawPathQuery),
        onSaveDocument: async () => ({
          status: "saved",
          savedDocument: { identifier: "docs/placeholder.md" },
          warnings: [],
        }),
      },
    });

    const get = async (targetPath: string): Promise<{ status: number; contentType: string; body: string }> =>
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${freePort}${targetPath}`, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () =>
            resolve({
              status: res.statusCode ?? 0,
              contentType: res.headers["content-type"] ?? "",
              body,
            }),
          );
        });
        req.on("error", reject);
      });

    try {
      await expect(get("/api/document?path=")).resolves.toMatchObject({
        status: 400,
        contentType: "application/json; charset=utf-8",
      });
      await expect(get("/api/document?path=..%2FREADME.md")).resolves.toMatchObject({
        status: 400,
        contentType: "application/json; charset=utf-8",
      });
      await expect(get("/api/document?path=not-found.md")).resolves.toMatchObject({
        status: 404,
        contentType: "application/json; charset=utf-8",
      });
    } finally {
      await started.close();
      await fs.remove(tempRoot);
    }
  });

  it("API hook の未知例外を実 HTTP で 500 JSON にすること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-api-unknown-error-"));
    await fs.outputFile(path.join(tempRoot, "index.html"), "<h1>ok</h1>");

    const freePort = await findFreePort();
    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({
      outputDir: tempRoot,
      port: freePort,
      apiHooks: {
        onListDocuments: async () => {
          throw new Error("unexpected failure");
        },
        onGetDocument: async () => {
          throw new Error("unexpected failure");
        },
        onSaveDocument: async () => {
          throw new Error("unexpected failure");
        },
      },
    });

    try {
      const response = await getHttp(`http://localhost:${freePort}/api/documents`);
      expect(response).toMatchObject({
        status: 500,
        contentType: "application/json; charset=utf-8",
      });
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal Server Error",
        },
      });
    } finally {
      await started.close();
      await fs.remove(tempRoot);
    }
  });

  it("/events 接続時に SSE hooks が呼ばれること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-sse-"));
    await fs.outputFile(path.join(tempRoot, "index.html"), "<h1>ok</h1>");

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const { startStaticServer } = await import("./startStaticServer.js");
    let connected = false;
    const started = await startStaticServer({
      outputDir: tempRoot,
      port: freePort,
      sseHooks: {
        onSseConnect: () => {
          connected = true;
          return { connectionId: "test-1" };
        },
        onSseDisconnect: () => undefined,
      },
    });

    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://localhost:${freePort}/events`, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", reject);
    });

    expect(connected).toBe(true);
    await started.close();
    await fs.remove(tempRoot);
  });

  it("staticAssetOverrides が生成済み静的資産より優先して配信されること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-overrides-"));
    const overrideRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-override-assets-"));
    await fs.outputFile(path.join(tempRoot, "app.js"), "console.log('legacy');");
    await fs.outputFile(path.join(tempRoot, "styles.css"), ".legacy{}");
    await fs.outputFile(path.join(overrideRoot, "app.js"), "console.log('viewer');");
    await fs.outputFile(path.join(overrideRoot, "main.css"), ".viewer-layout{}");

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({
      outputDir: tempRoot,
      port: freePort,
      staticAssetOverrides: {
        "/app.js": path.join(overrideRoot, "app.js"),
        "/styles.css": path.join(overrideRoot, "main.css"),
      },
    });

    const getBody = async (targetPath: string): Promise<string> =>
      await new Promise<string>((resolve, reject) => {
        const req = http.get(`http://localhost:${freePort}/${targetPath}`, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => resolve(body));
        });
        req.on("error", reject);
      });

    try {
      await expect(getBody("app.js")).resolves.toContain("viewer");
      await expect(getBody("styles.css")).resolves.toContain("viewer-layout");
      await expect(fs.readFile(path.join(tempRoot, "app.js"), "utf8")).resolves.toContain("legacy");
      await expect(fs.readFile(path.join(tempRoot, "styles.css"), "utf8")).resolves.toContain("legacy");
    } finally {
      await started.close();
      await fs.remove(tempRoot);
      await fs.remove(overrideRoot);
    }
  });

  it("ディレクトリ URL は配下の index.html を配信し、index がない場合は 404 にすること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-directory-"));
    await fs.outputFile(path.join(tempRoot, "docs", "index.html"), "<h1>docs index</h1>");
    await fs.ensureDir(path.join(tempRoot, "empty"));

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({ outputDir: tempRoot, port: freePort });

    const get = async (targetPath: string): Promise<{ status: number; body: string }> =>
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${freePort}/${targetPath}`, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
        });
        req.on("error", reject);
      });

    try {
      await expect(get("docs/")).resolves.toEqual({ status: 200, body: "<h1>docs index</h1>" });
      await expect(get("empty/")).resolves.toMatchObject({ status: 404 });
    } finally {
      await started.close();
      await fs.remove(tempRoot);
    }
  });

  it("Markdown URL のリロード時は viewer index.html を配信すること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-markdown-url-"));
    await fs.outputFile(path.join(tempRoot, "docs", "config.ja.md"), "# config");

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({ outputDir: tempRoot, port: freePort });

    const response = async (targetPath: string): Promise<{ status: number; body: string }> =>
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${freePort}/${targetPath}`, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
        });
        req.on("error", reject);
      });

    try {
      await expect(response("docs/config.ja.md")).resolves.toMatchObject({ status: 200 });
      await expect(response("docs/config.ja.md")).resolves.toMatchObject({
        body: expect.stringContaining('<div id="root"></div>'),
      });
      await expect(response("docs/missing.md")).resolves.toMatchObject({ status: 200 });
    } finally {
      await started.close();
      await fs.remove(tempRoot);
    }
  });

  // T011: 生成サイト経由で参照画像が HTTP 200 になることを確認
  describe("T011: 参照画像の HTTP 200 確認（実装予定）", () => {
    it("生成サイト経由で参照画像が HTTP 200 を返す（T016 統合テストで確認）。", async () => {
      const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-images-"));
      await fs.outputFile(path.join(tempRoot, "docs", "assets", "screenshot.png"), Buffer.from("PNG_BINARY"));

      const freePort = await new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
          const address = server.address();
          if (!address || typeof address === "string") {
            reject(new Error("failed to resolve free port"));
            return;
          }
          const { port } = address;
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(port);
          });
        });
      });

      const { startStaticServer } = await import("./startStaticServer.js");
      const started = await startStaticServer({ outputDir: tempRoot, port: freePort });

      try {
        const statusCode = await new Promise<number>((resolve, reject) => {
          const req = http.get(`http://localhost:${freePort}/assets/docs/assets/screenshot.png`, (res) => {
            const code = res.statusCode ?? 0;
            res.resume();
            res.on("end", () => resolve(code));
          });
          req.on("error", reject);
        });

        expect(statusCode).toBe(200);
      } finally {
        await started.close();
        await fs.remove(tempRoot);
      }
    });
  });
});
