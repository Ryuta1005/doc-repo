# Config File Contract: doc-repo.config.json

## Scope

Story 007 の範囲で、`doc-repo.config.json` の許容形式と解釈ルールを定義する。

## File Name

```text
doc-repo.config.json
```

## Supported Fields

```json
{
  "rootDir": "./docs",
  "include": ["specs/**/*.md"],
  "exclude": ["drafts/**"],
  "port": 4000
}
```

## Field Semantics

- `rootDir`
  - optional
  - string
  - 相対パスは設定ファイルが置かれたディレクトリ基準
  - 絶対パスはそのまま使用
- `include`
  - optional
  - string[]
  - 省略時は `**/*.md`
  - `[]` は収集対象ゼロ
- `exclude`
  - optional
  - string[]
  - 既定除外へ追加される
- `port`
  - optional
  - integer
  - 1〜65535

## Invariants

1. 既定除外 `node_modules/**`, `.git/**`, `.doc-repo/**` は常時有効。
2. `exclude` は `include` より優先。
3. 未知フィールドは無視する。
4. 空オブジェクト `{}` は有効。

## Invalid Examples

### Invalid port type

```json
{
  "port": "4000"
}
```

### Invalid include type

```json
{
  "include": "specs/**/*.md"
}
```

### Invalid rootDir target

```json
{
  "rootDir": "./README.md"
}
```

## Output Behavior

- 生成物は常に解決済み `rootDir/.doc-repo` へ出力する。
- この Story では outputDir を設定ファイルから変更できない。
