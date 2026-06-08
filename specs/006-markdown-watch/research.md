# Research: 変更監視と自動更新

## Decision 1: 監視実装は chokidar を採用する

- Decision: 監視は chokidar を使い、`add`/`change`/`unlink` を受ける。
- Rationale: macOS を含むクロスプラットフォームで安定し、Node.js 標準 watch よりイベント欠落や挙動差のリスクが低い。
- Alternatives considered:
  - Node.js `fs.watch`: 依存追加は不要だが、環境差とリネーム周りの取り扱いが不安定。
  - `@parcel/watcher`: 高性能だが MVP には導入コストが高い。

## Decision 2: 再生成トリガーは 300ms debounce + pending フラグにする

- Decision: 最後の変更から 300ms 後に 1 回再生成し、実行中の変更は pending として保持して完了後に再実行する。
- Rationale: 連続保存時の無駄な多重再生成を抑えつつ、変更取りこぼしを防げる。
- Alternatives considered:
  - throttle: 末尾変更が取りこぼされる可能性。
  - 変更ごとのキュー処理: 実装は明確だが再生成回数が過剰になりやすい。

## Decision 3: ブラウザ更新通知は SSE reload を成功時のみ送信する

- Decision: `GET /events` を提供し、再生成成功時のみ `reload` イベントを送信する。
- Rationale: 要件がサーバー→ブラウザ一方向通知であり、WebSocket よりシンプルで依存追加も不要。
- Alternatives considered:
  - WebSocket: 双方向不要で過剰。
  - Polling: 不要な定期リクエストが増える。

## Decision 4: 再生成失敗時はブラウザ更新しない

- Decision: 再生成エラー時は SSE `reload` を送らず、エラー内容を標準エラーへ出力する。
- Rationale: 失敗状態を表示上で悪化させず、最後の正常生成物を維持できる。
- Alternatives considered:
  - 失敗時も強制 reload: 壊れた/古い状態への遷移が利用者にとって分かりにくい。

## Decision 5: SSE の再接続は EventSource 標準挙動に任せる

- Decision: サーバーは接続開始/切断で接続リストを管理し、定期 ping は実装しない。
- Rationale: MVP では最小実装で十分。切断時クリーンアップだけ行えばリークを防げる。
- Alternatives considered:
  - 定期 ping 導入: 維持監視は強化されるが現時点では必要性が未検証。

## Decision 6: 終了シーケンスは共通シャットダウンで順序保証する

- Decision: `SIGINT`/`SIGTERM` で watcher → SSE 接続 → HTTP サーバーの順に非同期クリーンアップし、完了後に終了コード 0 で終了する。
- Rationale: リソースリークと中途半端な通知を防ぎ、安全停止を保証できる。
- Alternatives considered:
  - 即時終了: 実装は簡単だが接続・監視リソース解放が不明瞭。
