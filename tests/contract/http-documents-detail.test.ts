import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { createHttpBoundaryPipeline } from "../../src/presentation/http/createServer.js";
const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-http-detail-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("http-documents-detail contract", () => {
  it("GET /api/document?path=<encoded> 相当で html と metadata を返すこと。", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "overview", "product.md"), "# プロダクト概要\n本文");

    const pipeline = createHttpBoundaryPipeline({ rootDir });
    const detail = await pipeline.getDocument(encodeURIComponent("docs/overview/product.md"));

    expect(detail).toMatchObject({
      identifier: "docs/overview/product.md",
      title: "プロダクト概要",
      metadata: {},
    });
    expect((detail as { html: string }).html).toContain("<h1>プロダクト概要</h1>");
  });

  it("文書取得 API の HTML では厳密に実在する Markdown リンクだけを .html リンクへ解決すること。", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(
      path.join(rootDir, "project", "planning", "backlog", "index.md"),
      [
        "# Backlog",
        "",
        "[workflow](../issue-workflow.md)",
        "[epic](./001_epic/)",
      ].join("\n"),
    );
    await fs.outputFile(path.join(rootDir, "project", "issue-workflow.md"), "# Workflow\n");
    await fs.outputFile(path.join(rootDir, "project", "planning", "backlog", "001_epic", "index.md"), "# Epic\n");

    const pipeline = createHttpBoundaryPipeline({ rootDir });
    const detail = (await pipeline.getDocument(
      encodeURIComponent("project/planning/backlog/index.md"),
    )) as { html: string };

    expect(detail.html).toContain('href="../../../../project/planning/issue-workflow.md"');
    expect(detail.html).not.toContain('href="../../issue-workflow.html"');
    expect(detail.html).toContain('href="001_epic/index.html"');
  });

  it("不正な path query は 400 INVALID_REQUEST になること。", async () => {
    const rootDir = await makeTempDir();
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    await expect(pipeline.getDocument("")).rejects.toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
    });
  });

  it("存在しない文書は 404 DOCUMENT_NOT_FOUND になること。", async () => {
    const rootDir = await makeTempDir();
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    await expect(pipeline.getDocument(encodeURIComponent("docs/overview/missing.md"))).rejects.toMatchObject({
      status: 404,
      code: "DOCUMENT_NOT_FOUND",
    });
  });
});
