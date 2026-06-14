import { describe, expect, it } from "vitest";

import { AppError, toUserGuidance } from "./errors.js";

describe("errors.ts", () => {
  it("AppError が渡された場合、code を含む理由と hint が返却されること。", () => {
    const error = new AppError("Failed", "E001", "Try this fix");

    const guidance = toUserGuidance(error);

    expect(guidance).toEqual({
      reason: "E001: Failed",
      hint: "Try this fix",
    });
  });

  it("Error が渡された場合、メッセージと既定ヒントが返却されること。", () => {
    const guidance = toUserGuidance(new Error("boom"));

    expect(guidance.reason).toBe("boom");
    expect(guidance.hint).toContain("permissions");
  });

  it("unknown が渡された場合、Unknown error と既定ヒントが返却されること。", () => {
    const guidance = toUserGuidance("unknown");

    expect(guidance).toEqual({
      reason: "Unknown error",
      hint: "Check the detailed logs and run the command again if the issue is resolved.",
    });
  });
});
