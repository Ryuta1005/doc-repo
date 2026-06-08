# Data Model: ローカルサーバー起動

## Entity: ServeConfiguration

- Purpose: `doc-repo serve` 実行時の設定解決結果を表す。
- Fields:
  - `port`: number
  - `portSource`: enum(`cli`, `config`, `default`)
  - `rootDir`: string
  - `outputDir`: string
- Validation Rules:
  - `port` は整数で `1-65535`
  - `rootDir` は存在するディレクトリ
  - `outputDir` は配信対象として参照可能

## Entity: ServeSession

- Purpose: 1 回の serve 実行のライフサイクルを表す。
- Fields:
  - `sessionId`: string
  - `status`: enum(`initializing`, `generating`, `serving`, `watching`, `stopped`, `failed`)
  - `publicUrl`: string | null
  - `startedAt`: string (ISO datetime)
  - `endedAt`: string | null
  - `exitCode`: number | null
- State Transitions:
  - `initializing -> generating`
  - `generating -> serving` (生成成功)
  - `serving -> watching` (監視開始成功)
  - `generating -> failed` (生成失敗)
  - `serving|watching -> stopped` (停止操作)
  - `serving|watching -> failed` (実行中障害)

## Entity: ServeStepResult

- Purpose: orchestration 各段階の実行結果を記録する。
- Fields:
  - `step`: enum(`initial-generate`, `start-server`, `start-watch`)
  - `status`: enum(`success`, `failure`, `skipped`)
  - `message`: string
  - `durationMs`: number
- Validation Rules:
  - `durationMs >= 0`
  - `failure` の場合は `message` 必須

## Entity: ServeFailure

- Purpose: serve 実行失敗時に利用者へ示す情報を保持する。
- Fields:
  - `type`: enum(`invalid-port`, `port-conflict`, `initial-generate-failed`, `missing-output`, `unknown`)
  - `message`: string
  - `field`: string | null
  - `hint`: string | null
  - `exitCode`: number
- Validation Rules:
  - `exitCode` は失敗時 `1`
  - `field` は入力不正系のみ設定可

## Relationships

- `ServeSession` は 1 つ以上の `ServeStepResult` を持つ。
- `ServeSession` は失敗時に 0 以上の `ServeFailure` を持つ。
- `ServeConfiguration` は `ServeSession` 開始時に 1 つ解決される。
