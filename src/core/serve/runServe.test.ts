import { describe, expect, it, vi } from "vitest";

describe("runServe.ts", () => {
  it("start-server -> start-watch の順で実行されること。", async () => {
    const callOrder: string[] = [];

    const startServer = vi.fn(async () => {
      callOrder.push("start-server");
      return {
        url: "http://localhost:4000",
        close: async () => undefined,
      };
    });

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      rootDir: "/repo",
      startServer,
      port: 4000,
    });

    expect(callOrder).toEqual(["start-server"]);
    expect(session.status).toBe("watching");
    expect(session.publicUrl).toBe("http://localhost:4000");
    await new Promise((resolve) => setImmediate(resolve));
  });

  it("port 未指定時は default=4000 で起動すること。", async () => {
    const startServer = vi.fn(async (input: { port: number }) => ({
      url: `http://localhost:${input.port}`,
      close: async () => undefined,
    }));

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      rootDir: "/repo",
      startServer,
    });

    expect(startServer).toHaveBeenCalledWith({
      port: 4000,
      rootDir: "/repo",
      includePatterns: undefined,
      excludePatterns: undefined,
    });
    expect(session.publicUrl).toBe("http://localhost:4000");
  });

  it("SIGINT/SIGTERM で close が呼ばれ、stopped に遷移すること。", async () => {
    const close = vi.fn(async () => undefined);
    const startServer = vi.fn(async () => ({
      url: "http://localhost:4000",
      close,
    }));

    const handlers = new Map<string, () => void | Promise<void>>();

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      rootDir: "/repo",
      startServer,
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

  it("start-server 失敗時、guidance を含んだ failed セッションを返すこと。", async () => {
    const startServer = vi.fn(async () => {
      throw new Error("boom");
    });

    const { runServe } = await import("./runServe.js");
    const session = await runServe({
      rootDir: "/repo",
      startServer,
    });

    expect(session.status).toBe("failed");
    expect(session.exitCode).toBe(1);
    expect(session.failures[0]?.type).toBe("unknown");
  });
});
