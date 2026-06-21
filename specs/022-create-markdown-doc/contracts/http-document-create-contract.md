# Contract: Document Create API（Story 022）

## Scope

Story 022 で追加する新規文書作成 API の最小契約を定義する。

- サイドバーの `+` 起点で決まる作成ベースパスを受け取り `.md` 文書を作成
- 入力ファイル名の正規化（`.md` 自動付与）
- 作成対象検証（rootDir/include/exclude/traversal/重複）
- 作成結果通知（成功/失敗理由）

Note:

- `+` 押下時点では本 API は呼ばれない
- 利用者が編集画面でファイル名入力後、保存を実行したタイミングで本 API が呼ばれる

## Endpoint

- Method: POST
- Path: /api/document/create
- Content-Type: application/json

## Request

```json
{
  "anchor": {
    "nodeType": "folder",
    "nodePath": "docs/guides"
  },
  "filename": "getting-started"
}
```

Request Rules:

- filename はファイル名のみ（`/` `\\` を含まない）
- filename は入力値全体をファイル名本文として扱い、末尾に常に `.md` を自動付与
- filename が `.md` で終わる場合も、その `.md` はファイル名本文として扱う
- anchor.nodePath は rootDir 配下の既存ノードであること

## Success Response

- Status: 201

```json
{
  "status": "created",
  "document": {
    "identifier": "docs/guides/getting-started.md",
    "displayName": "getting-started"
  }
}
```

Success Rules:

- 作成本文は空文字
- identifier は `.md` を保持
- displayName は最後の `.md` を外した名前

## Failure Response

- Status: 400 or 404 or 409 or 500

```json
{
  "status": "rejected",
  "error": {
    "code": "INVALID_INPUT | OUT_OF_SCOPE | ALREADY_EXISTS | UNWRITABLE_TARGET | TRANSIENT_IO",
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

1. INVALID_INPUT

- 空入力、区切り文字を含む入力、`.` または `..` のようなパスセグメント入力

2. OUT_OF_SCOPE

- rootDir 外、パストラバーサル、include/exclude 条件不一致

3. ALREADY_EXISTS

- 同名ファイルが既に存在

4. UNWRITABLE_TARGET

- 親ディレクトリ不存在、権限不足

5. TRANSIENT_IO

- 一時的 I/O エラー

## Non-Goals in This Contract

- 文書削除 API
- 複数文書の一括作成
- フォルダ作成

## Verification Checklist

- 入力値の末尾に常に `.md` が自動付与される
- `.md` 明示入力でも `a.md.md` のように保存用 `.md` が付与される
- `doc.ja` や `example.txt` のようなドット付き入力もファイル名本文として扱われる
- 既存同名ファイルは上書きされない
- 成功時に内部 identifier と表示 displayName が整合する
