# Tasks: ワンコマンド生成

**Input**: Design documents from `/specs/002-one-command-generate/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: この feature spec では TDD/自動テスト先行の明示要求がないため、本タスクでは実装と受け入れ確認を優先する。

**Organization**: タスクはユーザーストーリー単位で構成し、各ストーリーが独立して検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript CLI プロジェクトの初期化

- [x] T001 Initialize npm CLI package metadata and scripts in package.json
- [x] T002 Configure TypeScript build settings in tsconfig.json
- [x] T003 Create source and test directory skeleton in src/ and tests/
- [x] T004 Add runtime dependencies for CLI generation in package.json
- [x] T005 Add HTML/CSS/JS template placeholders in templates/index.html, templates/styles.css, templates/app.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通する基盤を先に完成させる

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー実装へ進まない

- [x] T006 Define shared domain types and result contracts in src/shared/types.ts
- [x] T007 [P] Implement structured CLI logger utilities in src/shared/logger.ts
- [x] T008 [P] Implement root detection (git root or cwd fallback) in src/core/scanner/detectRoot.ts
- [x] T009 [P] Implement markdown file discovery with fast-glob in src/core/scanner/scanMarkdown.ts
- [x] T010 [P] Implement markdown-to-HTML conversion with markdown-it in src/core/parser/convertMarkdown.ts
- [x] T011 Implement static site assembly pipeline in src/core/site/buildSiteBundle.ts
- [x] T012 Implement staging and atomic directory swap utility in src/core/site/atomicPublish.ts
- [x] T013 Wire top-level generation use case orchestration in src/core/site/generateSite.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 1回実行でサイト生成できる (Priority: P1) 🎯 MVP

**Goal**: 引数なしの1回実行で `.doc-repo` に閲覧可能サイトを生成する

**Independent Test**: Markdown を含むリポジトリで `npx doc-repo` を1回実行し、`.doc-repo/index.html` が生成されブラウザ表示できることを確認する

### Implementation for User Story 1

- [x] T014 [US1] Implement CLI entrypoint and command execution flow in src/cli/index.ts
- [x] T015 [US1] Connect CLI to generateSite use case and default output path `.doc-repo` in src/cli/index.ts
- [x] T016 [US1] Generate navigation data and page payload JSON in src/core/site/buildSiteBundle.ts
- [x] T017 [US1] Render final viewer HTML from templates in src/core/site/renderViewer.ts
- [x] T018 [US1] Copy bundled static assets into staging output in src/core/site/copyAssets.ts
- [x] T019 [US1] Export CLI binary mapping for one-command invocation in package.json

**Checkpoint**: User Story 1 should be functional and demonstrable as MVP

---

## Phase 4: User Story 2 - 実行結果を判別できる (Priority: P2)

**Goal**: 成功・失敗・警告付き成功を利用者が即時判別できる

**Independent Test**: 正常ケース、Markdown 0件ケース、失敗ケースで実行し、メッセージと終了コードが仕様どおりであることを確認する

### Implementation for User Story 2

- [x] T020 [US2] Implement execution summary formatter for success/warning/failure in src/cli/formatResultMessage.ts
- [x] T021 [US2] Implement exit code mapping policy (success=0, warning-success=0, failure!=0) in src/cli/exitCode.ts
- [x] T022 [US2] Emit mandatory warning when markdown file count is zero in src/core/site/generateSite.ts
- [x] T023 [US2] Add failure reason categorization and user guidance messages in src/shared/errors.ts
- [x] T024 [US2] Integrate result messaging and exit code handling in src/cli/index.ts

**Checkpoint**: User Story 2 should be independently verifiable from CLI output behavior

---

## Phase 5: User Story 3 - 再実行して更新できる (Priority: P3)

**Goal**: 同じコマンド再実行で出力を最新化し、残骸を残さない

**Independent Test**: 1回目生成後にMarkdownを更新して再実行し、更新内容が反映され、古い成果物が残っていないことを確認する

### Implementation for User Story 3

- [x] T025 [US3] Ensure full rebuild is always performed before publish in src/core/site/generateSite.ts
- [x] T026 [US3] Enforce replace-all publish semantics for existing `.doc-repo` in src/core/site/atomicPublish.ts
- [x] T027 [US3] Preserve previous published output on mid-build failure in src/core/site/atomicPublish.ts
- [x] T028 [US3] Add rerun-specific operational logs (rebuild, swap, preserve) in src/shared/logger.ts

**Checkpoint**: User Story 3 should be independently demonstrable with rerun update flow

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複数ストーリー横断の最終調整

- [x] T029 [P] Update CLI usage and behavior notes in README.md
- [x] T030 [P] Sync implementation notes with quickstart in specs/002-one-command-generate/quickstart.md
- [x] T031 Validate quickstart scenarios end-to-end and capture deviations in specs/002-one-command-generate/quickstart.md
- [x] T032 Update Story 002 status and implementation notes in docs/project/backlog/001_リポジトリMarkdownをブラウザで閲覧可能にする/002_生成者はワンコマンドで生成できる_なぜならすぐにドキュメントサイトを生成したいから.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): 依存なし
- Foundational (Phase 2): Phase 1 完了後に開始、全ストーリーをブロック
- User Stories (Phase 3-5): Phase 2 完了後に開始可能
- Polish (Phase 6): 必要なユーザーストーリー完了後

### User Story Dependencies

- US1 (P1): Foundational 完了後すぐ着手可能、他ストーリーへの依存なし
- US2 (P2): Foundational 完了後すぐ着手可能、US1 に依存しない
- US3 (P3): Foundational 完了後すぐ着手可能、ただし検証時に US1 成果物を利用すると効率的

### Within Each User Story

- CLI 経路実装 -> コア連携 -> 受け入れ確認
- 共有ファイル編集が競合しないタスクは [P] で並列可能

### Parallel Opportunities

- Phase 2: T007, T008, T009, T010 は並列可能
- US2: T020, T021, T023 は並列可能（統合は T024）
- Phase 6: T029, T030 は並列可能

---

## Parallel Example: User Story 2

```bash
Task: "Implement execution summary formatter for success/warning/failure in src/cli/formatResultMessage.ts"
Task: "Implement exit code mapping policy (success=0, warning-success=0, failure!=0) in src/cli/exitCode.ts"
Task: "Add failure reason categorization and user guidance messages in src/shared/errors.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate one-command generation manually using quickstart

### Incremental Delivery

1. Deliver US1 as runnable MVP
2. Add US2 for判別性（メッセージ/終了コード）
3. Add US3 for再実行更新の信頼性
4. Finish with Polish and backlog synchronization

### Parallel Team Strategy

1. One developer owns CLI entry flow (`src/cli`)
2. One developer owns scanner/parser (`src/core/scanner`, `src/core/parser`)
3. One developer owns publish pipeline (`src/core/site`)
4. Merge at phase checkpoints only

---

## Notes

- [P] tasks are safe parallel tasks with distinct file targets
- [USx] labels map tasks to story scope for traceability
- Keep Story 002 acceptance criteria as the source of truth during execution
