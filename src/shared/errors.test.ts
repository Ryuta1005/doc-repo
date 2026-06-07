import { describe, expect, it } from "vitest";

import { AppError, toUserGuidance } from "./errors.js";

describe("errors.ts", () => {
  it("AppError が渡された場合、code を含む理由と hint が返却されること。", () => {
    const error = new AppError("失敗", "E001", "対処してください");

    const guidance = toUserGuidance(error);

    expect(guidance).toEqual({
      reason: "E001: 失敗",
      hint: "対処してください",
    });
  });

  it("Error が渡された場合、メッセージと既定ヒントが返却されること。", () => {
    const guidance = toUserGuidance(new Error("boom"));

    expect(guidance.reason).toBe("boom");
    expect(guidance.hint).toContain("権限");
  });

  it("unknown が渡された場合、Unknown error と既定ヒントが返却されること。", () => {
    const guidance = toUserGuidance("unknown");

    expect(guidance).toEqual({
      reason: "Unknown error",
      hint: "詳細ログを確認し、問題が解消しない場合は再実行してください。",
    });
  });
});
