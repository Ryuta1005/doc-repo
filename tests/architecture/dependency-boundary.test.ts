import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CORE_DIR = path.resolve(process.cwd(), "src/core");

const findTypeScriptFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return await findTypeScriptFiles(entryPath);
      }
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        return [entryPath];
      }
      return [];
    }),
  );

  return files.flat();
};

describe("architecture dependency boundary", () => {
  it("core 層が Hono/React へ依存していないこと", async () => {
    const files = await findTypeScriptFiles(CORE_DIR);
    const violations: string[] = [];

    for (const filePath of files) {
      const source = await fs.readFile(filePath, "utf8");
      const forbidden = /(from\s+["']hono["'])|(from\s+["']react["'])|(from\s+["']react-dom["'])|(@hono\/node-server)/;
      if (forbidden.test(source)) {
        violations.push(path.relative(process.cwd(), filePath));
      }
    }

    expect(violations).toEqual([]);
  });
});
