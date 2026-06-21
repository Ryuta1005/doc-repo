import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

import type { SaveNewlineStyle, SaveWarning } from "../../shared/types.js";
import { detectUnsupportedElements, type UnsupportedSegment } from "./detectUnsupportedElements.js";

export type MarkdownEditorMarkType = "bold" | "italic" | "strike" | "code";

export interface MarkdownEditorMark {
  type: MarkdownEditorMarkType;
}

export interface MarkdownEditorTextNode {
  type: "text";
  text: string;
  marks?: MarkdownEditorMark[];
}

export interface MarkdownEditorHardBreakNode {
  type: "hardBreak";
}

export type MarkdownEditorInlineNode = MarkdownEditorTextNode | MarkdownEditorHardBreakNode;

export interface MarkdownEditorHeadingNode {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content: MarkdownEditorInlineNode[];
}

export interface MarkdownEditorParagraphNode {
  type: "paragraph";
  content: MarkdownEditorInlineNode[];
}

export interface MarkdownEditorListItemNode {
  type: "listItem";
  content: MarkdownEditorParagraphNode[];
}

export interface MarkdownEditorBulletListNode {
  type: "bulletList";
  content: MarkdownEditorListItemNode[];
}

export interface MarkdownEditorOrderedListNode {
  type: "orderedList";
  attrs?: { start?: number };
  content: MarkdownEditorListItemNode[];
}

export interface MarkdownEditorHorizontalRuleNode {
  type: "horizontalRule";
}

export interface MarkdownEditorBlockquoteNode {
  type: "blockquote";
  content: MarkdownEditorParagraphNode[];
}

export interface MarkdownEditorCodeBlockNode {
  type: "codeBlock";
  attrs?: { language?: string | null };
  content: MarkdownEditorTextNode[];
}

export interface MarkdownEditorRawNode {
  type: "rawMarkdown";
  attrs: { rawMarkdown: string; segmentId: string };
}

export type MarkdownEditorBlockNode =
  | MarkdownEditorHeadingNode
  | MarkdownEditorParagraphNode
  | MarkdownEditorBulletListNode
  | MarkdownEditorOrderedListNode
  | MarkdownEditorHorizontalRuleNode
  | MarkdownEditorBlockquoteNode
  | MarkdownEditorCodeBlockNode
  | MarkdownEditorRawNode;

export interface MarkdownEditorDocument {
  type: "doc";
  content: MarkdownEditorBlockNode[];
}

export interface ParseEditableMarkdownResult {
  document: MarkdownEditorDocument;
  warnings: SaveWarning[];
  unsupportedSegments: UnsupportedSegment[];
  newlineStyle: SaveNewlineStyle;
  hasTrailingNewline: boolean;
}

const md = new MarkdownIt({ html: true, linkify: false, typographer: false });

const supportedInlineTokenTypes = new Set([
  "text",
  "code_inline",
  "strong_open",
  "strong_close",
  "em_open",
  "em_close",
  "s_open",
  "s_close",
  "softbreak",
  "hardbreak",
]);

const buildLineOffsets = (source: string): number[] => {
  const offsets = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") {
      offsets.push(index + 1);
    }
  }
  return offsets;
};

const sliceLines = (source: string, startLine: number, endLine: number, lineOffsets: number[]): string => {
  const startOffset = lineOffsets[startLine] ?? source.length;
  const endOffset = lineOffsets[endLine] ?? source.length;
  return source.slice(startOffset, endOffset);
};

const hasTrailingNewline = (source: string): boolean => source.endsWith("\n") || source.endsWith("\r\n");

const detectNewlineStyle = (source: string): SaveNewlineStyle => {
  return source.includes("\r\n") ? "crlf" : "lf";
};

const isSupportedInline = (children: Token[] | null | undefined): boolean => {
  if (!children) {
    return true;
  }

  return children.every((child) => supportedInlineTokenTypes.has(child.type));
};

const toMarkArray = (marks: MarkdownEditorMarkType[]): MarkdownEditorMark[] | undefined => {
  if (!marks.length) {
    return undefined;
  }

  return marks.map((type) => ({ type }));
};

