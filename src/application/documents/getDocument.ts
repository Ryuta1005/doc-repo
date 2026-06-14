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
    throw new AppError("Document identifier is invalid.", "INVALID_REQUEST", "Check the identifier format.");
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
    throw new AppError("Target document was not found.", "DOCUMENT_NOT_FOUND", "Check the document path.");
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
