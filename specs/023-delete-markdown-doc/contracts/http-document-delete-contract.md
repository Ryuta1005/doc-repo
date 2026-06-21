# Contract: Document Delete API（Story 023）

## Scope

Story 023 で追加する文書/フォルダ削除 API の最小契約を定義する。

- file target の Markdown 単体削除
- folder target の再帰削除（Policy B）
- rootDir/include/exclude/traversal/scope 検証
- 削除前提を満たさない場合の reject と理由通知

Note:

- 削除確認ダイアログの表示は viewer の責務
- 本 API は利用者が削除確認で `削除` を押した時点で呼ばれる

## Endpoint

- Method: POST
- Path: /api/document/delete
- Content-Type: application/json

## Request

### File target

```json
{
  "target": {
    "targetType": "file",
    "path": "docs/guides/getting-started.md",
    "displayName": "getting-started"
  }
}
```

### Folder target

```json
{
  "target": {
    "targetType": "folder",
    "path": "docs/guides",
    "displayName": "guides"
  }
}
```

Request Rules:

- target.path は rootDir 基準の相対パスであること
- file target は `.md` を保持すること
- folder target は rootDir 配下の既存フォルダであること
- target.path は `..` 等で rootDir 外へ出ないこと

## Success Response

- Status: 200

```json
{
  "status": "deleted",
  "removed": {
    "identifiers": ["docs/guides/getting-started.md"],
    "directories": []
  }
}
```

Folder delete success example:

```json
{
  "status": "deleted",
  "removed": {
    "identifiers": ["docs/guides/a.md", "docs/guides/b.md"],
    "directories": ["docs/guides"]
  }
}
```

Success Rules:

- file target は対象 Markdown 1 件以上を removed.identifiers に含む
- folder target は削除された配下 Markdown を removed.identifiers に含む
- folder target 成功時は対象フォルダ自体を removed.directories に含む

Note: 削除成功後の次選択はサーバーが決定しない。クライアントは削除成功後に `refreshDocuments()` を呼び、既存の `resolveSelectedIdentifier` で次選択を解決する（Story 022 create フローと同じパターン）。

## Failure Response

- Status: 400 or 404 or 409 or 500

```json
{
  "status": "rejected",
  "error": {
    "code": "INVALID_TARGET | OUT_OF_SCOPE | NOT_FOUND | CONTAINS_UNMANAGED_CONTENT | TRANSIENT_IO",
    "reason": "stable reason code for UI message mapping",
    "message": "debug message",
    "retryable": false
  }
}
```

UI Message Rules:

- Viewer MUST choose displayed text from locale messages by `error.reason`.
- Viewer MUST NOT display `error.message` directly to users.
- `error.message` is for debugging/logging and may be English.

Failure Category Rules:

1. INVALID_TARGET

- 空 target、未知 targetType、file に対する非 `.md` 指定

2. OUT_OF_SCOPE

- rootDir 外、path traversal、include/exclude 条件不一致

3. NOT_FOUND

- 対象 file/folder が存在しない

4. CONTAINS_UNMANAGED_CONTENT

- folder 配下に管理対象外ファイル、`.md` 以外、include 対象外、exclude 対象が 1 件でも存在する

5. TRANSIENT_IO

- 一時的 I/O エラー

## Policy B Contract

- folder delete は、配下が管理対象 Markdown のみで構成される場合に限り成功する
- folder 配下に unmanaged entry が 1 件でもあれば、削除は部分成功してはならない
- reject 時は folder 自体も配下 Markdown も一切削除してはならない

## Non-Goals in This Contract

- ゴミ箱移動
- 復元 API
- 複数 target 一括削除
- 排他制御、競合解決

## Verification Checklist

- file target で 1 件削除できる
- folder target で managed markdown のみ再帰削除できる
- folder 配下に unmanaged entry があると全体拒否される
- rootDir 外 / traversal / include-exclude 不一致は拒否される
- 成功時に removed identifiers/directories が整合する
- reject 時に partial delete が起きない
