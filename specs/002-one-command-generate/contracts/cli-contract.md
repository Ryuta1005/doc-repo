# CLI Contract: ワンコマンド生成

## Interface

- Command: `doc-repo`
- Invocation: リポジトリ（または対象ディレクトリ）で実行（引数なし / 任意引数あり）
- Primary Outcome: `.doc-repo` に閲覧可能な静的サイトを生成

## Input Contract

- Required arguments: なし
- Optional arguments:
  - `scopePath`（位置引数1つ）: リポジトリルート基準の生成対象ディレクトリ
  - `--open`: 生成後に `.doc-repo/index.html` を既定ブラウザで開く
- Runtime context:
  - 現在ディレクトリを起点に Git ルートを探索
  - 見つからない場合は現在ディレクトリを対象ルートに採用

## Output Contract

- Filesystem:
  - 出力先は対象ルート配下の `.doc-repo`
  - 生成は一時ディレクトリで完了後、`.doc-repo` へアトミック置換
- Console:
  - 成功時: 成功メッセージ + 出力先を表示
  - 警告付き成功時: 成功メッセージ + 警告（Markdown 0 件など）
  - 失敗時: 失敗理由 + 次アクションのヒント

## Exit Code Contract

- `0`: 成功（警告付き成功を含む）
- `1..255`: 失敗

## Behavioral Guarantees

- 再実行時は `.doc-repo` を全置換し、残骸を残さない
- 途中失敗時は既存 `.doc-repo` を保持し、中途半端な成果物を公開しない
- Markdown 0 件時は空サイトを生成し、警告を必須表示する

## Non-goals in This Contract

- `serve` / `watch` サブコマンド
- 設定ファイルによる include/exclude 詳細制御
- ブラウザ上での編集機能
