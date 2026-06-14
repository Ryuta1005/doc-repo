import { beforeEach, describe, expect, it, vi } from "vitest";

const runServeMock = vi.fn();
const formatResultMessageMock = vi.fn();
const resolveServeOptionsMock = vi.fn();
const createConfigFileMock = vi.fn();

vi.mock("../core/serve/runServe.js", () => ({
  runServe: runServeMock,
}));

vi.mock("./formatResultMessage.js", () => ({
  formatResultMessage: formatResultMessageMock,
}));

vi.mock("./serve/resolveServeOptions.js", () => ({
  resolveServeOptions: resolveServeOptionsMock,
}));

vi.mock("../core/init/createConfigFile.js", () => ({
  createConfigFile: createConfigFileMock,
}));

describe("index.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    runServeMock.mockReset();
    formatResultMessageMock.mockReset();
    resolveServeOptionsMock.mockReset();
    createConfigFileMock.mockReset();
    process.exitCode = 0;
    resolveServeOptionsMock.mockResolvedValue({
      port: 4000,
      rootDir: "/tmp/repo",
      siteName: "Doc Repo",
      includePatterns: [],
      excludePatterns: [],
      portSource: "default",
    });
    createConfigFileMock.mockResolvedValue({
      status: "created",
      configPath: "/tmp/repo/doc-repo.config.json",
    });
  });

  it("serve 成功時に URL を標準出力へ出して終了コード 0 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    runServeMock.mockResolvedValue({ status: "watching", exitCode: 0, publicUrl: "http://localhost:4000" });
    formatResultMessageMock.mockReturnValue("serve ok");

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(runServeMock).toHaveBeenCalledWith({
      cwd: "/tmp/repo",
      rootDir: "/tmp/repo",
      siteName: "Doc Repo",
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

  it("help で serve をブラウザワークスペース起動として説明すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { run } = await import("./index.js");
    await expect(run(["node", "doc-repo", "--help"], "/tmp/repo")).rejects.toThrow(
      'process.exit unexpectedly called with "0"',
    );

    const helpText = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(helpText).toContain("Serve browser workspace for repository Markdown.");
    expect(helpText).toContain("serve [options]");
    expect(helpText).toContain("Start the browser workspace");
    expect(helpText).not.toContain("Start a local server for the generated site");

    logSpy.mockRestore();
    writeSpy.mockRestore();
  });

  it("serve 失敗時に stderr 出力と exitCode 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    runServeMock.mockResolvedValue({ status: "failed", exitCode: 1 });
    formatResultMessageMock.mockReturnValue("serve ng");

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(runServeMock).toHaveBeenCalledWith({
      cwd: "/tmp/repo",
      rootDir: "/tmp/repo",
      siteName: "Doc Repo",
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
      failures: [{ type: "port-conflict", message: "PORT_CONFLICT: port 4000 is already in use.", exitCode: 1 }],
    });
    formatResultMessageMock.mockReturnValue("[doc-repo] error: PORT_CONFLICT: port 4000 is already in use.");

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(errSpy).toHaveBeenCalledWith("[doc-repo] error: PORT_CONFLICT: port 4000 is already in use.");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("serve で設定ファイルが不正な場合、stderr に出して終了コード 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    resolveServeOptionsMock.mockRejectedValue(
      Object.assign(new Error("port must be from 1 to 65535"), { code: "CONFIG_INVALID_PORT" }),
    );
    formatResultMessageMock.mockReturnValue("[doc-repo] error: CONFIG_INVALID_PORT");

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "serve"], "/tmp/repo");

    expect(errSpy).toHaveBeenCalledWith("[doc-repo] error: CONFIG_INVALID_PORT");
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("init で新規作成された場合、標準出力にパスを出して終了コード 0 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    createConfigFileMock.mockResolvedValue({
      status: "created",
      configPath: "/tmp/repo/doc-repo.config.json",
    });

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "init"], "/tmp/repo");

    expect(createConfigFileMock).toHaveBeenCalledWith("/tmp/repo");
    expect(logSpy).toHaveBeenCalledWith("Created config file: /tmp/repo/doc-repo.config.json");
    expect(errSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("init で既存ファイルがある場合、標準出力にメッセージを出して終了コード 0 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    createConfigFileMock.mockResolvedValue({
      status: "already-exists",
      configPath: "/tmp/repo/doc-repo.config.json",
    });

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "init"], "/tmp/repo");

    expect(logSpy).toHaveBeenCalledWith("Config file already exists: /tmp/repo/doc-repo.config.json");
    expect(errSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("init で失敗した場合、標準エラーに理由を出して終了コード 1 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    createConfigFileMock.mockResolvedValue({
      status: "failure",
      configPath: "/tmp/repo/doc-repo.config.json",
      errorReason: "EACCES: permission denied",
    });

    const { run } = await import("./index.js");
    await run(["node", "doc-repo", "init"], "/tmp/repo");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith("Error: Failed to create config file.");
    expect(errSpy).toHaveBeenCalledWith("Reason: EACCES: permission denied");
    expect(process.exitCode).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
