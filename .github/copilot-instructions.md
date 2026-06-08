# Copilot Instructions

このファイルは、このリポジトリで AI エージェントと開発者が同じ進め方で作業するための共通ルール。

## プロジェクトの目的

- リポジトリ配下の Markdown を、ブラウザで閲覧できる静的サイトとして出力する npm CLI を作る
- MVP では「読めること」を最優先し、機能を増やしすぎない

## 参照ドキュメント

- プロダクト概要: `docs/overview/product.md`
- 技術方針: `docs/overview/technology.md`
- ロードマップ: `docs/overview/roadmap.md`
- Backlog: `project/planning/backlog/index.md`
- Story Map: `project/planning/story-map.md`
- Issue Workflow: `project/issue-workflow.md`

作業前に上記を確認し、変更内容と矛盾しないようにする。

## 開発の基本方針

- 言語は TypeScript を前提にする
- npm パッケージは CLI 中心で設計する
- MVP の既定出力先は `.doc-repo` とする
- アーキテクチャは責務分離を優先する
  - 収集
  - 変換
  - 生成
  - CLI
- 将来の `serve` や `watch` を見据え、コアロジックを CLI 実装に埋め込みすぎない

## Jira 的運用ルール

- チケットは `project/planning/backlog/index.md` を単一ソースとして管理する
- 採番は Epic/Story/Task/Spike で共通の連番にする（001, 002, 003...）
- Epic は `project/planning/backlog/NNN_エピック名/` のフォルダで管理する
- Story/Task/Spike は `project/planning/backlog/NNN_チケット名.md` で管理する
- Story タイトルは原則 `XXX(想定ユーザー)はXXXできる。なぜならXXXXしたいから。` で記述する
- Story/Task/Spike は必ずいずれかの Epic にひも付ける
- 種別は Epic, Story, Task, Spike を使う
- ステータスは Todo, In Progress, Review, Done, Blocked を使う
- Story はユーザー価値を主語に書く
- Task は技術タスク（リファクタリング、技術検証、基盤整備など）として書く
- Spec と Story/Task の対応を必ず記載する

## Spec と実装の進め方

MVP は次の 3 つの Spec に分けて進める。

- Spec A: CLI と出力基盤
- Spec B: Markdown 収集と HTML 変換
- Spec C: 閲覧 UI（左ツリー/右本文）

原則として、1 Spec ごとに次を行う。

1. Backlog の対象 Story を In Progress に更新する
2. 仕様と受け入れ条件を確認する
3. 実装する
4. 動作確認する
5. ドキュメントを更新する
6. Done に更新する

注記: 機能実装タスクは Speckit のフローで管理し、backlog の Task には起票しない。

## Copilot への具体的な期待

- 変更前に関連ドキュメントを確認し、齟齬があれば先に指摘する
- 変更は小さく分割し、目的と影響範囲を明確にする
- 実装と同時に、必要なドキュメント更新も提案または実施する
- 不明点は質問で解消する。質問は選択式を優先する
  - 例: A/B/C 形式

## Done の定義

次をすべて満たしたら完了とする。

- 対応 Story の受け入れ条件を満たす
- 関連 Task の実装が反映されている
- 実装とドキュメントが一致している
- Backlog のステータスが更新されている

## 非目標（MVP段階）

- ブラウザ上での Markdown 編集
- ホットリロード付きローカルサーバー
- 高度な検索・タグ管理
- include/exclude の詳細設定

必要になったら、ロードマップの Phase 2 以降として扱う。

## Active Technologies
- TypeScript (Node.js >= 20) + commander (CLI), fs-extra (ファイル操作), 既存 core 生成処理、Node.js `http`/`node:net` 標準機能（配信とポート検証） (005-local-server-serve)
- ファイルシステム（入力 Markdown / 出力 `.doc-repo`） (005-local-server-serve)
- TypeScript (Node.js >= 20) + commander, fs-extra, fast-glob, markdown-it, chokidar（新規）, Node.js `http`/`node:net` (006-markdown-watch)

- TypeScript (Node.js LTS 想定) + commander (CLI引数), fast-glob (Markdown探索), markdown-it (Markdown→HTML), fs-extra (ファイル操作) (002-one-command-generate)
- ファイルシステム（入力Markdownと出力 `.doc-repo`） (002-one-command-generate)

## Recent Changes

- 002-one-command-generate: Added TypeScript (Node.js LTS 想定) + commander (CLI引数), fast-glob (Markdown探索), markdown-it (Markdown→HTML), fs-extra (ファイル操作)
