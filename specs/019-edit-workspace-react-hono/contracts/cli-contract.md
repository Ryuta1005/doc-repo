# Contract: doc-repo serve / build（Task 019）

## Scope

Task 019 では、既存の Phase 2 体験を維持しつつ React + Hono 境界へ移行する際の CLI/HTTP 契約を定義する。

## CLI Contract

### Command: `doc-repo serve`

- 既存と同じ起動体験を維持する。
- `serve` 中の文書一覧・文書取得は Hono の HTTP API を経由する。
- 変更監視は既存 SSE ベースの自動更新を維持する。

Behavior:

1. 初回生成成功後に HTTP サーバー起動。
2. 監視対象の変更（add/change/unlink）を検知。
3. 再生成成功時のみ SSE `reload` を通知。
4. 失敗時はブラウザ更新せずエラー表示。

### Command: `doc-repo build`

- 既存の主要な出力契約を維持して静的成果物を生成する。
- 生成物は既存と同じ利用方法でオフライン閲覧できる。

## HTTP Contract (Serve Runtime)

注: パラメータ形式（path/query）と URL エンコード詳細は plan で最終決定。

### Document List API

- Purpose: 利用可能な文書一覧を返す。
- Response: JSON（`identifier` は `rootDir` 正規化相対パス）

```json
[
  {
    "identifier": "docs/overview/product.md",
    "path": "docs/overview/product.md",
    "title": "プロダクト概要"
  }
]
```

### Document Detail API

- Purpose: 指定文書の HTML とメタデータを返す。
- Response: JSON

```json
{
  "identifier": "docs/overview/product.md",
  "path": "docs/overview/product.md",
  "title": "プロダクト概要",
  "html": "<h1>プロダクト概要</h1>",
  "metadata": {}
}
```

### SSE Events API

- Purpose: 再生成成功をブラウザへ通知する。
- Event: `reload`
- Dispatch: 再生成成功時のみ

```json
{
  "type": "reload",
  "reason": "regenerate-succeeded",
  "occurredAt": "2026-06-13T00:00:00.000Z"
}
```

## Boundary Contract

Hono 境界では以下を分離する。

1. HTTP ルート
2. 入力形式の検証
3. HTTP エラーへの変換
4. application 層呼び出し

この分離により、Phase 3 の保存 API を既存の文書一覧・取得 API の契約へ影響を与えず追加できることを保証する。
