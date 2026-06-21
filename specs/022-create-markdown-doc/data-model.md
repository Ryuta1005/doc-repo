# Data Model: 新規 Markdown 文書作成（Story 022）

## Entity: CreationAnchorContext

- Purpose: サイドバーで `+` を押した起点ノードの文脈を保持し、作成ベースパス解決に使う。
- Fields:
  - nodeType: enum(`file`, `folder`)
  - nodePath: string（rootDir からの正規化相対パス）
  - resolvedBasePath: string（実際の作成基準ディレクトリ）
- Validation Rules:
  - nodePath は rootDir 配下であること
  - nodeType=`file` の場合、resolvedBasePath は nodePath の親ディレクトリであること
  - nodeType=`folder` の場合、resolvedBasePath は nodePath 自体であること

## Entity: DocumentCreateInput

- Purpose: 利用者が作成画面で入力する値を表す。
- Fields:
  - rawFilename: string
  - normalizedFilename: string
  - requestedAt: string（ISO-8601）
- Validation Rules:
  - rawFilename は空文字/空白のみを許容しない
  - rawFilename は `/` `\\` を含まない
  - normalizedFilename は rawFilename の末尾に `.md` を付与した結果である
  - rawFilename 内のドットや `.md` はファイル名本文として扱う

## Entity: ResolvedCreateTarget

- Purpose: 作成可能性評価の対象となる最終ファイルパスを表す。
- Fields:
  - basePath: string
  - filenameWithExtension: string
  - targetIdentifier: string（rootDir からの相対パス）
- Validation Rules:
  - targetIdentifier は `.md` で終わる
  - targetIdentifier は rootDir 外に解決されない
  - include 条件を満たし、exclude 条件に一致しない

## Entity: DocumentCreatePolicy

- Purpose: 作成可否の判定ルールを集約する。
- Fields:
  - rootDirConstraint: boolean
  - markdownOnlyConstraint: boolean
  - includeMatch: boolean
  - excludeMatch: boolean
  - duplicateAllowed: boolean（常に false）
- Validation Rules:
  - duplicateAllowed=false のため既存同名は必ず拒否
  - rootDirConstraint=false の場合は即時 reject

## Entity: DocumentCreateResult

- Purpose: 作成処理結果を UI と API に返す。
- Fields:
  - status: enum(`created`, `rejected`)
  - reasonCode: enum(`INVALID_INPUT`, `OUT_OF_SCOPE`, `ALREADY_EXISTS`, `UNWRITABLE_TARGET`, `TRANSIENT_IO`) | null
  - createdIdentifier: string | null
  - displayName: string | null
- Validation Rules:
  - status=`created` の場合 reasonCode は null
  - status=`rejected` の場合 reasonCode は必須
  - createdIdentifier が存在する場合 displayName は拡張子なし名称である

## Entity: SidebarDocumentLabel

- Purpose: サイドバー表示名を内部ファイル名から導出する。
- Fields:
  - internalFilename: string（`.md` 付き）
  - displayName: string（拡張子なし）
- Validation Rules:
  - internalFilename は `.md` で終わる
  - displayName は `.md` を除去した結果と一致する

## Relationships

- CreationAnchorContext 1 --- n DocumentCreateInput
- DocumentCreateInput 1 --- 1 ResolvedCreateTarget
- ResolvedCreateTarget 1 --- 1 DocumentCreatePolicy
- ResolvedCreateTarget 1 --- 1 DocumentCreateResult
- DocumentCreateResult 1 --- 1 SidebarDocumentLabel
