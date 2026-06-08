import { describe, expect, it } from "vitest";

import { resolveExitCode } from "./exitCode.js";

describe("exitCode.ts", () => {
  it("GenerationResult.exitCode が 0 の場合、0 が返却されること。", () => {
    const result = resolveExitCode({
      status: "success",
      exitCode: 0,
      outputDir: ".doc-repo",
      targetPath: ".",
      markdownFileCount: 1,
      message: "ok",
      warnings: [],
    });

    expect(result).toBe(0);
  });

  it("GenerationResult.exitCode が 1 の場合、1 が返却されること。", () => {
    const result = resolveExitCode({
      status: "failure",
      exitCode: 1,
      outputDir: ".doc-repo",
      targetPath: ".",
      markdownFileCount: 0,
      message: "ng",
      warnings: [],
      errorReason: "reason",
      hint: "hint",
    });

    expect(result).toBe(1);
  });

  it("ServeSession 形式の exitCode が 1 の場合、1 が返却されること。", () => {
    const result = resolveExitCode({
      exitCode: 1,
      status: "failed",
      steps: [],
      failures: [],
    });

    expect(result).toBe(1);
  });
});
