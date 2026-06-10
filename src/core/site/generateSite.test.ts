import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../shared/errors.js";

const detectRootMock = vi.fn();
const scanMarkdownMock = vi.fn();
const buildSiteBundleMock = vi.fn();
const renderPagesMock = vi.fn();
const copyAssetsMock = vi.fn();
const atomicPublishMock = vi.fn();
const pathExistsMock = vi.fn();
const ensureDirMock = vi.fn();
const writeJsonMock = vi.fn();
const statMock = vi.fn();
const loggerInfoMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("../scanner/detectRoot.js", () => ({
  detectRoot: detectRootMock,
}));

vi.mock("../scanner/scanMarkdown.js", () => ({
  scanMarkdown: scanMarkdownMock,
}));

vi.mock("./buildSiteBundle.js", () => ({
  buildSiteBundle: buildSiteBundleMock,
}));

vi.mock("./renderPages.js", () => ({
  renderPages: renderPagesMock,
}));

vi.mock("./copyAssets.js", () => ({
  copyAssets: copyAssetsMock,
}));

vi.mock("./atomicPublish.js", () => ({
  atomicPublish: atomicPublishMock,
}));

vi.mock("fs-extra", () => ({
  default: {
    pathExists: pathExistsMock,
    ensureDir: ensureDirMock,
    writeJson: writeJsonMock,
    stat: statMock,
  },
}));

vi.mock("../../shared/logger.js", () => ({
  createLogger: () => ({
    info: loggerInfoMock,
    warn: vi.fn(),
    error: loggerErrorMock,
    log: vi.fn(),
  }),
}));

describe("generateSite.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    detectRootMock.mockReset();
    scanMarkdownMock.mockReset();
    buildSiteBundleMock.mockReset();
    renderPagesMock.mockReset();
    copyAssetsMock.mockReset();
    atomicPublishMock.mockReset();
    pathExistsMock.mockReset();
    ensureDirMock.mockReset();
    writeJsonMock.mockReset();
    statMock.mockReset();
    loggerInfoMock.mockReset();
    loggerErrorMock.mockReset();

    buildSiteBundleMock.mockResolvedValue({ pages: [], referencedImages: [], tree: [] });
    renderPagesMock.mockResolvedValue(undefined);
    copyAssetsMock.mockResolvedValue(undefined);
    atomicPublishMock.mockResolvedValue(undefined);
    ensureDirMock.mockResolvedValue(undefined);
    writeJsonMock.mockResolvedValue(undefined);
    statMock.mockResolvedValue({ isDirectory: () => true });
  });

  it("Markdown が 0 件の場合、警告付き success が返却されること。", async () => {
    const rootDir = "/repo";

    detectRootMock.mockResolvedValue({ detectedRoot: rootDir, usedFallback: false });
    scanMarkdownMock.mockResolvedValue([]);
    pathExistsMock.mockResolvedValue(true);

    const { generateSite } = await import("./generateSite.js");
    const result = await generateSite({
      cwd: "/work",
      scopePath: "docs",
      resolvedRootDir: rootDir,
    });

    expect(result.status).toBe("success");
    expect(result.outputDir).toBe(path.join(rootDir, ".doc-repo"));
    expect(result.markdownFileCount).toBe(0);
    expect(result.warnings).toContain("Markdown ファイルが 0 件でした。空サイトを生成しました。");
    expect(scanMarkdownMock).toHaveBeenCalledWith(rootDir, path.join(rootDir, "docs"), {
      includePatterns: undefined,
      excludePatterns: undefined,
    });
    expect(copyAssetsMock).toHaveBeenCalledWith(expect.any(String), expect.any(String), rootDir, []);
  });

  it("scopePath がルート外を指す場合、failure が返却されること。", async () => {
    const rootDir = "/repo";

    detectRootMock.mockResolvedValue({ detectedRoot: rootDir, usedFallback: false });

    const { generateSite } = await import("./generateSite.js");
    const result = await generateSite({ cwd: rootDir, scopePath: "../outside" });

    expect(result.status).toBe("failure");
    expect(result.errorReason).toContain("SCOPE_OUTSIDE_ROOT");
    expect(result.hint).toContain("相対パス");
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  it("テンプレートが存在しない場合、TEMPLATE_MISSING で failure が返却されること。", async () => {
    const rootDir = "/repo";

    detectRootMock.mockResolvedValue({ detectedRoot: rootDir, usedFallback: false });
    pathExistsMock.mockResolvedValue(false);

    const { generateSite } = await import("./generateSite.js");
    const result = await generateSite({ cwd: rootDir });

    expect(result.status).toBe("failure");
    expect(result.errorReason).toContain("TEMPLATE_MISSING");
    expect(result.hint).toContain("同梱");
  });

  it("下流処理で unknown Error が発生した場合、既定ヒント付き failure が返却されること。", async () => {
    const rootDir = "/repo";

    detectRootMock.mockResolvedValue({ detectedRoot: rootDir, usedFallback: false });
    pathExistsMock.mockResolvedValue(true);
    scanMarkdownMock.mockResolvedValue([{ absolutePath: "/repo/a.md", relativePath: "a.md" }]);
    buildSiteBundleMock.mockRejectedValue(new Error("build failed"));

    const { generateSite } = await import("./generateSite.js");
    const result = await generateSite({ cwd: rootDir });

    expect(result.status).toBe("failure");
    expect(result.errorReason).toBe("build failed");
    expect(result.hint).toContain("権限");
  });

  it("指定した scopePath が存在しない場合、SCOPE_NOT_FOUND で failure が返却されること。", async () => {
    const rootDir = "/repo";

    detectRootMock.mockResolvedValue({ detectedRoot: rootDir, usedFallback: false });
    pathExistsMock.mockImplementation(async (target: string) => {
      if (target === path.join(rootDir, "templates")) {
        return true;
      }
      if (target === path.join(rootDir, "nonexistent")) {
        return false;
      }
      return true;
    });

    const { generateSite } = await import("./generateSite.js");
    const result = await generateSite({ cwd: rootDir, scopePath: "nonexistent" });

    expect(result.status).toBe("failure");
    expect(result.errorReason).toContain("SCOPE_NOT_FOUND");
    expect(result.hint).toContain("リポジトリルート");
  });

  it("scopePath がファイルを指す場合、SCOPE_NOT_DIRECTORY で failure が返却されること。", async () => {
    const rootDir = "/repo";

    detectRootMock.mockResolvedValue({ detectedRoot: rootDir, usedFallback: false });
    pathExistsMock.mockResolvedValue(true);
    statMock.mockResolvedValue({ isDirectory: () => false });

    const { generateSite } = await import("./generateSite.js");
    const result = await generateSite({ cwd: rootDir, scopePath: "file.md" });

    expect(result.status).toBe("failure");
    expect(result.errorReason).toContain("SCOPE_NOT_DIRECTORY");
    expect(result.hint).toContain("フォルダ");
  });
});