const parseInlineChildren = (children: Token[] | null | undefined): MarkdownEditorInlineNode[] | null => {
  if (!children || !isSupportedInline(children)) {
    return null;
  }

  const nodes: MarkdownEditorInlineNode[] = [];
  const marks: MarkdownEditorMarkType[] = [];

  for (const child of children) {
    if (child.type === "text") {
      if (child.content.length > 0) {
        nodes.push({ type: "text", text: child.content, marks: toMarkArray(marks) });
      }
      continue;
    }

    if (child.type === "code_inline") {
      nodes.push({ type: "text", text: child.content, marks: toMarkArray([...marks, "code"]) });
      continue;
    }

    if (child.type === "strong_open") {
      marks.push("bold");
      continue;
    }

    if (child.type === "strong_close") {
      const index = marks.lastIndexOf("bold");
      if (index >= 0) {
        marks.splice(index, 1);
      }
      continue;
    }

    if (child.type === "em_open") {
      marks.push("italic");
      continue;
    }

    if (child.type === "em_close") {
      const index = marks.lastIndexOf("italic");
      if (index >= 0) {
        marks.splice(index, 1);
      }
      continue;
    }

    if (child.type === "s_open") {
      marks.push("strike");
      continue;
    }

    if (child.type === "s_close") {
      const index = marks.lastIndexOf("strike");
      if (index >= 0) {
        marks.splice(index, 1);
      }
      continue;
    }

    if (child.type === "softbreak" || child.type === "hardbreak") {
      nodes.push({ type: "hardBreak" });
    }
  }

  return nodes;
};

