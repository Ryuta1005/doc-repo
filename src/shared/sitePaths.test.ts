import { describe, expect, it } from "vitest";

import { generatedAssetHref, pageDirDepth, siteRootPrefix, docHref } from "./sitePaths.js";

describe("sitePaths.ts", () => {
  describe("pageDirDepth", () => {
    it("ルート直下のファイルは深さ 0", () => {
      expect(pageDirDepth("README.md")).toBe(0);
    });

    it("1 階層下のファイルは深さ 1", () => {
      expect(pageDirDepth("docs/README.md")).toBe(1);
    });

    it("2 階層下のファイルは深さ 2", () => {
      expect(pageDirDepth("docs/guide/index.md")).toBe(2);
    });
  });

  describe("siteRootPrefix", () => {
    it("ルート直下のファイルはプレフィックスなし", () => {
      expect(siteRootPrefix("README.md")).toBe("");
    });

    it("1 階層下のファイルは ../ を 1 回", () => {
      expect(siteRootPrefix("docs/README.md")).toBe("../");
    });

    it("2 階層下のファイルは ../ を 2 回", () => {
      expect(siteRootPrefix("docs/guide/page.md")).toBe("../../");
    });
  });

  describe("docHref", () => {
    it("同じディレクトリのリンク", () => {
      expect(docHref("docs/guide/page.md", "docs/guide/other")).toBe("other.html");
    });

    it("上位ディレクトリへのリンク", () => {
      expect(docHref("docs/guide/page.md", "docs/spec")).toBe("../spec.html");
    });

    it("ルートへのリンク", () => {
      expect(docHref("docs/guide/page.md", "README")).toBe("../../README.html");
    });
  });

  describe("T006: generatedAssetHref", () => {
    it("ルート直下の HTML から参照画像への相対パス", () => {
      expect(generatedAssetHref("README.md", "docs/assets/screenshot.png")).toBe("assets/docs/assets/screenshot.png");
    });

    it("1 階層下の HTML から参照画像への相対パス", () => {
      expect(generatedAssetHref("docs/guide/page.md", "docs/assets/screenshot.png")).toBe(
        "../../assets/docs/assets/screenshot.png",
      );
    });

    it("2 階層下の HTML から参照画像への相対パス", () => {
      expect(generatedAssetHref("docs/guide/advanced/index.md", "docs/assets/screenshot.png")).toBe(
        "../../../assets/docs/assets/screenshot.png",
      );
    });

    it("日本語をスペースを含む画像パスの URL エンコード", () => {
      expect(generatedAssetHref("docs/page.md", "docs/assets/スクリーン ショット.png")).toBe(
        "../assets/docs/assets/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%20%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88.png",
      );
    });

    it("ディレクトリ区切り（スラッシュ）は保持される", () => {
      expect(generatedAssetHref("README.md", "project/docs/images/diagram.svg")).toBe(
        "assets/project/docs/images/diagram.svg",
      );
    });
  });
});
