import { describe, expect, it } from "vitest";

import { formatResultMessage } from "./formatResultMessage.js";

describe("formatResultMessage.ts", () => {
  it("警告なしの success の場合、基本メッセージのみが返却されること。", () => {
    const text = formatResultMessage({
      status: "success",
      exitCode: 0,
      outputDir: "/tmp/.doc-repo",
      targetPath: "/tmp",
      markdownFileCount: 2,
      message: "成功しました",
      warnings: [],
    });

    expect(text).toContain("成功しました");
    expect(text).toContain("生成対象: /tmp");
    expect(text).toContain("出力先: /tmp/.doc-repo");
    expect(text).not.toContain("警告:");
  });

  it("failure かつ警告ありの場合、理由と対処を含む文字列が返却されること。", () => {
    const text = formatResultMessage({
      status: "failure",
      exitCode: 1,
      outputDir: "/tmp/.doc-repo",
      targetPath: "/tmp/docs",
      markdownFileCount: 0,
      message: "失敗しました",
      warnings: ["warning1", "warning2"],
      errorReason: "E001: error",
      hint: "再実行してください",
    });

    expect(text).toContain("警告:");
    expect(text).toContain("- warning1");
    expect(text).toContain("- warning2");
    expect(text).toContain("理由: E001: error");
    expect(text).toContain("対処: 再実行してください");
  });
});
