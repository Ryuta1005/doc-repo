import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { mapToHttpError, toHttpErrorPayload } from "../../src/presentation/http/errors/httpErrorMapper.js";
import { createHttpBoundaryPipeline } from "../../src/presentation/http/createServer.js";
import { AppError } from "../../src/shared/errors.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-http-errors-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("http error contract", () => {
  it("maps INVALID_REQUEST app errors to 400 payload contract", () => {
    const error = mapToHttpError(new AppError("invalid path", "INVALID_REQUEST", "fix path"));
    const payload = toHttpErrorPayload(error.code, error.message);

    expect(error).toMatchObject({ status: 400, code: "INVALID_REQUEST" });
    expect(payload).toEqual({ error: { code: "INVALID_REQUEST", message: "invalid path" } });
  });

  it("maps DOCUMENT_NOT_FOUND app errors to 404 payload contract", () => {
    const error = mapToHttpError(new AppError("missing document", "DOCUMENT_NOT_FOUND", "choose another"));
    const payload = toHttpErrorPayload(error.code, error.message);

    expect(error).toMatchObject({ status: 404, code: "DOCUMENT_NOT_FOUND" });
    expect(payload).toEqual({ error: { code: "DOCUMENT_NOT_FOUND", message: "missing document" } });
  });

  it("maps unknown errors to 500 payload contract without exposing internals", () => {
    const error = mapToHttpError(new Error("boom"));
    const payload = toHttpErrorPayload(error.code, error.message);

    expect(error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
    expect(payload).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
  });

  it("maps save target errors to the save failure codes", () => {
    const invalidTarget = mapToHttpError(new AppError("bad target", "SAVE_TARGET_INVALID", "fix target"));
    const unwritableTarget = mapToHttpError(new AppError("locked", "SAVE_TARGET_UNWRITABLE", "fix access"));
    const transientIo = mapToHttpError(new AppError("temp failure", "SAVE_IO_TEMPORARY", "retry"));

    expect(invalidTarget).toMatchObject({ status: 400, code: "SAVE_TARGET_INVALID" });
    expect(unwritableTarget).toMatchObject({ status: 404, code: "SAVE_TARGET_UNWRITABLE" });
    expect(transientIo).toMatchObject({ status: 500, code: "SAVE_IO_TEMPORARY" });
  });

  it("maps create-document app errors to create failure codes", () => {
    const invalidInput = mapToHttpError(new AppError("bad filename", "INVALID_INPUT", "fix filename"));
    const outOfScope = mapToHttpError(new AppError("outside root", "OUT_OF_SCOPE", "fix path"));
    const alreadyExists = mapToHttpError(new AppError("duplicate", "ALREADY_EXISTS", "rename"));

    expect(invalidInput).toMatchObject({ status: 400, code: "INVALID_INPUT" });
    expect(outOfScope).toMatchObject({ status: 400, code: "OUT_OF_SCOPE" });
    expect(alreadyExists).toMatchObject({ status: 409, code: "ALREADY_EXISTS" });
  });

  it("rejects save when include/exclude rules are not satisfied", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "note.md"), "# note\n");
    await fs.outputFile(path.join(rootDir, "docs", "draft", "draft.md"), "# draft\n");

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/draft/**"],
    });

    await expect(
      pipeline.saveDocument({
        identifier: "outside/note.md",
        markdownContent: "# outside\n",
        options: { newlineStyle: "lf", hasTrailingNewline: true },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      error: { category: "invalid-target", code: "SAVE_TARGET_INVALID", retryable: false },
    });

    await expect(
      pipeline.saveDocument({
        identifier: "docs/draft/draft.md",
        markdownContent: "# blocked\n",
        options: { newlineStyle: "lf", hasTrailingNewline: true },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      error: { category: "invalid-target", code: "SAVE_TARGET_INVALID", retryable: false },
    });
  });

  it("rejects create when include/exclude rules are not satisfied", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "guide.md"), "# guide\n");
    await fs.ensureDir(path.join(rootDir, "docs", "draft"));

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/draft/**"],
    });

    await expect(
      pipeline.createDocument({
        anchor: { nodeType: "folder", nodePath: "docs/draft" },
        filename: "blocked",
      }),
    ).resolves.toMatchObject({
      status: "rejected",
      error: { code: "OUT_OF_SCOPE", retryable: false },
    });
  });
});
