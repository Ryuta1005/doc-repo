import path from "node:path";
import fs from "fs-extra";
import type { ReferencedImage } from "../../shared/types.js";

const ASSET_FILES = ["styles.css", "app.js"];

export const copyAssets = async (
  templatesDir: string,
  stagingDir: string,
  rootDir?: string,
  referencedImages?: ReferencedImage[],
): Promise<void> => {
  // テンプレート資産をコピー
  for (const file of ASSET_FILES) {
    await fs.copyFile(path.join(templatesDir, file), path.join(stagingDir, file));
  }

  // 変換時に収集した参照画像を出力先へコピーする。
  if (rootDir && referencedImages && referencedImages.length > 0) {
    for (const img of referencedImages) {
      const srcPath = path.join(rootDir, img.repoRelativePath);
      const destPath = path.join(stagingDir, "assets", img.repoRelativePath);

      // ファイルが実在し、かつ rootDir 配下にある場合のみコピー
      if (await fs.pathExists(srcPath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
      }
    }
  }
};
