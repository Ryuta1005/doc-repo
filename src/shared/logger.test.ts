import { describe, expect, it, vi } from "vitest";

import { createLogger } from "./logger.js";

describe("logger.ts", () => {
  it("info の場合、[doc-repo:info] プレフィックス付きで console.log に出力されること。", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const logger = createLogger();
    logger.info("message");

    expect(spy).toHaveBeenCalledWith("[doc-repo:info] message");
    spy.mockRestore();
  });

  it("error の場合、[doc-repo:error] プレフィックス付きで console.error に出力されること。", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const logger = createLogger();
    logger.error("message");

    expect(spy).toHaveBeenCalledWith("[doc-repo:error] message");
    spy.mockRestore();
  });
});
