# doc-repo 設定ファイル

このページでは `doc-repo.config.json` の仕様を説明します。

## 設置場所

- ファイル名: `doc-repo.config.json`
- 探索方法: コマンド実行ディレクトリから上位へ探索し、最初に見つかったファイルを使用

## 雛形の生成

カレントディレクトリに設定ファイルの雛形を作るには `doc-repo init` を実行します。

```bash
doc-repo init
```

生成される雛形:

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

`doc-repo.config.json` が既に存在する場合は上書きされません。

## 設定できる項目

```json
{
  "name": "Team Docs",
  "rootDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["drafts/**"],
  "port": 4000
}
```

| フィールド | 型         | 必須   | 説明                                |
| ---------- | ---------- | ------ | ----------------------------------- |
| `name`     | `string`   | いいえ | サイドバー上部に表示するサイト名    |
| `rootDir`  | `string`   | いいえ | Markdown を収集する起点ディレクトリ |
| `include`  | `string[]` | いいえ | 収集対象の glob パターン            |
| `exclude`  | `string[]` | いいえ | 追加の除外 glob パターン            |
| `port`     | `number`   | いいえ | `doc-repo serve` で使うポート       |

未知のフィールドは無視されます。

## 解決ルール

### `rootDir`

1. `rootDir` を指定した場合:
   - 相対パス: `doc-repo.config.json` が置かれたディレクトリ基準で解決
   - 絶対パス: そのまま使用
1. 設定ファイルが存在し、`rootDir` 省略の場合:
   - 設定ファイルが置かれたディレクトリを使用
1. 設定ファイルが存在しない場合:
   - まず Git ルートを探索
   - 見つからなければカレントディレクトリを使用

### `port`

優先順位:

1. CLI オプション `--port`
2. 設定ファイルの `port`
3. 既定値 `4000`

有効範囲は `1` 〜 `65535` です。

### `include` と `exclude`

- `include` 未指定時は `**/*.md` が使われます。
- `include` が空配列（`[]`）でも、未指定と同じく `**/*.md` として扱います。
- `exclude` は既定除外に追加されます。
- 優先度は `exclude` が `include` より高く、両方に一致したファイルは除外されます。

既定除外（常時適用）:

- `node_modules/**`
- `.git/**`
- `.doc-repo/**`
- `dist/**`

## 挙動メモ

- `doc-repo`（generate）と `doc-repo serve` は同じ設定解決ルールを使います。
- 設定値が不正な場合は終了コード `1` で失敗します。
- 可能な限り、どのフィールドが不正かを含めてエラーメッセージを返します。

## バリデーションエラー

以下の場合は失敗（終了コード `1`）します。

- JSON 構文エラー
- `rootDir` が存在しない
- `rootDir` がディレクトリでない
- `include` が `string[]` でない
- `exclude` が `string[]` でない
- `port` が範囲外、または数値でない
- `name` が空、または文字列でない

## 設定例

### `docs/` 配下のみ収集

```json
{
  "rootDir": "./docs"
}
```

### specs 配下のみ収集し、manual-tests は除外

```json
{
  "rootDir": ".",
  "include": ["specs/**/*.md"],
  "exclude": ["specs/**/manual-tests/**"]
}
```

### `serve` の既定ポートを変更

```json
{
  "port": 4100
}
```
