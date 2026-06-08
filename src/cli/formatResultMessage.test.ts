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

  it("serve success の場合、generate/serve/watch 行を返すこと。", () => {
    const text = formatResultMessage({
      status: "watching",
      exitCode: 0,
      publicUrl: "http://localhost:4000",
      steps: [
        { step: "initial-generate", status: "success", message: "ok", durationMs: 10 },
        { step: "start-server", status: "success", message: "ok", durationMs: 10 },
        { step: "start-watch", status: "success", message: "ok", durationMs: 10 },
      ],
      failures: [],
    });

    expect(text).toContain("[doc-repo] generate: success");
    expect(text).toContain("[doc-repo] serve: listening on http://localhost:4000");
    expect(text).toContain("[doc-repo] watch: started");
  });

  it("serve failure の場合、error と対処を返すこと。", () => {
    const text = formatResultMessage({
      status: "failed",
      exitCode: 1,
      steps: [{ step: "initial-generate", status: "failure", message: "ng", durationMs: 5 }],
      failures: [
        {
          type: "initial-generate-failed",
          message: "INITIAL_GENERATE_FAILED: x",
          hint: "fix",
          exitCode: 1,
        },
      ],
    });

    expect(text).toContain("[doc-repo] error: INITIAL_GENERATE_FAILED: x");
    expect(text).toContain("対処: fix");
  });
});
