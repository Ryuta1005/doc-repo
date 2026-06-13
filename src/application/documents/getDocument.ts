import fs from "fs-extra";

import { convertMarkdown } from "../../core/parser/convertMarkdown.js";
import { scanMarkdown } from "../../core/scanner/scanMarkdown.js";
import { AppError } from "../../shared/errors.js";
import { normalizeDocumentIdentifier, validateDocumentIdentifier } from "../../shared/documentIdentifier.js";

export interface GetDocumentInput {
  rootDir: string;
  identifier: string;
}

export interface DocumentDetailDto {
  identifier: string;
  title: string;
  html: string;
  markdown: string;
  metadata: Record<string, never>;
}

export const getDocument = async (input: GetDocumentInput): Promise<DocumentDetailDto> => {
  const validated = validateDocumentIdentifier(input.identifier);
  if (!validated.ok || !validated.value) {
    throw new AppError("文書識別子が不正です。", "INVALID_REQUEST", "識別子形式を確認してください。");
  }

  const normalizedIdentifier = normalizeDocumentIdentifier(validated.value);
  const markdownFiles = await scanMarkdown(input.rootDir, input.rootDir);
  const knownIds = new Set(
    markdownFiles.map((file) => normalizeDocumentIdentifier(file.relativePath).replace(/\.md$/i, "")),
  );

  const markdownFile = markdownFiles.find(
    (file) => normalizeDocumentIdentifier(file.relativePath) === normalizedIdentifier,
  );
  if (!markdownFile || !(await fs.pathExists(markdownFile.absolutePath))) {
    throw new AppError("対象文書が見つかりません。", "DOCUMENT_NOT_FOUND", "文書パスを確認してください。");
  }

  const source = await fs.readFile(markdownFile.absolutePath, "utf8");
  const converted = convertMarkdown(source, normalizedIdentifier, knownIds);

  return {
    identifier: normalizedIdentifier,
    title: converted.title,
    html: converted.html,
    markdown: source,
    metadata: {},
  };
};
