import { describe, expect, it } from "vitest";

import { convertMarkdown } from "./convertMarkdown.js";

describe("convertMarkdown.ts", () => {
  it("見出し # がある場合、その見出しが title として返却されること。", () => {
    const result = convertMarkdown("# タイトル\n\n本文", "docs/test.md");

    expect(result.title).toBe("タイトル");
    expect(result.html).toContain("<h1>タイトル</h1>");
  });

  it("見出し # がない場合、ファイル名が title として返却されること。", () => {
    const result = convertMarkdown("本文のみ", "docs/fallback-name.md");

    expect(result.title).toBe("fallback-name");
    expect(result.html).toContain("<p>本文のみ</p>");
  });

  it("相対画像パスがページ深さに応じた相対パスへリベースされること。", () => {
    const result = convertMarkdown("![alt](./assets/a.png)", "docs/guide/page.md");

    expect(result.html).toContain('src="../../assets/docs/guide/assets/a.png"');
  });

  it("実在ページへの相対リンクは相対 .html リンクへ正規化されること。", () => {
    const knownIds = new Set(["docs/spec"]);
    const result = convertMarkdown("[spec](../spec.md)", "docs/guide/page.md", knownIds);

    expect(result.html).toContain('href="../spec.html"');
  });

  it("実在しないリンク先は .html 化せず資産として相対パスのまま保たれること。", () => {
    const result = convertMarkdown("[missing](./nope.md)", "docs/guide/page.md", new Set());

    expect(result.html).toContain('href="../../../docs/guide/nope.md"');
    expect(result.html).not.toContain(".html");
  });

  it("ディレクトリリンクは index ページが実在する場合に相対 .html リンクへなること。", () => {
    const knownIds = new Set(["project/planning/backlog/001_epic/index"]);
    const result = convertMarkdown("[epic](./001_epic/)", "project/planning/backlog/index.md", knownIds);

    expect(result.html).toContain('href="001_epic/index.html"');
  });

  it("相対パスがズレた .md リンクでも、同名ページが一意なら救済されること。", () => {
    const knownIds = new Set(["project/issue-workflow", "project/planning/backlog/index"]);
    const uniqueBasenames = new Map([["issue-workflow", "project/issue-workflow"]]);
    // 記述は ../issue-workflow.md（= project/planning/issue-workflow で実在しない）。
    const result = convertMarkdown(
      "[workflow](../issue-workflow.md)",
      "project/planning/backlog/index.md",
      knownIds,
      uniqueBasenames,
    );

    expect(result.html).toContain('href="../../issue-workflow.html"');
  });

  it("同名ページが複数ある場合、ベース名フォールバックは効かず資産パスのまま保たれること。", () => {
    const knownIds = new Set(["a/index", "b/index"]);
    // index は複数あり曖昧なため uniqueBasenames には含めない（救済対象外）。
    const result = convertMarkdown("[x](../missing/index.md)", "a/sub/page.md", knownIds, new Map());

    expect(result.html).not.toContain("index.html");
    expect(result.html).toContain("index.md");
  });

  it("日本語を含む .md リンクが二重エンコードされず、単一エンコードの相対 .html になること。", () => {
    const knownIds = new Set(["project/planning/backlog/001_リポジトリ/003_範囲指定"]);
    const result = convertMarkdown(
      "[範囲](./001_リポジトリ/003_範囲指定.md)",
      "project/planning/backlog/index.md",
      knownIds,
    );

    // 単一エンコード（%E3...）であり、二重エンコード（%25E3...）にならないこと。
    expect(result.html).toContain(
      'href="001_%E3%83%AA%E3%83%9D%E3%82%B8%E3%83%88%E3%83%AA/003_%E7%AF%84%E5%9B%B2%E6%8C%87%E5%AE%9A.html"',
    );
    expect(result.html).not.toContain("%25");
  });

  it("外部リンクとハッシュリンクはそのまま維持されること。", () => {
    const result = convertMarkdown("[web](https://example.com) [anchor](#intro)", "docs/guide/page.md");

    expect(result.html).toContain('href="https://example.com"');
    expect(result.html).toContain('href="#intro"');
  });

  // T008: 相対画像参照の URL 変換と除外ルィールのテスト
  describe("T008: 相対画像 URL 変換と除外ルール", () => {
    it("相対画像パスがページ深さに応じた相対パスへリベースされること。", () => {
      const result = convertMarkdown("![screenshot](./assets/screenshot.png)", "docs/guide/page.md");

      expect(result.html).toContain('src="../../assets/docs/guide/assets/screenshot.png"');
    });

    it("クエリとハッシュ付きの相対画像が .doc-repo/assets 配下を指したまま suffix を維持すること。", () => {
      const result = convertMarkdown("![screenshot](./assets/screenshot.png?v=1#section)", "docs/guide/page.md");

      expect(result.html).toContain('src="../../assets/docs/guide/assets/screenshot.png?v=1#section"');
    });

    it("外部 URL 画像（https://）はそのまま維持されること。", () => {
      const result = convertMarkdown("![external](https://example.com/image.png)", "docs/page.md");

      expect(result.html).toContain('src="https://example.com/image.png"');
    });

    it("外部 URL 画像（http://）はそのまま維持されること。", () => {
      const result = convertMarkdown("![external](http://example.com/image.png)", "docs/page.md");

      expect(result.html).toContain('src="http://example.com/image.png"');
    });

    it("プロトコル相対 URL（//）はそのまま維持されること。", () => {
      const result = convertMarkdown("![external](//example.com/image.png)", "docs/page.md");

      expect(result.html).toContain('src="//example.com/image.png"');
    });

    it("ハッシュ参照（#...）はそのまま維持されること。", () => {
      const result = convertMarkdown("![anchor](#section)", "docs/page.md");

      expect(result.html).toContain('src="#section"');
    });

    it("リポジトリルート外へ抜ける相対パス（/../）はそのまま維持されること。", () => {
      const result = convertMarkdown("![escape](/../etc/passwd)", "docs/page.md");

      expect(result.html).toContain('src="/../etc/passwd"');
    });

    it("相対画像の参照情報が referencedImages に収集されること。", () => {
      const result = convertMarkdown("![a](./assets/a.png) ![b](../images/b.png)", "docs/guide/page.md");

      expect(result.referencedImages).toEqual(["docs/guide/assets/a.png", "docs/images/b.png"]);
    });

    it("同一画像を複数回参照しても referencedImages は重複しないこと。", () => {
      const result = convertMarkdown("![a](./assets/a.png)\n![a2](./assets/a.png)", "docs/guide/page.md");

      expect(result.referencedImages).toEqual(["docs/guide/assets/a.png"]);
    });

    it("外部 URL とハッシュ参照は referencedImages に含まれないこと。", () => {
      const result = convertMarkdown("![ext](https://example.com/a.png) ![anchor](#top)", "docs/guide/page.md");

      expect(result.referencedImages).toEqual([]);
    });
  });
});
