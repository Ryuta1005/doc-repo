import { beforeEach, describe, expect, it, vi } from "vitest";

const generateSiteMock = vi.fn();
const formatResultMessageMock = vi.fn();
const resolveExitCodeMock = vi.fn();

vi.mock("../core/site/generateSite.js", () => ({
  generateSite: generateSiteMock,
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
});
