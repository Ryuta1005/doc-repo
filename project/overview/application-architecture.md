# アプリケーションアーキテクチャ

## 目的

この文書は、doc-repo のアプリケーション構造と依存方向を定義する。特に編集 API やリッチテキスト編集 UI を追加しても、`serve` を正規入口とする workspace 体験を壊さないことを目的とする。

## 基本方針

中核処理は framework 非依存の `core` に置く。React と Hono は外側の adapter として扱い、`core` から React/Hono へ依存させない。

```text
viewer(React) ─┐
presentation   ├─> application ─> core ─> shared
cli            ┘
```

## レイヤー責務

### `src/core`

Markdown とファイルシステム処理の中核を担当する。

- Markdown ファイルの探索
- Markdown から HTML への変換
- watch 対象判定と serve の実行フロー

`core` は React, Hono, DOM, HTTP Request/Response を知らない。

### `src/application`

UI/API から呼ばれる use case を担当する。HTTP や React の詳細を受け取らず、`rootDir` と文書識別子などの application 入力を `core` 呼び出しへ変換する。

- 文書一覧取得
- 文書詳細取得

Phase 3 で保存 API を追加する場合も、保存の use case はこの層に追加する。

### `src/presentation/http`

Hono による HTTP 境界を担当する。

- HTTP ルート定義
- query/path の検証
- HTTP エラー payload への変換
- React Viewer と静的アセットの配信
- SSE 接続管理

HTTP 境界は処理本体を持たず、application/core へ委譲する。

### `src/viewer`

ブラウザ上の閲覧 UI を担当する React 層。

- 文書ツリー表示
- 文書本文表示
- 文書選択状態
- API client
- SSE client

Viewer は HTTP API 経由でデータを取得し、`core` を直接 import しない。

### `src/cli`

CLI の entrypoint とコマンド引数処理を担当する。

- `doc-repo serve`
- `doc-repo init`
- 設定解決
- 実行結果のメッセージ整形

CLI は `core` や `presentation/http` の起動を orchestration するが、UI/HTTP の詳細ロジックは持たない。

## 主要フロー

### ワークスペース起動

```text
CLI serve
→ core/serve/runServe
→ presentation/http/createServer
→ startMarkdownWatcher
```

020 の方針では、静的生成の直接入口は廃止し、利用者導線は `serve` に統一する。

### serve

```text
CLI serve
→ core/serve/runServe
→ presentation/http/createServer
→ Hono routes/static/SSE
→ viewer(React)
```

`serve` では React Viewer が Hono の HTTP API から文書一覧・文書詳細を取得する。Markdown 変更時は watcher が SSE `reload` を通知する。

### 文書取得 API

```text
viewer apiClient
→ GET /api/documents or /api/document?path=...
→ presentation/http validation/error mapping
→ application/documents
→ core scanner/parser
```

文書識別子は `rootDir` からの正規化相対パスを正とする。

## 依存ルール

- `src/core` は `react`, `react-dom`, `hono`, `@hono/node-server` に依存しない
- `src/viewer` は `src/core` を直接 import しない
- `src/presentation/http` は HTTP 入出力と error mapping に集中し、Markdown 処理を直接実装しない
- 保存 API は既存の文書一覧・取得 API 契約を壊さず、別 route/use case として追加する

## 境界テストルール

- HTTP API の契約確認は `createHttpBoundaryPipeline` などの内部 pipeline 呼び出しだけで完了扱いにしない
- 少なくとも主要な正常系とエラー系（400/404/500）は Hono adapter を起動し、実 HTTP request/response として status code、`Content-Type`、JSON payload を検証する
- route/use case/mapper の単体テストは原因切り分け用として維持するが、HTTP 契約の最終判定は adapter-level integration test を正とする
- 新しい API を追加する場合は、実装タスクと同じ story 内に adapter-level integration test のタスクを含める

## 019 で意図的に残すこと

`core/serve/runServe` は watch 起動、HTTP server 起動、shutdown を orchestration している。019 では React + Hono 基盤化を優先し、serve orchestration の全面分割は別リファクタリング候補として残す。
