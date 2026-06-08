import { describe, expect, it } from "vitest";

import { resolveExitCode } from "./exitCode.js";

describe("exitCode.ts", () => {
  it("GenerationResult.exitCode が 0 の場合、0 が返却されること。", () => {
    const result = resolveExitCode({
      exitCode: 0,
    });

    expect(result).toBe(0);
  });

  it("GenerationResult.exitCode が 1 の場合、1 が返却されること。", () => {
    const result = resolveExitCode({
      exitCode: 1,
    });

    expect(result).toBe(1);
  });

  it("ServeSession 形式の exitCode が 1 の場合、1 が返却されること。", () => {
    const result = resolveExitCode({
      exitCode: 1,
    });

    expect(result).toBe(1);
  });
});
