# Tasks: ローカルサーバー起動

**Input**: Design documents from `/specs/005-local-server-serve/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/cli-contract.md

**Tests**: Story 005 はテスト先行で進める。各ユーザーストーリーで先に失敗テストを作成し、実装で通す。

**Organization**: タスクはユーザーストーリー単位で独立実装・独立検証できるように整理する。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: serve 機能の実装着手に必要な最小の土台を揃える

- [x] T001 005 向けタスク・受け入れ条件の参照リンクを specs/005-local-server-serve/quickstart.md に追記する
- [x] T002 serve 機能用のテストファイル雛形を src/core/serve/runServe.test.ts と src/core/serve/startStaticServer.test.ts に作成する
- [x] T003 [P] CLI 契約に合わせたコマンド使用例を specs/005-local-server-serve/contracts/cli-contract.md に補足する

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーで共通利用する設定解決・型・エラー基盤を先に確立する

**⚠️ CRITICAL**: この Phase 完了前に US1/US2/US3 実装へ進まない

- [ ] T004 設定解決結果の型を src/shared/types.ts に追加する（ServeConfiguration, ServeSession, ServeStepResult, ServeFailure）
- [ ] T005 [P] serve 失敗種別と利用者向けメッセージ変換を src/shared/errors.ts に追加する（invalid-port, port-conflict, initial-generate-failed, missing-output）
- [ ] T006 doc-repo.config.json と CLI 引数の統合解決関数を src/cli/serve/resolveServeOptions.ts に作成する
- [ ] T007 [P] resolveServeOptions の単体テストを src/cli/serve/resolveServeOptions.test.ts に追加する（CLI > config > default、port 検証）
- [ ] T008 serve 実行で利用する終了コードマッピングを src/cli/exitCode.ts と src/cli/exitCode.test.ts に拡張する

**Checkpoint**: 設定優先順位と異常分類の基盤が整い、各ストーリーの実装に着手可能

---

## Phase 3: User Story 1 - ワンコマンドで閲覧開始する (Priority: P1) 🎯 MVP

**Goal**: serve 実行時に 初回生成 -> サーバー起動 -> 監視開始 の順序を成立させ、初回生成失敗時は起動を抑止する

**Independent Test**: 生成物なし状態で serve を実行して URL 表示まで到達すること、生成失敗時にサーバー未起動かつ終了コード 1 になることを確認する

### Tests for User Story 1 (Write first and fail)

- [ ] T009 [P] [US1] orchestration 順序の失敗テストを src/core/serve/runServe.test.ts に追加する（generate -> start-server -> start-watch）
- [ ] T010 [P] [US1] 初回生成失敗時に start-server を呼ばない失敗テストを src/core/serve/runServe.test.ts に追加する
- [ ] T011 [P] [US1] serve コマンドの契約テストを src/cli/index.test.ts に追加する（成功時 URL 出力、失敗時 stderr/exitCode=1）

### Implementation for User Story 1

- [ ] T012 [US1] serve オーケストレーション本体を src/core/serve/runServe.ts に実装する（初回生成、配信開始、監視開始フック）
- [ ] T013 [US1] HTTP 配信専用サーバーを src/core/serve/startStaticServer.ts に実装する（生成処理を含めない）
- [ ] T014 [US1] CLI へ serve サブコマンドを追加し runServe を接続するため src/cli/index.ts を更新する
- [ ] T015 [US1] 起動メッセージ整形を src/cli/formatResultMessage.ts と src/cli/formatResultMessage.test.ts に追加する（generate success / serve URL / watch started）
- [ ] T016 [US1] 初回生成失敗時の利用者向けエラー文言と終了制御を src/core/serve/runServe.ts と src/cli/index.ts に反映する

**Checkpoint**: US1 単独でワンコマンド起動と fail-fast が成立

---

## Phase 4: User Story 2 - 利用環境に合わせてポートを調整する (Priority: P2)

**Goal**: port の優先順位を CLI > config > default で解決し、URL 表示と実際の待受を一致させる

**Independent Test**: default(4000), config 指定, CLI 上書きの 3 ケースで起動ポートと表示 URL が一致することを確認する

### Tests for User Story 2 (Write first and fail)

- [ ] T017 [P] [US2] ポート解決優先順位の統合テストを src/cli/serve/resolveServeOptions.test.ts に追加する（CLI 優先）
- [ ] T018 [P] [US2] port 未指定時の default 4000 と URL 表示のテストを src/core/serve/runServe.test.ts に追加する
- [ ] T019 [P] [US2] 設定ファイル port 適用の CLI 実行テストを tests/npm-run-dev.test.ts に追加する

### Implementation for User Story 2

- [ ] T020 [US2] serve コマンドへ --port オプションを追加し解決値を runServe へ渡すため src/cli/index.ts を更新する
- [ ] T021 [US2] 解決済みポートを startStaticServer に連携するため src/core/serve/runServe.ts と src/core/serve/startStaticServer.ts を更新する
- [ ] T022 [US2] 無効 port（非整数・範囲外）を起動前に失敗させるため src/cli/serve/resolveServeOptions.ts と src/shared/errors.ts を更新する

**Checkpoint**: US2 単独でポート優先順位と入力検証が成立

---

## Phase 5: User Story 3 - 安全に停止し問題時に原因を把握する (Priority: P3)

**Goal**: 停止操作で安全に終了でき、ポート競合時に原因を明示して終了コード 1 で終了する

**Independent Test**: 起動後に停止操作でポート解放されること、ポート競合時に識別可能なエラーが出ることを確認する

### Tests for User Story 3 (Write first and fail)

- [ ] T023 [P] [US3] 停止操作でサーバー close が呼ばれる失敗テストを src/core/serve/startStaticServer.test.ts に追加する
- [ ] T024 [P] [US3] ポート競合時の失敗テストを src/core/serve/startStaticServer.test.ts に追加する（EADDRINUSE -> port-conflict）
- [ ] T025 [P] [US3] 競合時の CLI 出力と終了コード確認テストを src/cli/index.test.ts に追加する

### Implementation for User Story 3

- [ ] T026 [US3] SIGINT/SIGTERM 受信時の安全停止処理を src/core/serve/runServe.ts に実装する（close 完了待ち）
- [ ] T027 [US3] ポート競合を利用者向けメッセージへ変換する処理を src/core/serve/startStaticServer.ts と src/shared/errors.ts に実装する
- [ ] T028 [US3] サーバー停止後にセッション終了状態を反映するため src/shared/types.ts と src/core/serve/runServe.ts を更新する

**Checkpoint**: US3 単独で安全停止と原因特定可能な異常終了が成立

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ストーリー横断の整合性確認とドキュメント更新

- [ ] T029 [P] quickstart の手順を実装結果へ同期するため specs/005-local-server-serve/quickstart.md を更新する
- [ ] T030 [P] 契約との差分を解消するため specs/005-local-server-serve/contracts/cli-contract.md を更新する
- [ ] T031 serve の利用説明と制約（サーバーは配信専任）を README.ja.md と README.md に追記する
- [ ] T032 全テスト実行コマンドと手動検証結果を specs/005-local-server-serve/tasks.md の末尾ログ欄に記録する

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): 依存なし
- Foundational (Phase 2): Phase 1 完了後に開始、全ストーリーをブロック
- User Story phases (Phase 3-5): Phase 2 完了後に開始可能
- Polish (Phase 6): US1/US2/US3 完了後

### User Story Dependencies

- US1 (P1): Foundational 完了後に開始可能
- US2 (P2): Foundational 完了後に開始可能。ただし実行確認は US1 の serve 起動基盤を利用
- US3 (P3): Foundational 完了後に開始可能。ただし停止確認は US1 実装済みを前提

### Dependency-Ordered Delivery Graph

1. Phase 1 Setup
2. Phase 2 Foundational
3. US1 (MVP)
4. US2
5. US3
6. Phase 6 Polish

---

## Parallel Opportunities

- Phase 1: T003 は T001/T002 と並行可能
- Phase 2: T005 と T007 は T004/T006 と別ファイルで並行可能
- US1: T009/T010/T011 は同時着手可能（すべてテスト）
- US2: T017/T018/T019 は同時着手可能（すべてテスト）
- US3: T023/T024/T025 は同時着手可能（すべてテスト）
- Polish: T029/T030 は並行可能

## Parallel Example: User Story 1

- Task: T009 [US1] src/core/serve/runServe.test.ts の順序テスト追加
- Task: T010 [US1] src/core/serve/runServe.test.ts の生成失敗テスト追加
- Task: T011 [US1] src/cli/index.test.ts の CLI 契約テスト追加

## Parallel Example: User Story 2

- Task: T017 [US2] src/cli/serve/resolveServeOptions.test.ts の優先順位テスト追加
- Task: T018 [US2] src/core/serve/runServe.test.ts の default ポートテスト追加
- Task: T019 [US2] tests/npm-run-dev.test.ts の設定ファイル適用テスト追加

## Parallel Example: User Story 3

- Task: T023 [US3] src/core/serve/startStaticServer.test.ts の停止テスト追加
- Task: T024 [US3] src/core/serve/startStaticServer.test.ts の競合テスト追加
- Task: T025 [US3] src/cli/index.test.ts の競合時 CLI テスト追加

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 と Phase 2 を完了する
2. US1 のテスト（T009-T011）を先に失敗させる
3. US1 実装（T012-T016）でテストを通す
4. Quickstart の US1 手順で動作確認する

### Incremental Delivery

1. US1 を完成させてワンコマンド起動価値を先に提供する
2. US2 を追加して環境適応性（port precedence）を提供する
3. US3 を追加して運用性（安全停止・原因可視化）を提供する
4. 最後に Phase 6 でドキュメントと契約を同期する

---

## Notes

- [P] は「別ファイル」かつ「未完了タスク依存なし」の場合のみ付与
- 各ユーザーストーリーで必ず失敗テストを先に作る
- FR-001/FR-009/FR-010/FR-011 を US1-US3 にマッピング済み

## Validation Log

- 実装時にここへ実行コマンドと結果を追記する
