import { describe, expect, it } from "vitest";

import { parseEditableMarkdown } from "./parseEditableMarkdown.js";
import { serializeEditableMarkdown } from "./serializeEditableMarkdown.js";

describe("serializeEditableMarkdown", () => {
  it("keeps unsupported raw markdown blocks via pass-through nodes", () => {
    const source = ["# Title", "", '<div class="note">raw html</div>', "", "body"].join("\n");
    const parsed = parseEditableMarkdown(source);

    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(serialized).toContain('<div class="note">raw html</div>');
    expect(serialized).toContain("# Title");
  });

  it("preserves line ending intent and trailing newline choice", () => {
    const source = "# Title\r\n\r\nBody\r\n";
    const parsed = parseEditableMarkdown(source);

    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: "crlf",
      hasTrailingNewline: true,
    });

    expect(serialized).toContain("\r\n");
    expect(serialized.endsWith("\r\n")).toBe(true);
  });

  it("does not crash when editor JSON omits content", () => {
    const serialized = serializeEditableMarkdown(
      { type: "doc" } as unknown as Parameters<typeof serializeEditableMarkdown>[0],
      { newlineStyle: "lf", hasTrailingNewline: false },
    );

    expect(serialized).toBe("");
  });

  it("preserves empty paragraphs created in the editor as intentional blank lines", () => {
    const serialized = serializeEditableMarkdown(
      {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "あああ" }] },
          { type: "paragraph", content: [] },
          { type: "paragraph", content: [] },
          { type: "paragraph", content: [] },
          { type: "paragraph", content: [{ type: "text", text: "あああ" }] },
        ],
      },
      { newlineStyle: "lf", hasTrailingNewline: false },
    );

    expect(serialized).toBe(["あああ", "", "", "", "", "あああ"].join("\n"));
  });

  it("preserves repeated blank lines from existing markdown on round-trip", () => {
    const source = ["あああ", "", "", "", "", "あああ"].join("\n");
    const parsed = parseEditableMarkdown(source);

    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(serialized).toBe(source);
  });

  it("does not turn an empty editor document into blank markdown", () => {
    const serialized = serializeEditableMarkdown(
      {
        type: "doc",
        content: [{ type: "paragraph", content: [] }],
      },
      { newlineStyle: "lf", hasTrailingNewline: false },
    );

    expect(serialized).toBe("");
  });

  it("does not duplicate unsupported blocks on round-trip", () => {
    const source = [
      "# doc-repo",
      "",
      "> [!WARNING]",
      "> `doc-repo` is currently in alpha.",
      "",
      "- first item",
      "- second item",
      "",
      "| A | B |",
      "| - | - |",
      "| 1 | 2 |",
    ].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect((serialized.match(/\[!WARNING\]/g) ?? []).length).toBe(1);
    expect((serialized.match(/- first item/g) ?? []).length).toBe(1);
    expect((serialized.match(/\| A \| B \|/g) ?? []).length).toBe(1);
  });

  it("keeps repeated round-trip saves from increasing blank lines", () => {
    const source = [
      "# doc-repo",
      "",
      "intro paragraph",
      "",
      "> [!WARNING]",
      "> alpha note",
      "",
      "## Section",
      "",
      "body text",
    ].join("\n");

    const onceParsed = parseEditableMarkdown(source);
    const onceSerialized = serializeEditableMarkdown(onceParsed.document, {
      newlineStyle: onceParsed.newlineStyle,
      hasTrailingNewline: onceParsed.hasTrailingNewline,
    });

    const twiceParsed = parseEditableMarkdown(onceSerialized);
    const twiceSerialized = serializeEditableMarkdown(twiceParsed.document, {
      newlineStyle: twiceParsed.newlineStyle,
      hasTrailingNewline: twiceParsed.hasTrailingNewline,
    });

    expect(twiceSerialized).toBe(onceSerialized);
    expect(twiceSerialized).not.toMatch(/\n{3,}/);
  });

  it("supports inline code inside editable paragraphs", () => {
    const source = "このページでは `doc-repo.config.json` の仕様を説明します。";

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toBe(source);
  });

  it("supports blockquote warning blocks as editable content", () => {
    const source = ["> [!WARNING]", "> `doc-repo` is currently in alpha."].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toContain("> [!WARNING]");
    expect(serialized).toContain("> `doc-repo` is currently in alpha.");
  });

  it("supports fenced code blocks as editable content", () => {
    const source = ["```ts", "console.log('hi')", "```"].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toContain("```ts");
    expect(serialized).toContain("console.log('hi')");
  });

  it("supports heading level 6", () => {
    const source = "###### heading 6";

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toBe(source);
  });

  it("supports strike text", () => {
    const source = "~~取り消し~~ テキスト";

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toBe(source);
  });

  it("supports bullet and ordered lists", () => {
    const source = ["- one", "- two", "", "1. first", "2. second"].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toContain("- one");
    expect(serialized).toContain("1. first");
  });

  it("supports horizontal rule", () => {
    const source = ["before", "", "---", "", "after"].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toContain("---");
  });

  it("keeps GitHub-compatible admonition markers inside blockquote", () => {
    const source = ["> [!NOTE]", "> message"].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toContain("> [!NOTE]");
    expect(serialized).toContain("> message");
  });

  it("round-trips code block created by editor model", () => {
    const source = ["```", "const a = 1", "```"].join("\n");

    const parsed = parseEditableMarkdown(source);
    const serialized = serializeEditableMarkdown(parsed.document, {
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
    });

    expect(parsed.unsupportedSegments).toHaveLength(0);
    expect(serialized).toContain("const a = 1");
    expect(serialized).toContain("```");
  });
});
