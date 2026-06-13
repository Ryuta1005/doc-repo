import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

import { detectRoot } from "../scanner/detectRoot.js";
import { scanMarkdown } from "../scanner/scanMarkdown.js";
import { buildSiteBundle } from "./buildSiteBundle.js";
import { renderPages } from "./renderPages.js";
import { copyAssets } from "./copyAssets.js";
import { atomicPublish } from "./atomicPublish.js";
import { AppError, toUserGuidance } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";
import type { GenerationContext, GenerationResult } from "../../shared/types.js";

const resolveTargetDir = async (rootDir: string, scopePath?: string): Promise<string> => {
  if (!scopePath) {
    return rootDir;
  }

  const targetDir = path.resolve(rootDir, scopePath);
  const relativeToRoot = path.relative(rootDir, targetDir);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new AppError(
      "指定した生成範囲がリポジトリルート配下ではありません。",
      "SCOPE_OUTSIDE_ROOT",
      "リポジトリルートからの相対パスで、配下のフォルダを指定してください。",
    );
  }

  if (!(await fs.pathExists(targetDir))) {
    throw new AppError(
      `指定した生成範囲が見つかりません: ${scopePath}`,
      "SCOPE_NOT_FOUND",
      "存在するフォルダを、リポジトリルートからの相対パスで指定してください。",
    );
  }

  const stat = await fs.stat(targetDir);
  if (!stat.isDirectory()) {
    throw new AppError(
      `指定した生成範囲はフォルダではありません: ${scopePath}`,
      "SCOPE_NOT_DIRECTORY",
      "生成範囲にはフォルダを指定してください。",
    );
  }

  return targetDir;
};

const resolveRequestedTargetPath = (rootDir: string, scopePath?: string): string => {
  if (!scopePath) {
    return rootDir;
  }

  return path.resolve(rootDir, scopePath);
};

const resolveTemplatesDir = async (cwd: string): Promise<string> => {
  const cwdTemplatesDir = path.resolve(cwd, "templates");
  if (await fs.pathExists(cwdTemplatesDir)) {
    return cwdTemplatesDir;
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const bundledTemplatesDir = path.resolve(moduleDir, "../../../templates");
  if (await fs.pathExists(bundledTemplatesDir)) {
    return bundledTemplatesDir;
  }

  throw new AppError(
    "テンプレートディレクトリが見つかりません。",
    "TEMPLATE_MISSING",
    "プロジェクトルートに templates/ が存在するか、パッケージに templates/ が同梱されていることを確認してください。",
  );
};

export const generateSite = async (context: GenerationContext): Promise<GenerationResult> => {
  const logger = createLogger();
  const warnings: string[] = [];
  let outputDir = path.join(path.resolve(context.cwd), ".doc-repo");
  let targetPath = path.resolve(context.cwd);

  try {
    let rootDir: string;
    let usedFallback = false;

    if (context.resolvedRootDir) {
      rootDir = context.resolvedRootDir;
    } else {
      const detected = await detectRoot(context.cwd);
      rootDir = detected.detectedRoot;
      usedFallback = detected.usedFallback;
    }

    outputDir = path.join(rootDir, ".doc-repo");

    const stagingDir = path.join(path.resolve(context.cwd), `.doc-repo.__staging__.${Date.now()}`);
    targetPath = resolveRequestedTargetPath(rootDir, context.scopePath);
    const targetDir = await resolveTargetDir(rootDir, context.scopePath);
    const templatesDir = await resolveTemplatesDir(context.cwd);

    if (usedFallback) {
      warnings.push("Git ルートが見つからなかったため、カレントディレクトリを対象に処理しました。");
    }

    const markdownFiles = await scanMarkdown(rootDir, targetDir, {
      includePatterns: context.includePatterns,
      excludePatterns: context.excludePatterns,
    });
    if (markdownFiles.length === 0) {
      warnings.push("Markdown ファイルが 0 件でした。空サイトを生成しました。");
    }

    logger.info(`対象ルート: ${rootDir}`);
    logger.info(`生成対象: ${targetDir}`);
    logger.info(`検出Markdown数: ${markdownFiles.length}`);

    await fs.ensureDir(stagingDir);

    const bundle = await buildSiteBundle(markdownFiles, context.siteName);
    await renderPages(templatesDir, stagingDir, bundle);
    // 変換結果に含まれる参照画像情報を使って画像アセットを配置する。
    await copyAssets(templatesDir, stagingDir, rootDir, bundle.referencedImages);

    await atomicPublish(stagingDir, outputDir);

    return {
      status: "success",
      exitCode: 0,
      outputDir,
      targetPath,
      markdownFileCount: markdownFiles.length,
      message: "ドキュメントサイトの生成に成功しました。",
      warnings,
    };
  } catch (error) {
    const guidance = toUserGuidance(error);

    logger.error(guidance.reason);

    return {
      status: "failure",
      exitCode: 1,
      outputDir,
      targetPath,
      markdownFileCount: 0,
      message: "ドキュメントサイトの生成に失敗しました。",
      warnings,
      errorReason: guidance.reason,
      hint: guidance.hint,
    };
  }
};
