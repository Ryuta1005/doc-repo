# Data Model: 設定ファイル雛形の生成（doc-repo init）

**Date**: 2026-06-10
**Branch**: `008-config-file-init`

## Entities

### ConfigFileContent

生成される `doc-repo.config.json` の内容を表す。

| フィールド | 型         | デフォルト値  | 説明                                                                                                |
| ---------- | ---------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `rootDir`  | `string`   | `"."`         | Markdown 収集の起点ディレクトリ。設定ファイルが置かれたディレクトリ基準の相対パス、または絶対パス。 |
| `include`  | `string[]` | `["**/*.md"]` | 収集対象ファイルの glob パターン。                                                                  |
| `exclude`  | `string[]` | `[]`          | 除外対象ファイルの glob パターン。                                                                  |
| `port`     | `number`   | `4000`        | ローカルサーバーの待受ポート。                                                                      |

```json
{
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

### InitResult

`createConfigFile` 関数の戻り値型。

| フィールド     | 型                                           | 説明                                      |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| `status`       | `"created" \| "already-exists" \| "failure"` | 処理結果。                                |
| `configPath`   | `string`                                     | 生成対象のファイルパス（絶対パス）。      |
| `errorReason?` | `string`                                     | `status === "failure"` のとき、失敗理由。 |

## State Transitions

```
実行
  └─ config ファイルが存在しない → status: "created"
  └─ config ファイルが既に存在 → status: "already-exists"
  └─ ファイル書き込み失敗 → status: "failure"（errorReason に理由）
```

## Validation Rules

- `createConfigFile` はデフォルト値を直接埋め込んだ固定 JSON を書き込む（バリデーション不要）
- 既存ファイルのチェックは `fs-extra` の `pathExists` で行う
