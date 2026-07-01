import type {
  MarkdownEditorBlockNode,
  MarkdownEditorInlineNode,
  MarkdownEditorDocument,
  MarkdownEditorListItemContentNode,
  MarkdownEditorListItemNode,
  MarkdownEditorMarkType,
} from "./parseEditableMarkdown.js";

export interface SerializeEditableMarkdownOptions {
  newlineStyle: "lf" | "crlf";
  hasTrailingNewline: boolean;
}

const escapeText = (value: string): string => {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/#/g, "\\#")
    .replace(/`/g, "\\`");
};

const wrapMarks = (value: string, marks: MarkdownEditorMarkType[]): string => {
  if (!marks.length) {
    return value;
  }

  if (marks.includes("code")) {
    return `\`${value}\``;
  }

  if (marks.includes("bold") && marks.includes("italic")) {
    return `***${value}***`;
  }

  if (marks.includes("strike")) {
    return `~~${value}~~`;
  }

  if (marks.includes("bold")) {
    return `**${value}**`;
  }

  if (marks.includes("italic")) {
    return `*${value}*`;
  }

  return value;
};

const serializeInline = (nodes: MarkdownEditorInlineNode[] | undefined): string => {
  if (!nodes || nodes.length === 0) {
    return "";
  }

  return nodes
    .map((node) => {
      if (node.type === "hardBreak") {
        return "  \n";
      }

      if (node.type !== "text" || typeof node.text !== "string") {
        return "";
      }

      const marks = node.marks?.map((mark) => mark.type) ?? [];
      if (marks.includes("code")) {
        return wrapMarks(node.text, marks);
      }
      return wrapMarks(escapeText(node.text), marks);
    })
    .join("");
};

const indentLines = (value: string, indent: string): string => {
  return value
    .split(/\r?\n/)
    .map((line) => `${indent}${line}`)
    .join("\n");
};

const serializeListItemContent = (node: MarkdownEditorListItemContentNode, depth: number): string => {
  if (node.type === "paragraph") {
    return indentLines(serializeInline(node.content), "  ".repeat(depth + 1));
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return serializeList(node, depth + 1);
  }

  return "";
};

const serializeListItem = (item: MarkdownEditorListItemNode, marker: string, depth: number): string => {
  const content = item.content ?? [];
  const firstParagraphIndex = content.findIndex((node) => node.type === "paragraph");
  const firstParagraph = firstParagraphIndex >= 0 ? content[firstParagraphIndex] : null;
  const indent = "  ".repeat(depth);
  const firstLine = `${indent}${marker} ${
    firstParagraph?.type === "paragraph" ? serializeInline(firstParagraph.content) : ""
  }`.trimEnd();

  const rest = content
    .filter((_, index) => index !== firstParagraphIndex)
    .map((node) => serializeListItemContent(node, depth))
    .filter((text) => text.length > 0);

  return [firstLine, ...rest].join("\n");
};

const serializeList = (
  node: Extract<MarkdownEditorBlockNode, { type: "bulletList" | "orderedList" }>,
  depth = 0,
): string => {
  const start = node.type === "orderedList" ? (node.attrs?.start ?? 1) : 1;
  return node.content
    .map((item, index) => {
      const marker = node.type === "orderedList" ? `${start + index}.` : "-";
      return serializeListItem(item, marker, depth);
    })
    .join("\n");
};

const serializeBlock = (node: MarkdownEditorBlockNode): string => {
  if (node.type === "rawMarkdown") {
    return node.attrs.rawMarkdown;
  }

  if (node.type === "horizontalRule") {
    return "---";
  }

  if (node.type === "bulletList") {
    return serializeList(node);
  }

  if (node.type === "orderedList") {
    return serializeList(node);
  }

  if (node.type === "blockquote") {
    const lines = node.content
      .map((paragraph) => serializeInline(paragraph.content))
      .flatMap((text) => text.split(/\r?\n/))
      .map((line) => `> ${line}`);
    return lines.join("\n");
  }

  if (node.type === "codeBlock") {
    const language = node.attrs?.language ?? "";
    const text = node.content?.map((part) => part.text).join("") ?? "";
    return `\`\`\`${language}\n${text}\`\`\``;
  }

  const prefix = node.type === "heading" ? `${"#".repeat(node.attrs.level)} ` : "";
  const inline = serializeInline(node.content);
  return `${prefix}${inline}`;
};

const trimBoundaryNewlines = (value: string): string => {
  return value.replace(/^(?:\r?\n)+/, "").replace(/(?:\r?\n)+$/, "");
};

const isEmptyParagraph = (node: MarkdownEditorBlockNode): boolean => {
  return node.type === "paragraph" && (!node.content || node.content.length === 0);
};

const serializeBlocks = (blocks: MarkdownEditorBlockNode[], newline: string): string => {
  const meaningfulStart = blocks.findIndex((node) => !isEmptyParagraph(node));
  if (meaningfulStart < 0) {
    return "";
  }

  let meaningfulEnd = blocks.length - 1;
  while (meaningfulEnd > meaningfulStart && isEmptyParagraph(blocks[meaningfulEnd])) {
    meaningfulEnd -= 1;
  }

  let content = trimBoundaryNewlines(serializeBlock(blocks[meaningfulStart]));
  let pendingEmptyParagraphs = 0;

  for (let index = meaningfulStart + 1; index <= meaningfulEnd; index += 1) {
    const block = blocks[index];

    if (isEmptyParagraph(block)) {
      pendingEmptyParagraphs += 1;
      continue;
    }

    content += `${newline.repeat(2 + pendingEmptyParagraphs)}${trimBoundaryNewlines(serializeBlock(block))}`;
    pendingEmptyParagraphs = 0;
  }

  return content;
};

export const serializeEditableMarkdown = (
  document: MarkdownEditorDocument,
  options: SerializeEditableMarkdownOptions,
): string => {
  const newline = options.newlineStyle === "crlf" ? "\r\n" : "\n";
  const blocks = document.content ?? [];
  const content = serializeBlocks(blocks, newline);

  if (options.hasTrailingNewline) {
    return content.endsWith(newline) ? content : `${content}${newline}`;
  }

  return content.replace(new RegExp(`${newline}$`), "");
};
