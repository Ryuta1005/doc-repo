# CLI Contract: `doc-repo init`

**Date**: 2026-06-10
**Branch**: `008-config-file-init`

## Command Schema

```
doc-repo init
```

### Arguments

なし

### Options

なし（MVP範囲）

### Exit Codes

| コード | 状態                                               |
| ------ | -------------------------------------------------- |
| `0`    | 成功（生成済み）または既存ファイルあり（スキップ） |
| `1`    | 生成失敗（書き込みエラー等）                       |

## Output Contract

### 成功時（標準出力）

```
設定ファイルを作成しました: <絶対パス>
```

### 既存ファイルあり時（標準出力）

```
設定ファイルは既に存在します: <絶対パス>
```

### 失敗時（標準エラー出力）

```
エラー: 設定ファイルの作成に失敗しました。
理由: <errorReason>
```

## Generated File Contract

生成される `doc-repo.config.json` の構造:

```json
{
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

| フィールド | 型         | デフォルト    |
| ---------- | ---------- | ------------- |
| `rootDir`  | `string`   | `"."`         |
| `include`  | `string[]` | `["**/*.md"]` |
| `exclude`  | `string[]` | `[]`          |
| `port`     | `number`   | `4000`        |
