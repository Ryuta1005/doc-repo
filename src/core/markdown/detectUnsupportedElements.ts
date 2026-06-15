import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

import type { SaveWarning } from "../../shared/types.js";

export interface UnsupportedSegment {
  segmentId: string;
  sourceRange: {
    startLine: number;
    endLine: number;
  };
  rawMarkdown: string;
  preservationMode: "pass-through" | "degraded";
}

export interface UnsupportedDetectionResult {
  hasUnsupportedSegments: boolean;
  warnings: SaveWarning[];
  unsupportedSegments: UnsupportedSegment[];
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

const supportedBlockTypes = new Set([
  "hr",
  "softbreak",
  "bullet_list_open",
  "bullet_list_close",
  "ordered_list_open",
  "ordered_list_close",
  "list_item_open",
  "list_item_close",
  "blockquote_open",
  "blockquote_close",
  "code_block",
  "fence",
  "hr",
  "bullet_list_open",
  "bullet_list_close",
  "ordered_list_open",
  "ordered_list_close",
  "list_item_open",
  "list_item_close",
]);

const extractSourceSlice = (source: string, startLine: number, endLine: number): string => {
  const lines = source.split(/\r?\n/);
  return lines.slice(startLine, endLine).join("\n");
};

const isSupportedInline = (children: Token[] | null | undefined): boolean => {
  if (!children) {
    return true;
  }

  return children.every((child) => supportedInlineTokenTypes.has(child.type));
};

export const detectUnsupportedElements = (source: string): UnsupportedDetectionResult => {
  const tokens = md.parse(source, {});
  const unsupportedSegments: UnsupportedSegment[] = [];
  const consumedRanges: Array<{ startLine: number; endLine: number }> = [];

  const claimRange = (startLine: number, endLine: number): boolean => {
    const overlaps = consumedRanges.some((range) => startLine < range.endLine && endLine > range.startLine);
    if (overlaps) {
      return false;
    }
    consumedRanges.push({ startLine, endLine });
    return true;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

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
        rawMarkdown: extractSourceSlice(source, startLine, endLine),
        preservationMode: "pass-through",
      });
      continue;
    }

    if (token.type === "paragraph_open" || token.type === "heading_open") {
      const inline = tokens[index + 1];
      if (inline?.type !== "inline" || !isSupportedInline(inline.children)) {
        const startLine = token.map?.[0] ?? 0;
        const endLine = token.map?.[1] ?? startLine + 1;
        if (!claimRange(startLine, endLine)) {
          continue;
        }
        unsupportedSegments.push({
          segmentId: `segment-${unsupportedSegments.length + 1}`,
          sourceRange: { startLine, endLine },
          rawMarkdown: extractSourceSlice(source, startLine, endLine),
          preservationMode: "pass-through",
        });
      } else if (token.map) {
        claimRange(token.map[0], token.map[1]);
      }
      continue;
    }

    if (token.type === "inline" || token.type === "paragraph_close" || token.type === "heading_close") {
      continue;
    }

    if (supportedBlockTypes.has(token.type)) {
      if (token.map) {
        claimRange(token.map[0], token.map[1]);
      }
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
        rawMarkdown: extractSourceSlice(source, startLine, endLine),
        preservationMode: "pass-through",
      });
    }
  }

  return {
    hasUnsupportedSegments: unsupportedSegments.length > 0,
    warnings: unsupportedSegments.length
      ? [
          {
            code: "UNSUPPORTED_SEGMENT_DETECTED",
            message:
              "Unsupported elements are included. Original text is preserved where possible, but content may change if it cannot be preserved.",
          },
        ]
      : [],
    unsupportedSegments,
  };
};