export const parseEditableMarkdown = (source: string): ParseEditableMarkdownResult => {
  const tokens = md.parse(source, {});
  const lineOffsets = buildLineOffsets(source);
  const document: MarkdownEditorDocument = { type: "doc", content: [] };
  const unsupportedSegments: UnsupportedSegment[] = [];
  const consumedRanges: Array<{ startLine: number; endLine: number }> = [];
  let previousBlockEndLine: number | null = null;

  const claimRange = (startLine: number, endLine: number): boolean => {
    const overlaps = consumedRanges.some((range) => startLine < range.endLine && endLine > range.startLine);
    if (overlaps) {
      return false;
    }
    consumedRanges.push({ startLine, endLine });
    return true;
  };

  const appendBlock = (
    block: MarkdownEditorBlockNode,
    sourceRange?: { startLine: number; endLine: number },
  ): void => {
    if (sourceRange && previousBlockEndLine !== null) {
      const emptyParagraphCount = Math.max(0, sourceRange.startLine - previousBlockEndLine - 1);
      for (let count = 0; count < emptyParagraphCount; count += 1) {
        document.content.push({ type: "paragraph", content: [] });
      }
    }

    document.content.push(block);

    if (sourceRange) {
      previousBlockEndLine = sourceRange.endLine;
    }
  };

  const findMatchingCloseIndex = (startIndex: number): number => {
    const openType = tokens[startIndex]?.type;
    if (!openType || !openType.endsWith("_open")) {
      return startIndex;
    }

    const closeType = openType.replace(/_open$/, "_close");
    let depth = 0;

    for (let cursor = startIndex; cursor < tokens.length; cursor += 1) {
      const candidate = tokens[cursor];
      if (candidate.type === openType) {
        depth += 1;
        continue;
      }

      if (candidate.type === closeType) {
        depth -= 1;
        if (depth === 0) {
          return cursor;
        }
      }
    }

    return startIndex;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    // Own unsupported container blocks once (e.g. blockquote/list), so nested tokens do not duplicate ranges.
    if (
      token.nesting === 1 &&
      token.map &&
      token.type.endsWith("_open") &&
      token.type !== "heading_open" &&
      token.type !== "paragraph_open" &&
      token.type !== "blockquote_open" &&
      token.type !== "bullet_list_open" &&
      token.type !== "ordered_list_open"
    ) {
      const startLine = token.map[0];
      const endLine = token.map[1];
      if (!claimRange(startLine, endLine)) {
        continue;
      }

      unsupportedSegments.push({
        segmentId: `segment-${unsupportedSegments.length + 1}`,
        sourceRange: { startLine, endLine },
        rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
        preservationMode: "pass-through",
      });
      appendBlock(
        {
          type: "rawMarkdown",
          attrs: {
            rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
            segmentId: `segment-${unsupportedSegments.length}`,
          },
        },
        { startLine, endLine },
      );
      continue;
    }

    if ((token.type === "bullet_list_open" || token.type === "ordered_list_open") && token.map) {
      const closeIndex = findMatchingCloseIndex(index);
      const items: MarkdownEditorListItemNode[] = [];
      let supported = true;

      for (let cursor = index + 1; cursor < closeIndex; cursor += 1) {
        const listToken = tokens[cursor];
        if (listToken.type !== "list_item_open") {
          continue;
        }

        const itemClose = findMatchingCloseIndex(cursor);
        const itemTokens = tokens.slice(cursor + 1, itemClose);
        const paragraphs: MarkdownEditorParagraphNode[] = [];

        for (let innerIndex = 0; innerIndex < itemTokens.length; innerIndex += 1) {
          const innerToken = itemTokens[innerIndex];

          if (innerToken.type === "paragraph_open") {
            const inline = itemTokens[innerIndex + 1];
            const parsedInline = inline?.type === "inline" ? parseInlineChildren(inline.children) : null;
            if (!parsedInline) {
              supported = false;
              break;
            }
            paragraphs.push({ type: "paragraph", content: parsedInline });
            continue;
          }

          if (innerToken.type === "bullet_list_open" || innerToken.type === "ordered_list_open") {
            supported = false;
            break;
          }
        }

        if (!supported) {
          break;
        }

        if (paragraphs.length > 0) {
          items.push({ type: "listItem", content: paragraphs });
        }

        cursor = itemClose;
      }

      const startLine = token.map[0];
      const endLine = token.map[1];
      if (!claimRange(startLine, endLine)) {
        index = closeIndex;
        continue;
      }

      if (supported && items.length > 0) {
        if (token.type === "bullet_list_open") {
          appendBlock({ type: "bulletList", content: items }, { startLine, endLine });
        } else {
          const startAttr = Number(token.attrGet("start") ?? "1");
          appendBlock(
            {
              type: "orderedList",
              attrs: Number.isNaN(startAttr) ? undefined : { start: startAttr },
              content: items,
            },
            { startLine, endLine },
          );
        }
      } else {
        unsupportedSegments.push({
          segmentId: `segment-${unsupportedSegments.length + 1}`,
          sourceRange: { startLine, endLine },
          rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
          preservationMode: "pass-through",
        });
        appendBlock(
          {
            type: "rawMarkdown",
            attrs: {
              rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
              segmentId: `segment-${unsupportedSegments.length}`,
            },
          },
          { startLine, endLine },
        );
      }

      index = closeIndex;
      continue;
    }

    if (token.type === "hr") {
      if (token.map && !claimRange(token.map[0], token.map[1])) {
        continue;
      }
      appendBlock(
        { type: "horizontalRule" },
        token.map ? { startLine: token.map[0], endLine: token.map[1] } : undefined,
      );
      continue;
    }

    if (token.type === "blockquote_open" && token.map) {
      const closeIndex = findMatchingCloseIndex(index);
      const innerTokens = tokens.slice(index + 1, closeIndex);
      const paragraphs: MarkdownEditorParagraphNode[] = [];
      let supported = true;

      for (let innerIndex = 0; innerIndex < innerTokens.length; innerIndex += 1) {
        const innerToken = innerTokens[innerIndex];
        if (innerToken.type === "paragraph_open") {
          const inline = innerTokens[innerIndex + 1];
          const parsedInline = inline?.type === "inline" ? parseInlineChildren(inline.children) : null;
          if (!parsedInline) {
            supported = false;
            break;
          }
          paragraphs.push({ type: "paragraph", content: parsedInline });
        }
      }

      const startLine = token.map[0];
      const endLine = token.map[1];
      if (!claimRange(startLine, endLine)) {
        index = closeIndex;
        continue;
      }

      if (supported && paragraphs.length > 0) {
        appendBlock({ type: "blockquote", content: paragraphs }, { startLine, endLine });
      } else {
        unsupportedSegments.push({
          segmentId: `segment-${unsupportedSegments.length + 1}`,
          sourceRange: { startLine, endLine },
          rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
          preservationMode: "pass-through",
        });
        appendBlock(
          {
            type: "rawMarkdown",
            attrs: {
              rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
              segmentId: `segment-${unsupportedSegments.length}`,
            },
          },
          { startLine, endLine },
        );
      }

      index = closeIndex;
      continue;
    }

    if ((token.type === "fence" || token.type === "code_block") && token.map) {
      const startLine = token.map[0];
      const endLine = token.map[1];
      if (!claimRange(startLine, endLine)) {
        continue;
      }

      const language = token.info?.trim().split(/\s+/)[0] || null;
      appendBlock(
        {
          type: "codeBlock",
          attrs: { language },
          content: token.content ? [{ type: "text", text: token.content }] : [],
        },
        { startLine, endLine },
      );
      continue;
    }

    if (token.type === "heading_open") {
      const inline = tokens[index + 1];
      const level = Number(token.tag.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
      const parsedInline = inline?.type === "inline" ? parseInlineChildren(inline.children) : null;

      if (level >= 1 && level <= 6 && parsedInline) {
        if (token.map && !claimRange(token.map[0], token.map[1])) {
          continue;
        }
        appendBlock(
          {
            type: "heading",
            attrs: { level },
            content: parsedInline,
          },
          token.map ? { startLine: token.map[0], endLine: token.map[1] } : undefined,
        );
      } else if (token.map) {
        const startLine = token.map[0];
        const endLine = token.map[1];
        if (!claimRange(startLine, endLine)) {
          continue;
        }
        unsupportedSegments.push({
          segmentId: `segment-${unsupportedSegments.length + 1}`,
          sourceRange: { startLine, endLine },
          rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
          preservationMode: "pass-through",
        });
        appendBlock(
          {
            type: "rawMarkdown",
            attrs: {
              rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
              segmentId: `segment-${unsupportedSegments.length}`,
            },
          },
          { startLine, endLine },
        );
      }
      continue;
    }

    if (token.type === "paragraph_open") {
      const inline = tokens[index + 1];
      const parsedInline = inline?.type === "inline" ? parseInlineChildren(inline.children) : null;

      if (parsedInline) {
        if (token.map && !claimRange(token.map[0], token.map[1])) {
          continue;
        }
        appendBlock(
          {
            type: "paragraph",
            content: parsedInline,
          },
          token.map ? { startLine: token.map[0], endLine: token.map[1] } : undefined,
        );
      } else if (token.map) {
        const startLine = token.map[0];
        const endLine = token.map[1];
        if (!claimRange(startLine, endLine)) {
          continue;
        }
        unsupportedSegments.push({
          segmentId: `segment-${unsupportedSegments.length + 1}`,
          sourceRange: { startLine, endLine },
          rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
          preservationMode: "pass-through",
        });
        appendBlock(
          {
            type: "rawMarkdown",
            attrs: {
              rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
              segmentId: `segment-${unsupportedSegments.length}`,
            },
          },
          { startLine, endLine },
        );
      }
      continue;
    }

    if (token.type === "inline" || token.type === "heading_close" || token.type === "paragraph_close") {
      continue;
    }

    if (token.map) {
      const startLine = token.map[0];
      const endLine = token.map[1];
      if (!claimRange(startLine, endLine)) {
        continue;
      }
      unsupportedSegments.push({
        segmentId: `segment-${unsupportedSegments.length + 1}`,
        sourceRange: { startLine, endLine },
        rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
        preservationMode: "pass-through",
      });
      appendBlock(
        {
          type: "rawMarkdown",
          attrs: {
            rawMarkdown: sliceLines(source, startLine, endLine, lineOffsets),
            segmentId: `segment-${unsupportedSegments.length}`,
          },
        },
        { startLine, endLine },
      );
    }
  }

  const detection = detectUnsupportedElements(source);

  return {
    document,
    warnings: detection.warnings,
    unsupportedSegments: detection.unsupportedSegments.length ? detection.unsupportedSegments : unsupportedSegments,
    newlineStyle: detectNewlineStyle(source),
    hasTrailingNewline: hasTrailingNewline(source),
  };
};
