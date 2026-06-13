# Data Model: React + Hono ワークスペース基盤（Task 019）

## Entity: DocumentIdentifier

- Purpose: 文書取得・更新対象を一意に識別する。
- Fields:
  - `value`: string（`rootDir` からの正規化相対パス）
- Validation Rules:
  - 空文字不可
  - `rootDir` 外参照不可（`..` 逸脱禁止）
  - URL エンコード/デコード後に同一正規化結果となること

## Entity: DocumentSummary

- Purpose: 文書一覧 API が返す最小メタデータ。
- Fields:
  - `identifier`: DocumentIdentifier
  - `title`: string
  - `updatedAt`: string | null（ISO datetime）
- Validation Rules:
  - `identifier` は文書を指す唯一のクライアント向け識別子として扱う
  - `title` は未取得時フォールバック可（例: ファイル名）

## Entity: DocumentDetail

- Purpose: 文書取得 API が返す本文表示データ。
- Fields:
  - `identifier`: DocumentIdentifier
  - `title`: string
  - `html`: string
  - `metadata`: object
- Validation Rules:
  - `html` は Markdown から変換した表示用 HTML（rendered HTML）
  - `identifier` 不一致時は 404 相当

## Entity: ViewerTreeNode

- Purpose: 左ツリー表示用ノード。
- Fields:
  - `name`: string
  - `path`: string
  - `kind`: enum(`directory`, `document`)
  - `children`: ViewerTreeNode[] | null
  - `identifier`: DocumentIdentifier | null
- Validation Rules:
  - `directory` は `children` を持つ
  - `document` は `identifier` 必須

## Entity: WatchEvent

- Purpose: ファイル変更監視の通知単位。
- Fields:
  - `type`: enum(`add`, `change`, `unlink`)
  - `path`: string
  - `detectedAt`: string（ISO datetime）
- Validation Rules:
  - `*.md` 対象
  - 除外パス（`.doc-repo`/`.git`/`node_modules`/設定除外）非対象

## Entity: ReloadSignal

- Purpose: SSE でブラウザへ送る更新通知。
- Fields:
  - `eventName`: string（`reload`）
  - `payload`: object
    - `type`: string（`reload`）
    - `reason`: string（`regenerate-succeeded`）
    - `occurredAt`: string（ISO datetime）
- Validation Rules:
  - 再生成成功時のみ送信
  - 失敗時は送信しない
  - `eventName` と `payload.type` はともに `reload` で一致させる

## Relationships

- `DocumentIdentifier` は `DocumentSummary` / `DocumentDetail` / `ViewerTreeNode` を結びつける。
- `WatchEvent` は再生成をトリガーし、成功時に `ReloadSignal` を生成する。
