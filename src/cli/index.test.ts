import { beforeEach, describe, expect, it, vi } from "vitest";

const generateSiteMock = vi.fn();
const runServeMock = vi.fn();
const formatResultMessageMock = vi.fn();
const resolveExitCodeMock = vi.fn();
const resolveServeOptionsMock = vi.fn();
const resolveRuntimeConfigMock = vi.fn();

vi.mock("../core/site/generateSite.js", () => ({
  generateSite: generateSiteMock,
}));

vi.mock("../core/serve/runServe.js", () => ({
  runServe: runServeMock,
}));

vi.mock("./formatResultMessage.js", () => ({
  formatResultMessage: formatResultMessageMock,
}));

vi.mock("./exitCode.js", () => ({
  resolveExitCode: resolveExitCodeMock,
}));

vi.mock("./serve/resolveServeOptions.js", () => ({
  resolveServeOptions: resolveServeOptionsMock,
}));

vi.mock("../shared/config/resolveRuntimeConfig.js", () => ({
  resolveRuntimeConfig: resolveRuntimeConfigMock,
}));

describe("index.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    generateSiteMock.mockReset();
    runServeMock.mockReset();
    formatResultMessageMock.mockReset();
    resolveExitCodeMock.mockReset();
    resolveServeOptionsMock.mockReset();
    resolveRuntimeConfigMock.mockReset();
    process.exitCode = 0;
    resolveRuntimeConfigMock.mockResolvedValue({
      port: 4000,
      rootDir: "/tmp/repo",
      outputDir: "/tmp/repo/.doc-repo",
      includePatterns: [],
      excludePatterns: [],
      portSource: "default",
      rootSource: "cwd-fallback",
      configPath: null,
    });
    resolveServeOptionsMock.mockResolvedValue({
      port: 4000,
      rootDir: "/tmp/repo",
      outputDir: "/tmp/repo/.doc-repo",
      includePatterns: [],
      excludePatterns: [],
      portSource: "default",
    });
  });

  it("generateSite が success の場合、標準出力にメッセージを出して終了コード 0 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    generateSiteMock.mockResolvedValue({ status: "success" });
    formatResultMessageMock.mockReturnValue("success message");
    resolveExitCodeMock.mockReturnValue(0);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo"], "/tmp/repo");

    expect(generateSiteMock).toHaveBeenCalledWith({
      cwd: "/tmp/repo",
      scopePath: undefined,
      resolvedRootDir: "/tmp/repo",
      includePatterns: [],
      excludePatterns: [],
    });
    expect(logSpy).toHaveBeenCalledWith("success message");
    expect(errSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("generateSite が failure の場合、標準エラーにメッセージを出して終了コード 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    generateSiteMock.mockResolvedValue({ status: "failure" });
    formatResultMessageMock.mockReturnValue("failure message");
    resolveExitCodeMock.mockReturnValue(1);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "docs"], "/tmp/repo");

    expect(generateSiteMock).toHaveBeenCalledWith({
      cwd: "/tmp/repo",
      scopePath: "docs",
      resolvedRootDir: "/tmp/repo",
      includePatterns: [],
      excludePatterns: [],
    });
    expect(errSpy).toHaveBeenCalledWith("failure message");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("serve 成功時に URL を標準出力へ出して終了コード 0 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    runServeMock.mockResolvedValue({ status: "watching", exitCode: 0, publicUrl: "http://localhost:4000" });
    formatResultMessageMock.mockReturnValue("serve ok");
    resolveExitCodeMock.mockReturnValue(0);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(runServeMock).toHaveBeenCalledWith({
      cwd: "/tmp/repo",
      rootDir: "/tmp/repo",
      outputDir: "/tmp/repo/.doc-repo",
      port: 4000,
      includePatterns: [],
      excludePatterns: [],
    });
    expect(logSpy).toHaveBeenCalledWith("serve ok");
    expect(errSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("serve 失敗時に stderr 出力と exitCode 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    runServeMock.mockResolvedValue({ status: "failed", exitCode: 1 });
    formatResultMessageMock.mockReturnValue("serve ng");
    resolveExitCodeMock.mockReturnValue(1);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(runServeMock).toHaveBeenCalledWith({
      cwd: "/tmp/repo",
      rootDir: "/tmp/repo",
      outputDir: "/tmp/repo/.doc-repo",
      port: 4000,
      includePatterns: [],
      excludePatterns: [],
    });
    expect(errSpy).toHaveBeenCalledWith("serve ng");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("serve で port 競合が起きた場合、理由を stderr に出して終了コード 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    runServeMock.mockResolvedValue({
      status: "failed",
      exitCode: 1,
      steps: [],
      failures: [{ type: "port-conflict", message: "PORT_CONFLICT: port 4000 は既に使用されています。", exitCode: 1 }],
    });
    formatResultMessageMock.mockReturnValue("[doc-repo] error: PORT_CONFLICT: port 4000 は既に使用されています。");
    resolveExitCodeMock.mockReturnValue(1);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(errSpy).toHaveBeenCalledWith("[doc-repo] error: PORT_CONFLICT: port 4000 は既に使用されています。");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("generate で設定ファイルが不正な場合、stderr に出して終了コード 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    resolveRuntimeConfigMock.mockRejectedValue(
      Object.assign(new Error("rootDir が見つかりません"), { code: "CONFIG_ROOT_DIR_NOT_FOUND" }),
    );
    formatResultMessageMock.mockReturnValue("[doc-repo] error: CONFIG_ROOT_DIR_NOT_FOUND");
    resolveExitCodeMock.mockReturnValue(1);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo"], "/tmp/repo");

    expect(errSpy).toHaveBeenCalledWith("[doc-repo] error: CONFIG_ROOT_DIR_NOT_FOUND");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("serve で設定ファイルが不正な場合、stderr に出して終了コード 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    resolveServeOptionsMock.mockRejectedValue(
      Object.assign(new Error("port は 1-65535"), { code: "CONFIG_INVALID_PORT" }),
    );
    formatResultMessageMock.mockReturnValue("[doc-repo] error: CONFIG_INVALID_PORT");
    resolveExitCodeMock.mockReturnValue(1);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(errSpy).toHaveBeenCalledWith("[doc-repo] error: CONFIG_INVALID_PORT");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
