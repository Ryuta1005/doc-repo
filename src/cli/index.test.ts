import { beforeEach, describe, expect, it, vi } from "vitest";

const generateSiteMock = vi.fn();
const runServeMock = vi.fn();
const formatResultMessageMock = vi.fn();
const resolveExitCodeMock = vi.fn();

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

describe("index.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    generateSiteMock.mockReset();
    runServeMock.mockReset();
    formatResultMessageMock.mockReset();
    resolveExitCodeMock.mockReset();
    process.exitCode = 0;
  });

  it("generateSite が success の場合、標準出力にメッセージを出して終了コード 0 を設定すること。", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    generateSiteMock.mockResolvedValue({ status: "success" });
    formatResultMessageMock.mockReturnValue("success message");
    resolveExitCodeMock.mockReturnValue(0);

    const { run } = await import("./index.js");
    await run(["node", "doc-repo"], "/tmp/repo");

    expect(generateSiteMock).toHaveBeenCalledWith({ cwd: "/tmp/repo", scopePath: undefined });
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

    expect(generateSiteMock).toHaveBeenCalledWith({ cwd: "/tmp/repo", scopePath: "docs" });
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

    expect(runServeMock).toHaveBeenCalled();
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

    expect(runServeMock).toHaveBeenCalled();
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
});
