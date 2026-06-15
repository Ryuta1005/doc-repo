# Research: React + Hono ワークスペース基盤（Task 019）

## Decision 1: 文書識別子は `rootDir` からの正規化相対パスを採用する

- Decision: 文書識別子は `rootDir` からの正規化相対パスを正とする。
- Rationale: 既存ファイルとの対応が安定し、Phase 3 の保存 API でも同一文書を自然に特定できる。スキャン順序依存の採番 ID を避けられる。
- Alternatives considered:
  - 採番 ID: 再スキャン時に不安定。
  - ハッシュ ID: 安定するがデバッグ性が落ちる。
  - slug 管理: 管理コストが高い。

## Decision 2: `serve` の自動更新は既存 SSE を維持する

- Decision: `serve` のブラウザ自動更新は既存の SSE（EventSource）方式を維持し、Hono 境界へ移行する。
- Rationale: 019 の目的は体験維持であり、WebSocket 再設計はスコープ外。既存実装との整合を最小コストで確保できる。
- Alternatives considered:
  - WebSocket: 双方向要件がなく過剰。
  - Polling: 無駄なリクエストが増える。

## Decision 3: HTTP 境界は責務分離を先に固定する

- Decision: HTTP ルート、入力形式の検証、HTTP エラーへの変換、application 呼び出しを分離する。
- Rationale: Phase 3 で保存 API を非破壊追加するため、019 で境界設計を先に固定する必要がある。
- Alternatives considered:
  - ルート内で直接 core 呼び出し: 実装は早いが拡張時に破綻しやすい。

## Decision 4: 体験維持の評価は「固定値」ではなく「同等性」で判定する

- Decision: 性能基準は固定数値（1 秒、200ms、1 万件/秒）を使わず、既存 Phase 2 との同等性・著しい劣化なしで判定する。
- Rationale: 019 は性能改善タスクではなく移行タスク。環境依存の固定閾値は誤判定を招く。
- Alternatives considered:
  - 固定値を採用: CI/ローカル差で不安定。
  - 性能改善目標を追加: 019 のスコープを超える。

## Decision 5: React UI と build の関係は `serve` 前提で定義し、build 互換を壊さない

- Decision: React UI は core に直接依存しない。`serve` 時のサーバー管理データは Hono HTTP API 経由で取得する。`build` は既存の主要契約とオフライン閲覧方法を維持する。
- Rationale: `serve` と `build` の実行形態が異なるため、依存関係を混同しない方が安全。
- Alternatives considered:
  - React UI が常に HTTP API 前提: `build` オフライン閲覧との矛盾リスク。

## Decision 6: 回帰テストは移行前に固定し、移行後に同期待結果を検証する

- Decision: 回帰対象を明示し、移行前後で同期待結果を確認する（serve 起動、左ツリー、文書選択/本文、画像/静的アセット、Markdown 変更、ファイル add/unlink、自動更新、build、オフライン閲覧）。
- Rationale: 「既存テストが通る」だけでは体験カバレッジ不足の可能性があるため。
- Alternatives considered:
  - 既存テストパスのみ: 要件の取りこぼしリスク。

## Decision 7: アーキテクチャ文書を恒久化する

- Decision: React、Hono、application、core、静的生成の責務と依存方向を `project/overview/application-architecture.md` に整理する。
- Rationale: 010 以降で設計説明が散らばるのを防ぎ、Phase 横断の共通参照を作る。
- Alternatives considered:
  - 019 の plan.md のみに記載: 将来タスクで再説明が増える。

## Deferred Refactoring Candidates（019スコープ外）

- `core/serve` には watcher制御、CLI実行フロー、運用ログなどの責務が引き続き混在している。
- 019 では Hono 移行の必須範囲に限定し、HTTP 配信/SSE 接続管理のみ `src/presentation/http` へ移設した。
- 残件は別リファクタリングとして、`runServe` のオーケストレーション分割（application サービス化、infrastructure 抽出）を次フェーズで扱う。
