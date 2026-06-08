# Research: ローカルサーバー起動

## Decision 1: `serve` はオーケストレーション層として段階実行する

- Decision: `doc-repo serve` は `初回生成 -> サーバー起動 -> 監視開始` を順番に実行する。
- Rationale: 生成と配信の責務を分離しつつ、利用者にはワンコマンド体験を提供できるため。
- Alternatives considered:
  - 生成済み前提で配信のみ: 体験が分断される。
  - 配信中に遅延生成: 失敗時の切り分けが難しくなる。

## Decision 2: HTTP サーバーは配信専任にする

- Decision: HTTP サーバーコンポーネントは生成処理を持たず、生成済みファイル配信のみを担当する。
- Rationale: Story 006 以降の監視・ホットリロード拡張時も境界を壊さずに進められる。
- Alternatives considered:
  - サーバー内部で生成も実行: 責務過多でテストと障害解析が複雑化する。

## Decision 3: 初回生成失敗時は Fail Fast で停止する

- Decision: 初回生成に失敗した場合はサーバーを起動せず、理由を表示して終了コード `1` で終了する。
- Rationale: 不完全状態での配信を防ぎ、失敗原因を利用者が即時に判断できるため。
- Alternatives considered:
  - 空ページ配信で継続: 問題を隠しやすく、期待との乖離が生まれる。
  - リトライ無限実行: CLI の制御が不透明になる。

## Decision 4: ポート解決は `CLI > 設定ファイル > デフォルト` とする

- Decision: `port` の最終値は CLI オプションを最優先し、次に設定ファイル、最後にデフォルト `4000` を採用する。
- Rationale: 一時的な実行上書きと恒久設定の両立ができ、007 の方針とも一致するため。
- Alternatives considered:
  - 設定ファイル優先: 一時上書きがしづらい。
  - CLI/設定同列: 決定規則が曖昧になる。

## Decision 5: 配信実装は Node.js 標準機能を第一候補にする

- Decision: Story 005 では追加フレームワーク依存を前提にせず、`node:http` などの標準機能で要件を満たす設計を採用する。
- Rationale: MVP の依存増加を抑え、既存 CLI アーキテクチャとの整合を維持できるため。
- Alternatives considered:
  - Hono などを直ちに導入: 将来性はあるが 005 の最小要件に対して過剰。

## Decision 6: 監視は 005 で「開始できる設計」に留める

- Decision: 005 では監視開始の orchestration フックを設け、監視条件やホットリロードの詳細は 006 で確定する。
- Rationale: Story 005 と 006 の責務境界を維持し、段階的実装を崩さないため。
- Alternatives considered:
  - 005 で監視詳細まで確定: Story 006 の価値と重複し、計画粒度が崩れる。
