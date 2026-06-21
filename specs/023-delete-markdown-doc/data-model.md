# Data Model: Markdown文書/フォルダ削除（Story 023）

## Entity: DeletionTarget

- Purpose: 利用者が削除対象として選ぶ file/folder 項目を表す。
- Fields:
  - targetType: enum(`file`, `folder`)
  - displayName: string
  - path: string（rootDir 基準の正規化済み相対パス；HTTP wire format の `target.path` と同名）
- Validation Rules:
  - targetType=`file` の場合、path は `.md` で終わる
  - targetType=`folder` の場合、path は rootDir 配下の既存ディレクトリを指す
  - path は `..` により rootDir 外へ出ない

## Entity: DocumentDeleteRequest

- Purpose: Viewer から HTTP API に送る削除要求。
- Fields:
  - target: DeletionTarget
  - requestedAt: string（ISO-8601）
- Validation Rules:
  - target.displayName は空文字を許容しない
  - target.path は空文字を許容しない

## Entity: FolderDeletionPreflightReport

- Purpose: フォルダ削除前に、配下項目が削除許可条件を満たすかを判定する。
- Fields:
  - rootFolderPath: string
  - managedMarkdownIdentifiers: string[]
  - unmanagedEntries: string[]
  - containsOutOfScopeEntry: boolean
  - deletable: boolean
- Validation Rules:
  - unmanagedEntries が 1 件以上ある場合、deletable=false
  - containsOutOfScopeEntry=true の場合、deletable=false
  - deletable=true の場合、削除対象は管理対象 Markdown とフォルダ自身のみである

## Entity: DeleteConfirmationState

- Purpose: Viewer 上での削除確認ダイアログ表示状態。
- Fields:
  - open: boolean
  - targetName: string
  - targetType: enum(`file`, `folder`)
  - warningMessage: string
  - destructiveConfirmed: boolean
- Validation Rules:
  - open=true の場合、targetName は必須
  - warningMessage は h4 相当の見出し `削除しますか？` と `Git Commitなどをしていない場合、元に戻せません。` を含む

## Entity: DocumentDeletionPolicy

- Purpose: 削除可否判定ルールをまとめる。
- Fields:
  - rootDirConstraint: boolean
  - markdownOnlyConstraint: boolean
  - includeMatch: boolean
  - excludeMatch: boolean
  - existenceConfirmed: boolean
  - folderPreflightPassed: boolean | null
- Validation Rules:
  - file 削除では markdownOnlyConstraint=true が必須
  - folder 削除では folderPreflightPassed=true が必須
  - rootDirConstraint=false の場合は即 reject

## Entity: DocumentDeletionResult

- Purpose: application から HTTP / Viewer に返す削除結果。
- Fields:
  - status: enum(`deleted`, `rejected`)
  - reasonCode: enum(`INVALID_TARGET`, `OUT_OF_SCOPE`, `NOT_FOUND`, `CONTAINS_UNMANAGED_CONTENT`, `TRANSIENT_IO`) | null
  - removedIdentifiers: string[]
  - removedDirectoryPaths: string[]
- Validation Rules:
  - status=`deleted` の場合 reasonCode は null
  - status=`rejected` の場合 reasonCode は必須
  - file 削除時 removedIdentifiers は最低 1 件
  - folder 削除時 removedDirectoryPaths は対象フォルダを含む

Note: 削除成功後の次選択解決はクライアント側で行う。`fallbackSelection` をサーバーが返すことはしない（F2 修正に対応）。

## Entity: ViewerDeleteFlowState

- Purpose: Viewer の削除メニュー、確認ダイアログ、実行中状態を管理する。
- Fields:
  - menuTarget: DeletionTarget | null
  - confirmTarget: DeletionTarget | null
  - pending: boolean
  - result: enum(`idle`, `deleted`, `rejected`)
- Validation Rules:
  - pending=true の間は confirmTarget が存在する
  - result=`deleted` または `rejected` の後は menuTarget をクリアできる

## Relationships

- DeletionTarget 1 --- 1 DocumentDeleteRequest
- DeletionTarget 1 --- 0..1 FolderDeletionPreflightReport
- DocumentDeleteRequest 1 --- 1 DocumentDeletionPolicy
- DocumentDeletionPolicy 1 --- 1 DocumentDeletionResult
- DeletionTarget 1 --- 1 DeleteConfirmationState
- DocumentDeletionResult 1 --- 1 ViewerDeleteFlowState
