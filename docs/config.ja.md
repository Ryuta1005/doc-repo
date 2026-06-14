# Configuration

このドキュメントは `doc-repo.config.json` のリファレンスです。

## File Name and Discovery

- ファイル名: `doc-repo.config.json`
- 探索方法: doc-repo は現在の作業ディレクトリから上位へ探索し、最初に見つかった設定ファイルを使用します。
- 設定ファイルが見つからない場合、doc-repo は Git ルート検出を行い、それも見つからなければ現在の作業ディレクトリを使用します。

## Create a Template

実行します。

```bash
doc-repo init
```

これにより、現在の作業ディレクトリに `doc-repo.config.json` が作成されます。

生成されるテンプレート:

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

`doc-repo.config.json` がすでに存在する場合、`doc-repo init` は上書きしません。

## Fields

| フィールド | 型         | 必須 | 省略時のデフォルト                         | 説明                                                  |
| ---------- | ---------- | ---- | ------------------------------------------ | ----------------------------------------------------- |
| `name`     | `string`   | No   | `"Doc Repo"`                               | Viewer サイドバーに表示されるサイト名                |
| `rootDir`  | `string`   | No   | 設定ファイルのディレクトリ、Git ルート、または現在の cwd | Markdown ファイルの収集・保存に使うルートディレクトリ |
| `include`  | `string[]` | No   | `["**/*.md"]`                              | 対象 Markdown ファイルの include glob パターン        |
| `exclude`  | `string[]` | No   | `[]`                                       | 追加の exclude glob パターン                          |
| `port`     | `number`   | No   | `4000`                                     | ローカルワークスペースで使用するポート                |

未知のフィールドは現在無視されます。

## Root Directory Resolution

設定ファイルが存在する場合:

1. `rootDir` が設定されている場合:
   - 相対パスは `doc-repo.config.json` があるディレクトリから解決されます。
   - 絶対パスはそのまま使用されます。
2. `rootDir` が省略されている場合:
   - `doc-repo.config.json` があるディレクトリが使用されます。

設定ファイルが存在しない場合:

1. doc-repo は現在の作業ディレクトリから Git ルートを探します。
2. Git ルートが見つからない場合、現在の作業ディレクトリが使用されます。

## Include and Exclude Rules

- `include` と `exclude` は `rootDir` からの相対パスとして評価されます。
- `include` が省略された場合、`**/*.md` が使用されます。
- `include` が空配列 (`[]`) の場合も、省略時と同じ扱いです。
- `exclude` はデフォルト除外に追加されます。
- exclude ルールは include ルールより優先されます。

デフォルト除外は常に有効です。

- `node_modules/**`
- `.git/**`
- `.doc-repo/**`

現在の実装では、`dist/**` はデフォルト除外ではありません。

## Port Resolution

ポートの優先順位:

1. CLI オプション `--port`
2. `doc-repo.config.json` の `port`
3. デフォルト `4000`

ポートは `1` から `65535` までの整数である必要があります。

## Validation Errors

次の場合、ワークスペースコマンドは exit code `1` で失敗します。

- `doc-repo.config.json` を JSON としてパースできない
- `name` が指定されているが文字列ではない、または空文字列
- `port` が `1` から `65535` までの整数ではない
- `include` が指定されているが文字列配列ではない
- `exclude` が指定されているが文字列配列ではない
- `rootDir` が指定されているが文字列ではない
- `rootDir` が存在しない
- `rootDir` がディレクトリではない

可能な場合、エラー出力には失敗したフィールドが含まれます。

## Examples

### Explicit Defaults

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

### Collect Only Under `docs/`

`include` は `rootDir` からの相対パスとして評価されるため、この設定は `docs/` 配下のすべての Markdown ファイルを収集します。

```json
{
  "rootDir": "./docs",
  "include": ["**/*.md"]
}
```

### Collect Specs and Skip Manual Test Notes

```json
{
  "rootDir": ".",
  "include": ["specs/**/*.md"],
  "exclude": ["specs/**/manual-tests/**"]
}
```

### Use a Different Default Port

```json
{
  "port": 4100
}
```
