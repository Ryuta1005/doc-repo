# CLI Contract: doc-repo / serve with Config File

## Scope

Story 007 の範囲で、`doc-repo.config.json` が `doc-repo` の通常生成と `serve` にどう影響するかを定義する。

## Commands

```bash
doc-repo [scopePath] [--open]
doc-repo serve [--port <number>]
```

## Config Resolution Contract

1. コマンド実行時、現在の `cwd` から上位へ `doc-repo.config.json` を探索する。
2. 最初に見つかった設定ファイルを使用する。
3. 設定ファイルに `rootDir` がある場合、相対パスは設定ファイルが置かれたディレクトリ基準で解決する。
4. 設定ファイルがあり `rootDir` がない場合、設定ファイルが置かれたディレクトリを `rootDir` とする。
5. 設定ファイルがない場合のみ `.git` を探索し、最初に見つかったディレクトリを `rootDir` とする。
6. `.git` も見つからない場合は `cwd` を `rootDir` とする。

## Default Generation Contract

1. `doc-repo [scopePath]` は解決済み `rootDir` を基準に Markdown を収集する。
2. `include` が省略された場合、収集対象は `**/*.md`。
3. `include: []` は収集対象ゼロを意味する。
4. `include: []` は `include` 省略と同一扱いとする。全 `**/*.md` が対象になる。
5. `exclude` は既定除外（`node_modules/**`, `.git/**`, `.doc-repo/**`）へ追加される。
6. `exclude` は `include` より優先される。
7. 生成物は常にコマンド実行ディレクトリ直下の `./.doc-repo` に出力される。

## Serve Contract

1. `doc-repo serve` は通常生成と同じ設定解決結果を使う。
2. `--port` が指定された場合、設定ファイルの `port` より優先される。
3. `port` 未指定時は設定ファイル値、さらに未指定なら 4000 を使う。
4. watch 対象は通常生成の収集条件と一致しなければならない。

## Failure Contract

- JSON 構文エラー: 終了コード 1
- `rootDir` が存在しない: 終了コード 1
- `rootDir` がディレクトリではない: 終了コード 1
- `include` / `exclude` が文字列配列でない: 終了コード 1
- `port` が 1〜65535 の整数でない: 終了コード 1
