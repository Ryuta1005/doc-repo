# Data Model: リッチテキスト編集と Markdown 保存（Story 010）

## Entity: EditableDocument

- Purpose: 編集対象文書の基礎情報と現在内容を表す。
- Fields:
  - identifier: string（rootDir からの正規化相対パス）
  - originalMarkdown: string
  - currentRichTextState: object（エディタ内部表現）
  - hasUnsavedChanges: boolean
- Validation Rules:
  - identifier は rootDir 配下かつ `.md` のみ許容
  - originalMarkdown は UTF-8 として解釈可能であること

## Entity: UnsupportedSegment

- Purpose: 未対応要素の原文保持対象を追跡する。
- Fields:
  - segmentId: string
  - sourceRange: object（startLine, endLine など）
  - rawMarkdown: string
  - preservationMode: enum(`pass-through`, `degraded`)
- Validation Rules:
  - rawMarkdown は保存時に可能な限りそのまま出力
  - preservationMode が `degraded` の場合は保存前警告対象

## Entity: SaveValidationResult

- Purpose: 保存前検証の判定結果を表す。
- Fields:
  - isValidTarget: boolean
  - reasons: string[]
  - warningMessages: string[]
- Validation Rules:
  - reasons は保存対象不正（ルート外、拡張子不正、include/exclude 不一致、パストラバーサル）を列挙
  - warningMessages は未対応要素による変換/欠損可能性を列挙

## Entity: SaveRequest

- Purpose: 保存 API へ渡す入力契約。
- Fields:
  - identifier: string
  - markdownContent: string
  - newlineStyle: enum(`lf`, `crlf`)
  - hasTrailingNewline: boolean
- Validation Rules:
  - markdownContent は UTF-8 エンコード可能な文字列
  - newlineStyle / hasTrailingNewline は既存文書情報を維持するために必須

## Entity: SaveResult

- Purpose: 保存処理結果を利用者へ通知する。
- Fields:
  - status: enum(`saved`, `failed`)
  - failureCategory: enum(`invalid-target`, `unwritable-target`, `transient-io`) | null
  - message: string
  - retryable: boolean
- Validation Rules:
  - status が `saved` の場合 failureCategory は null
  - status が `failed` の場合 failureCategory と retryable は必須

## Entity: EditLeaveGuard

- Purpose: 未保存変更ありでの離脱確認状態を管理する。
- Fields:
  - hasUnsavedChanges: boolean
  - trigger: enum(`switch-document`, `exit-edit`, `browser-leave`)
  - userDecision: enum(`continue-edit`, `discard`, `cancel-navigation`) | null
- Validation Rules:
  - hasUnsavedChanges が false の場合は確認ダイアログを表示しない

## Relationships

- EditableDocument 1 --- n UnsupportedSegment
- EditableDocument 1 --- n SaveRequest
- SaveRequest 1 --- 1 SaveValidationResult
- SaveRequest 1 --- 1 SaveResult
- EditableDocument 1 --- n EditLeaveGuard
