# Tasks: 変更監視と自動更新

**Input**: Design documents from `/specs/006-markdown-watch/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-contract.md, quickstart.md

**Tests**: この feature spec は自動テスト実装を明示要求していないため、ここでは実装タスクを優先し、最終フェーズで quickstart による動作検証を行う。

**Organization**: タスクはユーザーストーリー単位で分割し、各ストーリーを独立して実装・検証できるようにする。

## Format: `[ID] [P?] [Story?] Description`

- `[P]`: 並列実行可能タスク（別ファイル・依存なし）
- `[Story]`: ユーザーストーリー対応ラベル（`[US1]`, `[US2]`, `[US3]`）
- すべてのタスクに実ファイルパスを含める

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 監視機能導入の初期準備と依存関係追加

- [x] T001 chokidar 依存を追加し lockfile を更新する in package.json and package-lock.json
- [x] T002 監視/再生成/SSE の共通型を定義する in src/shared/types.ts
- [x] T003 [P] 監視・再生成・通知用のログメッセージ定数を追加する in src/shared/logger.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーの前提となるコア基盤

**⚠️ CRITICAL**: このフェーズ完了まで US1/US2/US3 の実装に着手しない

- [x] T004 SSE 接続管理（追加/削除/一括通知）を実装する in src/core/serve/sseConnectionRegistry.ts
- [x] T005 監視対象判定（rootDir/include/exclude + `.doc-repo`/`.git`/`node_modules` 除外）を実装する in src/core/serve/watchTargetFilter.ts
- [x] T006 300ms debounce と pending 再実行制御を持つ再生成コーディネータを実装する in src/core/serve/refreshCoordinator.ts
- [x] T007 chokidar 監視開始・停止をラップする監視ランナーを実装する in src/core/serve/startMarkdownWatcher.ts
- [x] T008 `/events` SSE エンドポイントを静的サーバーへ統合する in src/core/serve/startStaticServer.ts
- [x] T009 serve 実行時に監視ランナーと再生成コーディネータを起動接続する in src/core/serve/runServe.ts
- [x] T010 `SIGINT`/`SIGTERM` 共通シャットダウン（watcher→SSE→HTTP順、多重実行防止）を実装する in src/core/serve/runServe.ts

**Checkpoint**: 監視・再生成・SSE・安全停止の土台が完成

---

## Phase 3: User Story 1 - 保存した変更を自動反映する (Priority: P1) 🎯 MVP

**Goal**: 既存 Markdown 保存時に自動再生成し、成功時のみブラウザへ reload 通知する

**Independent Test**: `doc-repo serve` 起動中に既存 `.md` を編集保存し、変更検知→再生成→ブラウザ自動反映を確認する

### Implementation for User Story 1

- [x] T011 [US1] `change` イベントを再生成トリガーとして接続する in src/core/serve/startMarkdownWatcher.ts
- [x] T012 [US1] 再生成成功時のみ SSE `reload` を配信する処理を実装する in src/core/serve/refreshCoordinator.ts
- [x] T013 [US1] 再生成失敗時は reload 未送信でエラーを stderr 出力する処理を実装する in src/core/serve/refreshCoordinator.ts
- [x] T014 [US1] 監視開始・変更検知・再生成開始/完了ログを整備する in src/core/serve/runServe.ts
- [x] T015 [US1] ブラウザ側 EventSource 受信で `reload` 時のみ再読み込みする処理を追加する in templates/app.js
- [x] T016 [US1] serve 起動時に監視状態が分かる表示文言を調整する in src/cli/formatResultMessage.ts

**Checkpoint**: US1 単体で「保存→自動反映」が成立

---

## Phase 4: User Story 2 - 追加や削除も追従する (Priority: P2)

**Goal**: `add`/`unlink` を検知して一覧表示と本文表示を同じ最新状態に保つ

**Independent Test**: 監視中に `.md` を追加・削除し、再生成後に一覧と本文の整合が保たれることを確認する

### Implementation for User Story 2

- [x] T017 [US2] `add`/`unlink` イベントを再生成トリガーへ追加する in src/core/serve/startMarkdownWatcher.ts
- [x] T018 [US2] リネームを `unlink` + `add` として扱うイベント処理を明確化する in src/core/serve/startMarkdownWatcher.ts
- [x] T019 [US2] 監視フィルタに include/exclude と既定除外の優先順を反映する in src/core/serve/watchTargetFilter.ts
- [x] T020 [US2] add/unlink 後の再生成でサイト整合を保つ呼び出し順を調整する in src/core/serve/refreshCoordinator.ts
- [x] T021 [US2] add/unlink 検知ログ（対象パスとイベント種別）を追加する in src/core/serve/runServe.ts

**Checkpoint**: US2 単体で「追加・削除追従」が成立

---

## Phase 5: User Story 3 - 変更の進行状況を把握する (Priority: P3)

**Goal**: 監視から再生成、更新完了、停止までの進行状況を標準出力で明確にする

**Independent Test**: 監視中に変更を複数回発生させ、状態遷移ログが順序通りに表示されることを確認する

### Implementation for User Story 3

- [x] T022 [US3] WatchStatusMessage コード体系に沿ったログ出力ヘルパーを実装する in src/core/serve/watchStatusReporter.ts
- [x] T023 [US3] `CHANGE_DETECTED`/`REGEN_STARTED`/`REGEN_SUCCEEDED`/`REGEN_FAILED` の出力を統一する in src/core/serve/refreshCoordinator.ts
- [x] T024 [US3] pending 再実行発生時の状態表示を追加する in src/core/serve/refreshCoordinator.ts
- [x] T025 [US3] シャットダウン開始・完了・エラーの出力を統一する in src/core/serve/runServe.ts
- [x] T026 [US3] CLI 表示メッセージを watch 運用向けに更新する in src/cli/formatResultMessage.ts

**Checkpoint**: US3 単体で「進行状況が分かる表示」が成立

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 全ストーリー横断の仕上げと回帰確認

- [x] T027 [P] 監視・SSE・シャットダウンの unit test を追加する in src/core/serve/startMarkdownWatcher.test.ts
- [x] T028 [P] debounce/pending 制御の unit test を追加する in src/core/serve/refreshCoordinator.test.ts
- [x] T029 [P] SSE 接続管理の unit test を追加する in src/core/serve/sseConnectionRegistry.test.ts
- [x] T030 serve 統合挙動（成功時 reload、失敗時 no reload、終了順序）を検証する in src/core/serve/runServe.test.ts
- [x] T031 quickstart 手順で手動検証し結果を反映する in specs/006-markdown-watch/quickstart.md
- [x] T032 006 の受け入れ条件とのトレーサビリティを最終確認する in specs/006-markdown-watch/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): 依存なし
- Phase 2 (Foundational): Phase 1 完了後に開始、全 US をブロック
- Phase 3 (US1): Phase 2 完了後に開始
- Phase 4 (US2): Phase 2 完了後に開始（US1 完了を推奨）
- Phase 5 (US3): Phase 2 完了後に開始（US1/US2 へのログ統合作業あり）
- Phase 6 (Polish): 全 US 完了後

### User Story Dependencies

- US1 (P1): Foundational 完了後に独立して実装可能
- US2 (P2): Foundational 完了後に独立して実装可能（US1 の再生成基盤を利用）
- US3 (P3): Foundational 完了後に独立して実装可能（US1/US2 のイベントに表示統合）

### Within Each User Story

- イベント受理実装 → 再生成制御接続 → 通知/表示整備の順で進める
- 再生成成功/失敗分岐の実装後に UI reload 連携を調整する

### Parallel Opportunities

- T003 は T002 と並列可能
- T004/T005 は並列可能（別責務）
- T027/T028/T029 は並列可能（別ファイル）
- 複数開発者の場合、Foundational 完了後に US2/US3 は並列着手可能

---

## Parallel Example: User Story 1

```bash
# US1 実装で並列可能な作業例
Task: "T015 [US1] ブラウザ側 EventSource 受信で reload 時のみ再読み込みする処理を追加する in templates/app.js"
Task: "T016 [US1] serve 起動時に監視状態が分かる表示文言を調整する in src/cli/formatResultMessage.ts"
```

## Parallel Example: User Story 2

```bash
# US2 実装で並列可能な作業例
Task: "T019 [US2] 監視フィルタに include/exclude と既定除外の優先順を反映する in src/core/serve/watchTargetFilter.ts"
Task: "T021 [US2] add/unlink 検知ログ（対象パスとイベント種別）を追加する in src/core/serve/runServe.ts"
```

## Parallel Example: User Story 3

```bash
# US3 実装で並列可能な作業例
Task: "T022 [US3] WatchStatusMessage コード体系に沿ったログ出力ヘルパーを実装する in src/core/serve/watchStatusReporter.ts"
Task: "T026 [US3] CLI 表示メッセージを watch 運用向けに更新する in src/cli/formatResultMessage.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 と Phase 2 を完了する
2. Phase 3 (US1) を完了する
3. US1 の独立テストを実施し、保存→自動反映を確認する
4. MVP としてデモ可能状態にする

### Incremental Delivery

1. Foundation 完了後に US1 を提供（MVP）
2. 次に US2 を追加し、追加/削除追従を提供
3. 最後に US3 を追加し、運用時の可観測性を強化
4. 各段階で quickstart を使って回帰確認する

### Parallel Team Strategy

1. 全員で Phase 1/2 を完了する
2. 以降は担当分割:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Phase 6 で統合テストと最終整合確認を実施する

---

## Notes

- `[P]` は依存のない別ファイル作業のみ付与
- `[USx]` はストーリーフェーズの全タスクに付与
- 各ストーリーは単独で動作確認できる粒度を維持
- 仕様変更が入った場合は `spec.md` → `plan.md` → `tasks.md` の順で更新する
