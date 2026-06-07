import { describe, expect, it } from "vitest";

import * as typesModule from "./types.js";

describe("types.ts", () => {
  it("型定義モジュールを読み込んだ場合、実行時エクスポートは空オブジェクトになること。", () => {
    expect(Object.keys(typesModule)).toEqual([]);
  });
});
