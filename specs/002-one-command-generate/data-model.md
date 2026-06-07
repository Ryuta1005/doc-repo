# Data Model: ワンコマンド生成

## Entity: 生成リクエスト

- Purpose: 1 回の CLI 実行で処理される入力コンテキストを表す。
- Fields:
  - requestId: string（実行単位を識別）
  - invokedAt: datetime（実行開始時刻）
  - workingDirectory: string（CLI 実行時カレント）
  - detectedRoot: string（Git ルート探索結果またはカレント）
  - outputDir: string（既定 `.doc-repo`）
- Validation Rules:
  - detectedRoot は存在するディレクトリであること。
  - outputDir は detectedRoot 配下であること。

## Entity: 生成成果物

- Purpose: 出力された閲覧サイト一式の状態を表す。
- Fields:
  - buildId: string（生成識別子）
  - rootPath: string（成果物のルート、`.doc-repo`）
  - generatedAt: datetime（切り替え完了時刻）
  - markdownFileCount: number（入力 Markdown 件数）
  - pagesCount: number（生成ページ数）
  - hasWarning: boolean（警告有無）
- Validation Rules:
  - rootPath は `.doc-repo` を指すこと。
  - markdownFileCount が 0 の場合、hasWarning は true であること。

## Entity: 実行結果

- Purpose: CLI 実行の判定結果と利用者向け通知情報を表す。
- Fields:
  - status: enum（success | failure）
  - exitCode: number（成功 0、失敗 非 0）
  - summaryMessage: string（要約メッセージ）
  - warningMessages: string[]（警告一覧）
  - errorReason: string | null（失敗理由）
- Validation Rules:
  - status が success の場合、exitCode は 0。
  - status が failure の場合、exitCode は 0 以外。
  - markdownFileCount が 0 の成功時、warningMessages は 1 件以上。

## Relationships

- 生成リクエスト 1 : 1 実行結果
- 生成リクエスト 1 : 0..1 生成成果物（失敗時は 0）
- 実行結果 success のときのみ生成成果物が公開状態になる。

## State Transitions

- 生成リクエスト: initialized -> scanning -> converting -> staging -> switched | failed
- 生成成果物: absent -> staged -> published
- 実行結果: pending -> success | failure

## Invariants

- published 状態の成果物は常に完全生成済みである（アトミック置換）。
- failed 時は既存 `.doc-repo` が保持される。
- 警告付き成功でも exitCode は 0 を維持する。
