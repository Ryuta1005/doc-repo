import type {
  MarkdownEditorBlockNode,
  MarkdownEditorInlineNode,
  MarkdownEditorDocument,
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

      const marks = node.marks?.map((mark) => mark.type) ?? [];
      if (marks.includes("code")) {
        return wrapMarks(node.text, marks);
      }
      return wrapMarks(escapeText(node.text), marks);
    })
    .join("");
};

const serializeBlock = (node: MarkdownEditorBlockNode): string => {
  if (node.type === "rawMarkdown") {
    return node.attrs.rawMarkdown;
  }

  if (node.type === "horizontalRule") {
    return "---";
  }

  if (node.type === "bulletList") {
    return node.content
      .map((item) => {
        const text = item.content.map((paragraph) => serializeInline(paragraph.content)).join("\n");
        return `- ${text}`;
      })
      .join("\n");
  }

  if (node.type === "orderedList") {
    const start = node.attrs?.start ?? 1;
    return node.content
      .map((item, index) => {
        const text = item.content.map((paragraph) => serializeInline(paragraph.content)).join("\n");
        return `${start + index}. ${text}`;
      })
      .join("\n");
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

export const serializeEditableMarkdown = (
  document: MarkdownEditorDocument,
  options: SerializeEditableMarkdownOptions,
): string => {
  const newline = options.newlineStyle === "crlf" ? "\r\n" : "\n";
  const blocks = document.content ?? [];
  const content = blocks
    .map((node) => trimBoundaryNewlines(serializeBlock(node)))
    .filter((node) => node.length > 0)
    .join(`${newline}${newline}`);

  if (options.hasTrailingNewline) {
    return content.endsWith(newline) ? content : `${content}${newline}`;
  }

  return content.replace(new RegExp(`${newline}$`), "");
};
