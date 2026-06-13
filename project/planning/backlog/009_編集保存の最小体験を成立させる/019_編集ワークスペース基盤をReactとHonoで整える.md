# 019 編集ワークスペース基盤をReactとHonoで整える

## メタ情報

- 種別: Task
- 番号: 019
- Epic: 009
- ステータス: Done
- 優先度: P1
- Spec: 019-edit-workspace-react-hono
- Depends On: 004

## 目的

Phase 3 のリッチテキスト編集を実装する前に、Phase 2 までの閲覧・serve・watch 体験を React + Hono 境界で再構成する。編集機能そのものは入れず、010 が UI 基盤移行と保存機能を同時に背負わない状態を作る。

## 受け入れ条件

- `doc-repo serve` の既存体験を維持できる
- 左ツリー、本文表示、ファイル選択、画像・静的アセット表示が既存の閲覧機能と同等に動作する
- Markdown 変更監視とブラウザ自動更新が既存の Phase 2 体験と同等に動作する
- Hono は HTTP リクエスト・レスポンス境界を担当し、ファイル探索、Markdown 変換、設定解決などの中核処理は core/application 層を呼び出す
- React は viewer UI を担当し、core が React に依存しない
- Phase 1 の静的生成価値を壊さず、`build` 相当の静的出力は維持する
- React Viewer が利用する文書一覧 API と文書取得 API を実装する
- 010 で保存 API を追加できる HTTP 境界を整える。保存 API そのものはこの Task では実装しない
- WYSIWYG エディタ導入、Markdown 保存、競合検知はこの Task では実装しない
- 既存の閲覧・serve・watch 回帰を確認できるテストを更新または追加する

## 技術検証

- React + Hono への移行範囲、既存 Vanilla JS UI の扱い、静的出力とローカルサーバー出力の境界は Spec または research 文書で整理する
- WYSIWYG エディタ候補は 010 の Spike で扱い、この Task では編集 UI を載せるための土台作りに留める

## 実装タスク管理

- 機能実装タスクは Speckit のフローで管理する
