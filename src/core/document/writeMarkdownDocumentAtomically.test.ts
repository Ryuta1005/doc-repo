import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { writeMarkdownDocumentAtomically } from "./writeMarkdownDocumentAtomically.js";

describe("writeMarkdownDocumentAtomically", () => {
  const tempRoot = path.resolve(".tmp-save-tests");

  afterEach(async () => {
    await fs.remove(tempRoot);
  });

  it("writes lf content and preserves trailing newline choice", async () => {
    const targetPath = path.join(tempRoot, "docs", "note.md");

    await writeMarkdownDocumentAtomically({
      filePath: targetPath,
      markdownContent: "# Title\n\nBody\n",
      newlineStyle: "lf",
      hasTrailingNewline: true,
    });

    const data = await fs.readFile(targetPath, "utf8");
    expect(data).toBe("# Title\n\nBody\n");
  });

  it("writes crlf content without a trailing newline", async () => {
    const targetPath = path.join(tempRoot, "docs", "note.md");

    await writeMarkdownDocumentAtomically({
      filePath: targetPath,
      markdownContent: "# Title\n\nBody\n",
      newlineStyle: "crlf",
      hasTrailingNewline: false,
    });

    const data = await fs.readFile(targetPath);
    expect(data.includes(Buffer.from("\r\n"))).toBe(true);
    expect(data.at(-1)).not.toBe(0x0a);
  });
});
