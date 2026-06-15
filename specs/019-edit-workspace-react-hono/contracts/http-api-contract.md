# Contract: HTTP API / SSE（Task 019）

## Scope

Task 019 における `serve` 実行時の HTTP 契約を定義する。

- 文書一覧 API
- 文書取得 API
- SSE 通知
- エラー形式
- HTTP 境界と application 層の責務分離
- 将来の保存 API 追加方針（非破壊拡張）

## Identifier Contract

- 文書識別子は `rootDir` からの正規化相対パス。
- 文書取得は `GET /api/document?path=<encoded rootDir-relative path>` の query parameter 方式を使用する。
- クライアントは `path` を `encodeURIComponent(path)` して送信する。
- サーバーはデコード後に正規化し、`rootDir` 外参照、空文字、`..` 逸脱を拒否する。

## Document List API

- Purpose: 利用可能な文書一覧を返す。
- Endpoint: `GET /api/documents`
- Response: JSON

```json
[
  {
    "identifier": "docs/overview/product.md",
    "title": "プロダクト概要",
    "updatedAt": "2026-06-13T00:00:00.000Z"
  }
]
```

## Document Detail API

- Purpose: 指定文書の表示用 HTML とメタデータを返す。
- Endpoint: `GET /api/document?path=<encoded rootDir-relative path>`
- Response: JSON

```json
{
  "identifier": "docs/overview/product.md",
  "title": "プロダクト概要",
  "html": "<h1>プロダクト概要</h1>",
  "metadata": {}
}
```

## SSE Contract

- Purpose: 再生成成功をブラウザへ通知する。
- Event name: `reload`
- Dispatch: 再生成成功時のみ

```json
{
  "type": "reload",
  "reason": "regenerate-succeeded",
  "occurredAt": "2026-06-13T00:00:00.000Z"
}
```

payload は `type: "reload"` を必須とし、イベント名 `reload` と payload.type を一致させる。

## Error Contract

エラーは少なくとも以下を扱う。

- 400: 入力形式不正（識別子形式不正など）
- 404: 文書未検出（識別子に対応する文書が存在しない）
- 500: 内部エラー（変換失敗、予期しない例外）

補足:

- 不正な `path` は `400 INVALID_REQUEST`
- 存在しない文書は `404 DOCUMENT_NOT_FOUND`

Response shape:

```json
{
  "error": {
    "code": "INVALID_REQUEST | DOCUMENT_NOT_FOUND | INTERNAL_ERROR",
    "message": "human readable message"
  }
}
```

## Verification Contract

HTTP API 契約の合格判定は、内部 pipeline や application use case の戻り値だけでは行わない。Hono adapter を起動し、実 HTTP request/response として確認する。

必須確認:

- `GET /api/documents` は実 HTTP で `200` と JSON を返す
- `GET /api/document?path=<encoded>` は実 HTTP で `200` と JSON を返す
- `GET /api/document?path=` は実 HTTP で `400 INVALID_REQUEST` を返す
- `GET /api/document?path=..%2FREADME.md` は実 HTTP で `400 INVALID_REQUEST` を返す
- `GET /api/document?path=not-found.md` は実 HTTP で `404 DOCUMENT_NOT_FOUND` を返す
- エラー response は `Content-Type: application/json; charset=utf-8` と標準 error payload を返す

pipeline / mapper / validator の単体テストは補助的に実装してよいが、HTTP 契約充足の根拠は adapter-level integration test とする。

## Boundary Responsibility

Hono 境界で分離する責務:

1. HTTP ルート
2. 入力形式の検証
3. HTTP エラーへの変換
4. application 層呼び出し

禁止事項:

- Hono ルート内へ core ロジックを直接埋め込まない
- React UI から core を直接呼ばない

## Forward-Compatibility Policy

Phase 3 で保存 API を追加する際は、既存の文書一覧・文書取得 API 契約を変更しない。保存 API は新規ルートとして追加し、上記エラー契約と境界責務分離を踏襲する。
