# Research: 設定ファイル雛形の生成（doc-repo init）

**Date**: 2026-06-10
**Branch**: `008-config-file-init`

## 調査項目

### 1. `port` のデフォルト値（コードとスペックの不一致）

**Decision**: `4000` を使用する

**Rationale**:
`src/shared/config/resolveRuntimeConfig.ts` に `const DEFAULT_PORT = 4000;` が定義されており、既存の通常生成 / `serve` はこの値を使用している。スペックの `3000` は誤記と判断し、コードベースとの一貫性を優先して `4000` を採用する。スペックは本 research の決定に基づき更新する。

**Alternatives considered**:

- `3000`（スペック記載値）: 既存実装と矛盾するため却下

---

### 2. `init` コマンドの既存ファイル存在チェックの実装方法

**Decision**: `fs-extra` の `pathExists` を使用する

**Rationale**:
既存コードベースで `fs.pathExists` が `src/shared/config/findConfigPath.ts` などで使用されており、一貫性がある。`try/catch` による `EEXIST` エラーキャッチより宣言的で読みやすい。

**Alternatives considered**:

- `fs.writeFile` に `wx` フラグを使用してアトミックに確認する方法: 動作するが、エラーメッセージの生成が複雑になるため却下

---

### 3. コアロジックの配置場所

**Decision**: `src/core/init/createConfigFile.ts` に配置する

**Rationale**:
既存のパターン（`src/core/site/generateSite.ts`、`src/core/serve/runServe.ts`）と一致させる。`init` の処理は純粋なファイルI/O（`cwd` を受け取り結果を返す）であり、テスト容易性のためにも CLI から分離する。

**Alternatives considered**:

- `src/cli/index.ts` に直接インライン実装: テスト困難でコードが肥大化するため却下

---

### 4. `createConfigFile` の戻り値型

**Decision**: 以下のインターフェースを新規定義する（または既存の `ExecutionStatus` を流用する）

```typescript
interface InitResult {
  status: "created" | "already-exists" | "failure";
  configPath: string;
  errorReason?: string;
}
```

**Rationale**:
通常生成の `GenerationResult` は init には過剰。シンプルな3状態（生成 / スキップ / 失敗）で CLI 側の分岐を明快にする。`configPath` を返すことで CLI がパスを表示できる。

**Alternatives considered**:

- `GenerationResult` の流用: フィールドの多くが不要（`markdownFileCount` 等）で混乱を招くため却下

---

### 5. 生成する `doc-repo.config.json` の内容

**Decision**: 以下の内容を生成する

```json
{
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

**Rationale**:

- `rootDir: "."` → 設定ファイルのあるディレクトリ基準（007 の仕様と一致）
- `include: ["**/*.md"]` → デフォルトの全 Markdown 収集
- `exclude: []` → 除外なし（ユーザーが必要に応じて編集）
- `port: 4000` → コードベースのデフォルト値に統一

**Alternatives considered**:

- `port` を省略する: ユーザーがデフォルト値を知る方法がなくなるため却下

---

## スペック更新が必要な箇所

- `spec.md` の Key Entities セクション: `port`（デフォルト: `3000`）→ `4000` に修正する
