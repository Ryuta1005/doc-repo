# CLI Contract: doc-repo serve（Watch + Auto Refresh）

## Scope

Story 006 の範囲で、`doc-repo serve` の監視・再生成・自動更新の契約を定義する。

## Command

```bash
doc-repo serve [options]
```

## Options

- `--port <number>`: 待受ポートを指定
- `--help`: ヘルプを表示

## Behavior Contract

1. 起動時に初回生成を行い、成功後に HTTP サーバーを起動する。
2. サーバー起動後に chokidar 監視を開始する。
3. 監視対象は解決済み rootDir 配下の `*.md`。
4. 除外対象は `.doc-repo`、`.git`、`node_modules`、および include/exclude 設定で除外されたパス。
5. 受理イベントは `add`、`change`、`unlink`。リネームは `unlink` + `add` として扱う。
6. 再生成は 300ms debounce で実行し、同時実行しない。
7. 再生成中に新規変更を検知した場合は pending とし、完了後に最新状態でもう 1 回再生成する。
8. 再生成成功時のみ SSE `reload` を配信する。
9. 再生成失敗時は SSE `reload` を送らず、標準エラーへ理由を表示する。
10. SSE 接続は開始時に登録、切断時に削除する。再接続は EventSource 標準挙動に任せる。
11. `SIGINT`/`SIGTERM` 時は watcher → 全 SSE 接続 → HTTP サーバーの順に非同期クリーンアップし、完了後に自然終了する。
12. `file://` で生成物を直接開いた場合、クライアントは SSE 接続を開始しない（閲覧のみ継続）。

## SSE Endpoint Contract

- Endpoint: `GET /events`
- Content-Type: `text/event-stream`
- Event Name: `reload`
- Event Payload:

```json
{
  "type": "reload",
  "reason": "regenerate-succeeded",
  "occurredAt": "2026-06-09T00:00:00.000Z"
}
```

## Standard Output (Examples)

```text
[doc-repo] watch: started
[doc-repo] watch: change detected path=docs/overview/product.md type=change
[doc-repo] regenerate: started
[doc-repo] regenerate: succeeded
[doc-repo] reload: dispatched clients=1
```

## Standard Error (Examples)

```text
[doc-repo] regenerate: failed reason=<error-message>
[doc-repo] shutdown: cleanup failed component=sse reason=<error-message>
```

## Exit Codes

- `0`: 正常終了（通常停止）
- `1`: 異常終了（起動失敗、初回生成失敗、入力不正、実行時致命エラー）
