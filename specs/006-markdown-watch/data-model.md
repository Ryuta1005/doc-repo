# Data Model: 変更監視と自動更新

## Entity: WatchSession

- Purpose: 1 回の `doc-repo serve` 実行における監視ライフサイクルを管理する。
- Fields:
  - `sessionId`: string
  - `status`: enum(`initializing`, `watching`, `regenerating`, `stopping`, `stopped`, `failed`)
  - `startedAt`: string (ISO datetime)
  - `lastEventAt`: string | null
  - `lastSuccessAt`: string | null
  - `pendingChange`: boolean
  - `isShutdownRunning`: boolean
- Validation Rules:
  - `isShutdownRunning` が `true` の間は再生成を新規開始しない
  - `status=stopped` のとき `pendingChange=false`

## Entity: WatchEvent

- Purpose: chokidar から受け取るファイル変化イベント。
- Fields:
  - `eventType`: enum(`add`, `change`, `unlink`)
  - `path`: string
  - `detectedAt`: string (ISO datetime)
  - `isRenameDerived`: boolean
- Validation Rules:
  - 対象は `*.md` のみ
  - `.doc-repo`/`.git`/`node_modules` と include/exclude 除外パスは受理しない

## Entity: RefreshCycle

- Purpose: 変更検知から再生成完了または失敗までの 1 サイクル。
- Fields:
  - `cycleId`: string
  - `state`: enum(`queued`, `running`, `succeeded`, `failed`)
  - `triggeredBy`: WatchEvent[]
  - `scheduledAt`: string (ISO datetime)
  - `startedAt`: string | null
  - `finishedAt`: string | null
  - `durationMs`: number | null
  - `errorMessage`: string | null
- Validation Rules:
  - `running` は同時に 1 件のみ
  - `failed` の場合 `errorMessage` 必須

## Entity: SseClientConnection

- Purpose: `/events` に接続中のブラウザクライアントを保持する。
- Fields:
  - `connectionId`: string
  - `connectedAt`: string (ISO datetime)
  - `lastDispatchAt`: string | null
  - `status`: enum(`open`, `closed`)
- Validation Rules:
  - 切断検知時に `status=closed` とし接続リストから削除
  - `reload` イベント送信先は `status=open` のみ

## Entity: WatchStatusMessage

- Purpose: 標準出力/標準エラーへ出す進行状況・障害情報。
- Fields:
  - `level`: enum(`info`, `warn`, `error`)
  - `code`: enum(`WATCH_STARTED`, `CHANGE_DETECTED`, `REGEN_STARTED`, `REGEN_SUCCEEDED`, `REGEN_FAILED`, `SHUTDOWN_STARTED`, `SHUTDOWN_COMPLETED`)
  - `message`: string
  - `timestamp`: string (ISO datetime)
- Validation Rules:
  - `level=error` は標準エラーへ出力
  - `REGEN_FAILED` 時は `reload` を送信しない

## Relationships

- `WatchSession` は 0..n の `WatchEvent` を受け取り、1..n の `RefreshCycle` を持つ。
- `RefreshCycle` は 0..n の `WatchEvent` を束ねる。
- `WatchSession` は 0..n の `SseClientConnection` を保持する。
- `WatchStatusMessage` は `WatchSession` と `RefreshCycle` の状態変化ごとに生成される。
