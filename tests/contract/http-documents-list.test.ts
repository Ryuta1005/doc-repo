import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { handleDocumentsListRoute } from "../../src/presentation/http/routes/documentsListRoute.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-http-list-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("http-documents-list contract", () => {
  it("GET /api/documents 相当で identifier/title を返すこと。", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "overview", "product.md"), "# プロダクト概要\n");

    const result = await handleDocumentsListRoute({ rootDir });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      identifier: "docs/overview/product.md",
      title: "product",
    });
  });
});
