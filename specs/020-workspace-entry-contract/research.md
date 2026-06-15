# Decision

- 正規入口: `doc-repo serve`
- 静的生成: 即時廃止（`doc-repo [scopePath]` は正規導線から除外）
- 廃止判断: 020 で確定（010 完了待ちにしない）
- 旧 templates: 020 で削除する（残置しない）
- 010 の前提: React + Hono の同一 origin ワークスペース

## Minimal Exit Criteria for 020

- README/overview/backlog/spec で `serve` を正規入口として一貫して説明できる
- 静的生成導線が「現行の推奨経路」として記載されていない
- 静的生成専用の CLI 経路・テンプレート・専用テストの削除対象が明示されている
- 010 を `serve` 前提で設計開始できる
