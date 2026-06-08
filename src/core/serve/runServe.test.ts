import { describe, expect, it, vi } from "vitest";

import type { GenerationResult } from "../../shared/types.js";

describe("runServe.ts", () => {
  it("generate -> start-server -> start-watch の順で実行されること。", async () => {
    const callOrder: string[] = [];
    const generate = vi.fn(async (): Promise<GenerationResult> => {
      callOrder.push("generate");
      return {
        status: "success",
        exitCode: 0,
        outputDir: "/repo/.doc-repo",
        targetPath: "/repo",
        markdownFileCount: 1,
        message: "ok",
        warnings: [],
      };
    });

    const startServer = vi.fn(async () => {
      callOrder.push("start-server");
      return {
        url: "http://localhost:4000",
        close: async () => undefined,
      };
    });

    const startWatch = vi.fn(async () => {
      callOrder.push("start-watch");
    });

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      generate,
      startServer,
      startWatch,
      port: 4000,
    });

    expect(callOrder).toEqual(["generate", "start-server", "start-watch"]);
    expect(session.status).toBe("watching");
    expect(session.publicUrl).toBe("http://localhost:4000");
  });

  it("初回生成に失敗した場合、start-server を呼ばずに failed になること。", async () => {
    const generate = vi.fn(
      async (): Promise<GenerationResult> => ({
        status: "failure",
        exitCode: 1,
        outputDir: "/repo/.doc-repo",
        targetPath: "/repo",
        markdownFileCount: 0,
        message: "ng",
        warnings: [],
        errorReason: "x",
        hint: "y",
      }),
    );
    const startServer = vi.fn();
    const startWatch = vi.fn();

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      generate,
      startServer,
      startWatch,
      port: 4000,
    });

    expect(startServer).not.toHaveBeenCalled();
    expect(startWatch).not.toHaveBeenCalled();
    expect(session.status).toBe("failed");
    expect(session.exitCode).toBe(1);
  });

  it("port 未指定時は default=4000 で起動すること。", async () => {
    const generate = vi.fn(
      async (): Promise<GenerationResult> => ({
        status: "success",
        exitCode: 0,
        outputDir: "/repo/.doc-repo",
        targetPath: "/repo",
        markdownFileCount: 1,
        message: "ok",
        warnings: [],
      }),
    );
    const startServer = vi.fn(async (input: { outputDir: string; port: number }) => ({
      url: `http://localhost:${input.port}`,
      close: async () => undefined,
    }));

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      generate,
      startServer,
      startWatch: async () => undefined,
      outputDir: "/repo/.doc-repo",
    });

    expect(startServer).toHaveBeenCalledWith({ outputDir: "/repo/.doc-repo", port: 4000 });
    expect(session.publicUrl).toBe("http://localhost:4000");
  });

  it("SIGINT/SIGTERM で close が呼ばれ、stopped に遷移すること。", async () => {
    const generate = vi.fn(
      async (): Promise<GenerationResult> => ({
        status: "success",
        exitCode: 0,
        outputDir: "/repo/.doc-repo",
        targetPath: "/repo",
        markdownFileCount: 1,
        message: "ok",
        warnings: [],
      }),
    );
    const close = vi.fn(async () => undefined);
    const startServer = vi.fn(async () => ({
      url: "http://localhost:4000",
      close,
    }));

    const handlers = new Map<string, () => void | Promise<void>>();

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      generate,
      startServer,
      startWatch: async () => undefined,
      outputDir: "/repo/.doc-repo",
      registerSignalHandler: (signal, handler) => {
        handlers.set(signal, handler);
      },
    });

    const sigint = handlers.get("SIGINT");
    expect(sigint).toBeDefined();
    await sigint?.();
    await new Promise((resolve) => setImmediate(resolve));

    expect(close).toHaveBeenCalledTimes(1);
    expect(session.status).toBe("stopped");
  });
});
