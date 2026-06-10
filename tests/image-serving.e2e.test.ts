import path from "node:path";
import fs from "fs-extra";
import http from "node:http";
import { describe, it, expect, afterEach } from "vitest";

import { generateSite } from "../src/core/site/generateSite.js";
import { startStaticServer } from "../src/core/serve/startStaticServer.js";

describe("T016: 参照画像の HTTP 200 統合テスト", () => {
  let tmpDir: string | null = null;
  let server: Awaited<ReturnType<typeof startStaticServer>> | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (tmpDir) {
      await fs.remove(tmpDir);
    }
  });

  it("相対画像参照を含む Markdown が生成後、serve で HTTP 200 で配信されること", async () => {
    // テストディレクトリの準備
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/image-serving-"));
    const testFixturePath = path.resolve(process.cwd(), "tests/fixtures/serve-image-assets");

    // フィクスチャから README.md と画像をコピー
    await fs.copy(path.join(testFixturePath, "README.md"), path.join(tmpDir, "README.md"));
    await fs.copy(path.join(testFixturePath, "docs"), path.join(tmpDir, "docs"));

    // サイト生成
    const result = await generateSite({
      cwd: tmpDir,
      resolvedRootDir: tmpDir,
    });

    expect(result.status).toBe("success");
    expect(result.exitCode).toBe(0);

    const readmeHtmlPath = path.join(tmpDir, ".doc-repo", "README.html");
    const readmeHtml = await fs.readFile(readmeHtmlPath, "utf8");

    const srcMatch = readmeHtml.match(/<img[^>]*src="([^"]+)"/i);
    expect(srcMatch).not.toBeNull();

    const imageSrc = srcMatch?.[1] ?? "";
    expect(imageSrc).toBe("assets/docs/assets/screenshot-sample.png");

    // HTML が参照する src と、コピーされた実ファイルの存在を独立に検証する
    const generatedImagePath = path.join(tmpDir, ".doc-repo", imageSrc);
    expect(await fs.pathExists(generatedImagePath)).toBe(true);

    // serve で配信確認
    const freePort = 19999 + Math.floor(Math.random() * 1000);
    server = await startStaticServer({
      outputDir: result.outputDir,
      port: freePort,
    });

    // HTTP 200 で画像が配信されることを確認
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://localhost:${freePort}/${imageSrc}`, (res) => {
        try {
          expect(res.statusCode).toBe(200);
          resolve();
        } catch (e) {
          reject(e);
        }
        res.destroy();
      });
      req.on("error", reject);
    });
  });
});
