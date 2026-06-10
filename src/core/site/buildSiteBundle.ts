import fs from "fs-extra";

import { convertMarkdown } from "../parser/convertMarkdown.js";
import { AppError } from "../../shared/errors.js";
import type { MarkdownFile, SiteBundle, TreeDirNode, TreeFileNode, TreeNode } from "../../shared/types.js";

interface MutableDir {
  type: "dir";
  name: string;
  dirs: Map<string, MutableDir>;
  files: TreeFileNode[];
}

const createDir = (name: string): MutableDir => ({
  type: "dir",
  name,
  dirs: new Map<string, MutableDir>(),
  files: [],
});

const finalize = (node: MutableDir): TreeNode[] => {
  const childDirs: TreeDirNode[] = [...node.dirs.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((dir) => ({
      type: "dir",
      name: dir.name,
      children: finalize(dir),
    }));

  const childFiles: TreeFileNode[] = node.files.sort((a, b) => a.name.localeCompare(b.name));
  return [...childDirs, ...childFiles];
};

const addFileToTree = (root: MutableDir, relativePath: string, id: string): void => {
  const segments = relativePath.split("/");
  const fileName = segments.pop() ?? relativePath;

  let cursor = root;
  for (const segment of segments) {
    if (!cursor.dirs.has(segment)) {
      cursor.dirs.set(segment, createDir(segment));
    }
    cursor = cursor.dirs.get(segment)!;
  }

  cursor.files.push({
    type: "file",
    name: fileName,
    id,
  });
};

export const buildSiteBundle = async (files: MarkdownFile[]): Promise<SiteBundle> => {
  const pages = [] as SiteBundle["pages"];
  const root = createDir("root");
  // 参照画像一覧を集約して重複を排除する。
  const allReferencedImages = new Map<string, SiteBundle["referencedImages"][number]>();

  // 実在する全ページのID集合を先に構築し、リンク解決の唯一の正とする。
  const knownIds = new Set(files.map((file) => file.relativePath.replace(/\.md$/i, "")));

  // ベース名 → ID。同名が複数ある場合は曖昧なので除外し、一意なものだけ救済対象にする。
  const basenameCounts = new Map<string, number>();
  const basenameToId = new Map<string, string>();
  for (const id of knownIds) {
    const basename = id.split("/").pop() ?? id;
    basenameCounts.set(basename, (basenameCounts.get(basename) ?? 0) + 1);
    basenameToId.set(basename, id);
  }
  const uniqueBasenames = new Map<string, string>();
  for (const [basename, count] of basenameCounts) {
    if (count === 1) {
      uniqueBasenames.set(basename, basenameToId.get(basename)!);
    }
  }

  for (const file of files) {
    const id = file.relativePath.replace(/\.md$/i, "");
    let converted: { title: string; html: string; referencedImages: string[] };

    try {
      const source = await fs.readFile(file.absolutePath, "utf8");
      converted = convertMarkdown(source, file.relativePath, knownIds, uniqueBasenames);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new AppError(
        `Markdown の読み取りまたは変換に失敗しました: ${file.relativePath} (${detail})`,
        "MARKDOWN_READ_OR_CONVERT_FAILED",
        `対象ファイルを確認してください: ${file.relativePath}`,
      );
    }

    for (const repoRelativePath of converted.referencedImages) {
      allReferencedImages.set(repoRelativePath, { repoRelativePath });
    }

    pages.push({
      id,
      title: converted.title,
      relativePath: file.relativePath,
      html: converted.html,
    });

    addFileToTree(root, file.relativePath, id);
  }

  return {
    pages,
    tree: finalize(root),
    referencedImages: Array.from(allReferencedImages.values()),
  };
};
