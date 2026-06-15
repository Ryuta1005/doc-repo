# Contract: Save API（Story 010）

## Scope

Story 010 で追加する保存 API の最小契約を定義する。

- 編集内容の Markdown 保存
- 保存対象検証
- 保存前警告
- 保存結果通知（成功/失敗3分類）

競合検知（更新時刻比較、内容ハッシュ比較、保存拒否）は Story 011 の責務とし、この契約では扱わない。

## Endpoint

- Method: POST
- Path: /api/document/save
- Content-Type: application/json

## Request

```json
{
  "identifier": "docs/guide/getting-started.md",
  "markdownContent": "# Getting Started\n\nUpdated body",
  "options": {
    "newlineStyle": "lf",
    "hasTrailingNewline": true
  }
}
```

Request Rules:

- identifier は rootDir 配下の正規化相対パス
- identifier は `.md` のみ許容
- include 対象かつ exclude 対象外のみ許容
- `..` を含むパス移動は拒否

## Success Response

- Status: 200

```json
{
  "status": "saved",
  "savedDocument": {
    "identifier": "docs/guide/getting-started.md"
  },
  "warnings": []
}
```

保存成功後、クライアントは最新表示を再取得して閲覧画面へ反映できること。

## Warning Contract

未対応要素により変換または欠損可能性がある場合は、保存実行前に警告を提示できる情報を返す。

- Status: 200

```json
{
  "status": "warning",
  "warnings": [
    {
      "code": "UNSUPPORTED_SEGMENT_DETECTED",
      "message": "未対応要素が含まれます。原文保持を優先しますが、保持不能な場合は内容が変化する可能性があります。"
    }
  ],
  "allowProceed": true
}
```

## Failure Response

- Status: 400 or 404 or 500

```json
{
  "status": "failed",
  "error": {
    "category": "invalid-target | unwritable-target | transient-io",
    "code": "SAVE_TARGET_INVALID | SAVE_TARGET_UNWRITABLE | SAVE_IO_TEMPORARY",
    "message": "human readable message",
    "retryable": true
  }
}
```

Failure Category Rules:

1. invalid-target

- rootDir 外、非 Markdown、include/exclude 不一致、パストラバーサル
- retryable: false

2. unwritable-target

- 対象文書不存在、書き込み権限不足
- retryable: false（利用者による環境修正後は再試行可）

3. transient-io

- 一時的な I/O エラー、ファイルロック等
- retryable: true

## Non-Goals in This Contract

- 競合検知とバージョン照合
- HTTP ステータスと内部エラーコードの詳細粒度最適化
- エンコード不正、サイズ超過の独立分類

## Verification Checklist

- 有効な `.md` 対象に保存できる
- 非 `.md`、ルート外、exclude 対象は拒否される
- 未対応要素がある場合、保存前警告が提示される
- 失敗時に 3 分類、理由、再試行可否が利用者へ提示される
- 保存成功後に閲覧表示が最新化される
