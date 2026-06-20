# Contract: Document Create API（Story 022）

## Scope

Story 022 で追加する新規文書作成 API の最小契約を定義する。

- サイドバーの `+` 起点で決まる作成ベースパスを受け取り `.md` 文書を作成
- 入力ファイル名の正規化（`.md` 自動付与）
- 作成対象検証（rootDir/include/exclude/traversal/重複）
- 作成結果通知（成功/失敗理由）

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
- filename が拡張子なしの場合 `.md` を自動付与
- filename が `.md` で終わる場合はそのまま使用
- `.md` 以外の拡張子を明示した入力は拒否
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
- displayName は拡張子なし

## Failure Response

- Status: 400 or 404 or 409 or 500

```json
{
  "status": "rejected",
  "error": {
    "code": "INVALID_INPUT | OUT_OF_SCOPE | ALREADY_EXISTS | UNWRITABLE_TARGET | TRANSIENT_IO",
    "message": "human readable message",
    "retryable": false
  }
}
```

Failure Category Rules:

1. INVALID_INPUT

- 空入力、区切り文字を含む入力、非 `.md` 拡張子入力

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

- 拡張子省略入力で `.md` が自動付与される
- `.md` 明示入力で二重付与されない
- 非 `.md` 拡張子入力は拒否される
- 既存同名ファイルは上書きされない
- 成功時に内部 identifier と表示 displayName が整合する
