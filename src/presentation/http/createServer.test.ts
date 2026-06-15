import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  createHttpBoundaryPipeline,
  ensureViewerStaticAssetOverrides,
  resolveViewerDistDir,
  resolveViewerStaticAssetOverrides,
} from "./createServer.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-http-boundary-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("createServer boundary pipeline", () => {
  it("route/validation/error mapping を分離しながら list/get を処理できること", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "a.md"), "# A\n\nbody");

    const pipeline = createHttpBoundaryPipeline({ rootDir });

    expect(pipeline.routes.map((route) => route.path)).toEqual([
      "/api/documents",
      "/api/document",
      "/api/document/save",
      "/api/document/image",
      "/api/site-config",
      "/events",
    ]);
    await expect(pipeline.getSiteConfig()).resolves.toEqual({ name: "Doc Repo" });

    const list = (await pipeline.listDocuments()) as Array<{ identifier: string }>;
    expect(list[0]?.identifier).toBe("docs/a.md");

    const detail = (await pipeline.getDocument(encodeURIComponent("docs/a.md"))) as { title: string; html: string };
    expect(detail.title).toBe("A");
    expect(detail.html).toContain("<h1>A</h1>");
  });

  it("入力不正を INVALID_REQUEST(400) へ変換できること", async () => {
    const rootDir = await makeTempDir();
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    await expect(pipeline.getDocument("..")).rejects.toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
    });
  });

  it("存在しない文書を DOCUMENT_NOT_FOUND(404) へ変換できること", async () => {
    const rootDir = await makeTempDir();
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    await expect(pipeline.getDocument(encodeURIComponent("docs/missing.md"))).rejects.toMatchObject({
      status: 404,
      code: "DOCUMENT_NOT_FOUND",
    });
  });

  it("画像アップロードで文書相対パスを返し、assets へ保存できること", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "a.md"), "# A\n");
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    const formData = new FormData();
    formData.set("identifier", "docs/a.md");
    formData.set("image", new Blob([Buffer.from("PNG")], { type: "image/png" }), "sample.png");

    const result = (await pipeline.uploadDocumentImage(formData)) as {
      status: string;
      imagePath: string;
    };

    expect(result).toEqual({
      status: "uploaded",
      imagePath: "./assets/sample.png",
    });

    await expect(fs.pathExists(path.join(rootDir, "docs", "assets", "sample.png"))).resolves.toBe(true);
  });

  it("React viewer の app.js と CSS を serve 用 override として解決できること", async () => {
    const distDir = await makeTempDir();
    await fs.outputFile(path.join(distDir, "app.js"), "console.log('viewer');");
    await fs.outputFile(path.join(distDir, "assets", "main-abc.css"), ".viewer-layout{}");

    const overrides = await resolveViewerStaticAssetOverrides(distDir);

    expect(overrides).toEqual({
      "/app.js": path.join(distDir, "app.js"),
      "/styles.css": path.join(distDir, "assets", "main-abc.css"),
    });
  });

  it("React viewer bundle がない場合は override を返さないこと", async () => {
    const distDir = await makeTempDir();

    const overrides = await resolveViewerStaticAssetOverrides(distDir);

    expect(overrides).toBeUndefined();
  });

  it("package root から viewer dist を解決し、既存 bundle を serve 用 override として返せること", async () => {
    const packageRoot = await makeTempDir();
    const distDir = resolveViewerDistDir(packageRoot);
    await fs.outputFile(path.join(distDir, "app.js"), "console.log('viewer');");
    await fs.outputFile(path.join(distDir, "assets", "main-abc.css"), ".viewer-layout{}");

    const overrides = await ensureViewerStaticAssetOverrides(packageRoot);

    expect(overrides).toEqual({
      "/app.js": path.join(distDir, "app.js"),
      "/styles.css": path.join(distDir, "assets", "main-abc.css"),
    });
  });
});
