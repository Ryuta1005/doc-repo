import { describe, expect, it } from "vitest";

import { formatResultMessage } from "./formatResultMessage.js";

describe("formatResultMessage.ts", () => {
  it("serve success の場合、serve/watch 行を返すこと。", () => {
    const text = formatResultMessage({
      status: "watching",
      exitCode: 0,
      publicUrl: "http://localhost:4000",
      steps: [
        { step: "start-server", status: "success", message: "ok", durationMs: 10 },
        { step: "start-watch", status: "success", message: "ok", durationMs: 10 },
      ],
      failures: [],
    });

    expect(text).toContain("[doc-repo] serve: listening on http://localhost:4000");
    expect(text).toContain("[doc-repo] watch: started");
    expect(text).toContain("[doc-repo] watch: auto-reload enabled (SSE)");
  });

  it("serve failure の場合、error と対処を返すこと。", () => {
    const text = formatResultMessage({
      status: "failed",
      exitCode: 1,
      steps: [{ step: "start-server", status: "failure", message: "ng", durationMs: 5 }],
      failures: [
        {
          type: "unknown",
          message: "INITIAL_GENERATE_FAILED: x",
          hint: "fix",
          exitCode: 1,
        },
      ],
    });

    expect(text).toContain("[doc-repo] error: INITIAL_GENERATE_FAILED: x");
    expect(text).toContain("Hint: fix");
  });
});
