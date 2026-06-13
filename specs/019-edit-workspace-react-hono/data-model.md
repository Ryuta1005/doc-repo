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
  - `path`: string（表示用相対パス）
  - `title`: string
  - `updatedAt`: string | null（ISO datetime）
- Validation Rules:
  - `identifier` と `path` は論理的に同じ文書を指す
  - `title` は未取得時フォールバック可（例: ファイル名）

## Entity: DocumentDetail

- Purpose: 文書取得 API が返す本文表示データ。
- Fields:
  - `identifier`: DocumentIdentifier
  - `path`: string
  - `title`: string
  - `html`: string
  - `metadata`: object
- Validation Rules:
  - `html` は core/application 層が生成
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
  - `event`: string（`reload`）
  - `occurredAt`: string（ISO datetime）
  - `reason`: string（`regenerate-succeeded`）
- Validation Rules:
  - 再生成成功時のみ送信
  - 失敗時は送信しない

## Entity: HttpBoundaryLayer

- Purpose: Hono 境界での責務分離単位。
- Fields:
  - `routeHandler`: HTTP ルート
  - `inputValidator`: 入力検証
  - `errorMapper`: HTTP エラー変換
  - `applicationInvoker`: application 呼び出し
- Validation Rules:
  - 各責務は分離（単一層へ混在させない）
  - 保存 API 追加時に既存一覧/取得 API 契約へ非破壊で拡張可能

## Relationships

- `DocumentIdentifier` は `DocumentSummary` / `DocumentDetail` / `ViewerTreeNode` を結びつける。
- `WatchEvent` は再生成をトリガーし、成功時に `ReloadSignal` を生成する。
- `HttpBoundaryLayer` は `DocumentSummary` / `DocumentDetail` を HTTP レスポンスへ変換する。
