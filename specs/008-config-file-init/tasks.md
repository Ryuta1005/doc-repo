# Tasks: 設定ファイル雛形の生成（doc-repo init）

**Input**: Design documents from `/specs/008-config-file-init/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-init.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: `init` 機能を実装するための最小構成を用意する

- [ ] T001 `init` 機能用モジュールを新規作成する in src/core/init/createConfigFile.ts
- [ ] T002 `init` コマンド受け口を追加するための CLI 構造を更新する in src/cli/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーで共通利用する基盤を先に整える

**⚠️ CRITICAL**: このフェーズ完了までユーザーストーリー実装に着手しない

- [ ] T003 `InitResult` 型を追加して `init` の結果契約を定義する in src/shared/types.ts
- [ ] T004 生成する `doc-repo.config.json` のデフォルト値（`rootDir/include/exclude/port=4000`）を実装する in src/core/init/createConfigFile.ts
- [ ] T005 `createConfigFile` を CLI から呼び出せるように import・呼び出し配線を整える in src/cli/index.ts

**Checkpoint**: Foundation ready - 各ユーザーストーリー実装を開始可能

---

## Phase 3: User Story 1 - 新規プロジェクトで設定ファイルを生成する (Priority: P1) 🎯 MVP

**Goal**: `doc-repo init` で `doc-repo.config.json` を新規生成し、生成パスを表示できるようにする

**Independent Test**: `doc-repo.config.json` がないディレクトリで `doc-repo init` を実行し、ファイル生成とパス表示を確認する

### Implementation for User Story 1

- [ ] T006 [US1] `doc-repo.config.json` 非存在時にファイルを書き込んで `created` を返す処理を実装する in src/core/init/createConfigFile.ts
- [ ] T007 [US1] `init` サブコマンドを追加して成功時メッセージを標準出力へ表示する in src/cli/index.ts
- [ ] T008 [P] [US1] 生成される設定値の説明を更新する in docs/config.md
- [ ] T009 [P] [US1] 生成される設定値の説明を更新する（日本語） in docs/config.ja.md

**Checkpoint**: User Story 1 が単独で動作し、MVP価値を提供できる

---

## Phase 4: User Story 2 - 既に初期化済みのプロジェクトで上書きを防ぐ (Priority: P2)

**Goal**: 既存ファイルがある場合に上書きせず、メッセージ表示のうえ終了コード `0` で終了する

**Independent Test**: `doc-repo.config.json` があるディレクトリで `doc-repo init` を実行し、内容が不変で終了コード `0` になることを確認する

### Implementation for User Story 2

- [ ] T010 [US2] `doc-repo.config.json` 存在時に `already-exists` を返して書き込みをスキップする処理を実装する in src/core/init/createConfigFile.ts
- [ ] T011 [US2] `already-exists` 時の標準出力メッセージと終了コード `0` を実装する in src/cli/index.ts
- [ ] T012 [P] [US2] 既存ファイルスキップ時の契約を反映する in specs/008-config-file-init/contracts/cli-init.md

**Checkpoint**: User Story 2 が単独で動作し、既存設定保護が保証される

---

## Phase 5: User Story 3 - 書き込み不可ディレクトリでのエラー通知 (Priority: P3)

**Goal**: 書き込み失敗時に理由を表示し、終了コード `1` で終了する

**Independent Test**: 書き込み不可ディレクトリで `doc-repo init` を実行し、失敗メッセージと終了コード `1` を確認する

### Implementation for User Story 3

- [ ] T013 [US3] 書き込み失敗を捕捉して `failure` と `errorReason` を返す処理を実装する in src/core/init/createConfigFile.ts
- [ ] T014 [US3] `failure` 時に標準エラー出力へ理由を表示し終了コード `1` を設定する in src/cli/index.ts
- [ ] T015 [P] [US3] エラー出力仕様を反映する in specs/008-config-file-init/contracts/cli-init.md

**Checkpoint**: User Story 3 が単独で動作し、失敗時の診断可能性が担保される

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 全ストーリー横断の仕上げとドキュメント整合

- [ ] T016 [P] `init` コマンドの利用例を追加する in README.md
- [ ] T017 [P] `init` コマンドの利用例を追加する（日本語） in README.ja.md
- [ ] T018 `init` の手順と出力例を最終整合する in specs/008-config-file-init/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): 依存なし
- Phase 2 (Foundational): Phase 1 完了後に着手
- Phase 3 (US1): Phase 2 完了後に着手
- Phase 4 (US2): Phase 3 完了後に着手（`init` 基本フローに依存）
- Phase 5 (US3): Phase 3 完了後に着手（`init` 基本フローに依存）
- Phase 6 (Polish): US1/US2/US3 完了後に着手

### User Story Dependencies

- US1 (P1): Foundational 完了後に独立実装可能
- US2 (P2): US1 の `init` 実行経路に依存
- US3 (P3): US1 の `init` 実行経路に依存

### Parallel Opportunities

- Phase 3: `T008` と `T009` は並列実行可能
- Phase 4: `T012` は `T011` と別ファイルのため並列実行可能
- Phase 5: `T015` は `T014` と別ファイルのため並列実行可能
- Phase 6: `T016` と `T017` は並列実行可能

---

## Parallel Example: User Story 1

```bash
# 並列で実行可能（US1ドキュメント更新）
Task: T008 docs/config.md を更新
Task: T009 docs/config.ja.md を更新
```

## Parallel Example: User Story 2

```bash
# 実装と契約更新を分担
Task: T011 src/cli/index.ts の already-exists 分岐を実装
Task: T012 specs/008-config-file-init/contracts/cli-init.md を更新
```

## Parallel Example: User Story 3

```bash
# 実装と契約更新を分担
Task: T014 src/cli/index.ts の failure 分岐を実装
Task: T015 specs/008-config-file-init/contracts/cli-init.md を更新
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 と Phase 2 を完了する
2. Phase 3 (US1) を完了する
3. `doc-repo init` 新規生成フローを検証して MVP とする

### Incremental Delivery

1. US1: 新規生成
2. US2: 既存保護（上書き防止）
3. US3: エラーハンドリング
4. Polish: README/quickstart の整合

### Suggested MVP Scope

- User Story 1 (Phase 3) のみを先行リリース対象とする

---

## Notes

- すべてのタスクは `- [ ] Txxx ...` 形式で記述
- `[USx]` ラベルはユーザーストーリーフェーズのみ付与
- `[P]` は依存のない別ファイル作業のみに付与
- テストタスクは spec で明示要求がないため今回の tasks.md では生成しない
