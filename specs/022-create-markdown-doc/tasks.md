# Tasks: 新規 Markdown 文書作成

**Input**: Design documents from /specs/022-create-markdown-doc/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: この feature specification では TDD の明示要求がないため、実装タスクを優先し、最終フェーズで既存テスト群による回帰検証を行う。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 新規作成 feature の実装準備を整える

- [ ] T001 Create create-document fixture workspace in tests/fixtures/create-document/ (supports FR-012, FR-015, FR-020)
- [ ] T002 Add create-document API contract document reference in specs/022-create-markdown-doc/contracts/http-document-create-contract.md (supports FR-016, SC-003)
- [ ] T003 [P] Add viewer sidebar create UX verification notes in specs/022-create-markdown-doc/quickstart.md (supports SC-001, SC-007)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全 user story で共通利用する作成ドメインと HTTP 境界を整備する

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define document-create request/response domain types in src/shared/types.ts
- [ ] T005 [P] Add document-create error categories and mapper inputs in src/shared/errors.ts
- [ ] T006 Implement create-target resolution and scope validation utility in src/core/document/resolveCreateTarget.ts
- [ ] T007 [P] Implement safe markdown file creation utility (no overwrite) in src/core/document/createMarkdownDocument.ts
- [ ] T008 Implement create document application use case skeleton in src/application/documents/createDocument.ts
- [ ] T009 Wire create document use case export in src/application/documents/index.ts
- [ ] T010 Add create request validator in src/presentation/http/validation/createDocumentRequestValidator.ts
- [ ] T011 Add create route registration placeholder in src/presentation/http/routes/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - サイドバーのホバー `+` から新規作成する (Priority: P1) 🎯 MVP

**Goal**: ファイル/フォルダ行のホバー `+` から作成画面へ遷移し、作成成功後にツリー更新・選択を完了できる

**Independent Test**: 任意ノードにホバーして `+` クリック後、作成成功で新規文書が選択され、サイドバー表示が拡張子なしになることを確認する

### Implementation for User Story 1

- [ ] T012 [P] [US1] Add sidebar hover action rendering for per-node `+` button in src/viewer/components/DocumentTree.tsx
- [ ] T013 [US1] Add create-screen/dialog component for filename-only input in src/viewer/components/CreateDocumentDialog.tsx
- [ ] T014 [P] [US1] Add createDocument API client method in src/viewer/services/apiClient.ts
- [ ] T015 [US1] Implement create document HTTP route handler in src/presentation/http/routes/documentCreateRoute.ts
- [ ] T016 [US1] Connect create route into route registry in src/presentation/http/routes/index.ts
- [ ] T017 [US1] Implement create document use case orchestration in src/application/documents/createDocument.ts
- [ ] T018 [US1] Add create flow state (anchor context, pending, result) in src/viewer/state/viewerState.ts
- [ ] T019 [US1] Integrate hover `+` -> create dialog -> submit flow in src/viewer/App.tsx
- [ ] T020 [US1] Refresh document tree and auto-select created document in src/viewer/hooks/useViewerState.ts
- [ ] T021 [US1] Ensure sidebar label mapping displays extensionless names for all Markdown documents (existing + newly created) in src/viewer/navigation.ts and src/viewer/components/DocumentTree.tsx

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 不正な作成要求を安全に拒否する (Priority: P2)

**Goal**: ファイル名/拡張子/スコープ/重複に関する不正ケースを安全に拒否し、理由を提示する

**Independent Test**: `.txt`、`/` 含み、rootDir 外、include/exclude 対象外、同名重複を個別に実施し、すべて拒否と理由表示を確認する

### Implementation for User Story 2

- [ ] T022 [US2] Enforce filename-only and extension auto-append/reject rules in src/presentation/http/validation/createDocumentRequestValidator.ts
- [ ] T023 [US2] Implement include/exclude/rootDir/traversal policy checks in src/core/document/resolveCreateTarget.ts
- [ ] T024 [US2] Implement duplicate-file rejection without overwrite in src/core/document/createMarkdownDocument.ts
- [ ] T025 [P] [US2] Map create validation failures to HTTP error payloads in src/presentation/http/errors/httpErrorMapper.ts
- [ ] T026 [US2] Return user-readable rejection reasons from create route in src/presentation/http/routes/documentCreateRoute.ts
- [ ] T027 [US2] Surface create failure messages and retry guidance in src/viewer/components/ErrorBanner.tsx
- [ ] T028 [US2] Keep internal `.md` identifier and extensionless sidebar label consistency in src/viewer/state/viewerState.ts

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - 未保存変更ガードを保ったまま作成する (Priority: P3)

**Goal**: 未保存変更がある場合でも既存確認フローを尊重して create 操作を継続/中止できる

**Independent Test**: 未保存状態で `+` を押し、既存確認ダイアログの選択に応じて create 継続/中止が正しく分岐することを確認する

### Implementation for User Story 3

- [ ] T029 [US3] Extend unsaved-changes guard transitions for create entry action in src/viewer/state/viewerState.ts
- [ ] T030 [P] [US3] Reuse unsaved changes dialog for create confirmation branch in src/viewer/components/UnsavedChangesDialog.tsx
- [ ] T031 [US3] Integrate create-entry guard handling in app-level interaction flow in src/viewer/App.tsx
- [ ] T032 [US3] Ensure create dialog opening is blocked/unblocked by guard decision in src/viewer/components/CreateDocumentDialog.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 仕様整合、手順整備、最終検証を実施する

- [ ] T033 [P] Update create feature usage documentation in README.md and README.ja.md (cross-cutting support for FR-001-FR-021)
- [ ] T034 [P] Update editing guide for sidebar hover `+` flow in docs/editing.md and docs/editing.ja.md (supports SC-001)
- [ ] T035 Run quickstart scenario verification and record outcomes guidance in specs/022-create-markdown-doc/quickstart.md (supports SC-001-SC-007)
- [ ] T036 Execute focused regression verification references for create flow in tests/contract/http-errors.test.ts and src/viewer/navigation.test.ts (supports FR-010-FR-016, FR-021)
- [ ] T037 Add explicit SC-005 latency verification task (create success to tree reflect/select <= 2s) in specs/022-create-markdown-doc/quickstart.md and tests/regression/create-sidebar-latency.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 create baseline (route + state + UI)
- **User Story 3 (Phase 5)**: Depends on User Story 1 interaction baseline and existing unsaved guard behavior
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First MVP slice; no dependency on other stories after Foundation
- **User Story 2 (P2)**: Depends on US1 create success baseline, but remains independently testable as rejection behavior
- **User Story 3 (P3)**: Depends on US1 create entry flow and existing unsaved guard foundation from prior feature

### Within Each User Story

- Shared validator/policy updates before route error mapping
- Route/API behavior before viewer error rendering
- Viewer state updates before App-level integration
- App-level integration before quickstart verification

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005 and T007 can run in parallel after T004 starts
- In US1, T012 and T014 can run in parallel after Phase 2
- In US2, T025 and T027 can run in parallel after T022-T024 baseline
- In US3, T030 can run in parallel with T029 once guard transition design is fixed
- T033 and T034 can run in parallel after user stories complete

---

## Parallel Example: User Story 1

```bash
Task: "Add sidebar hover action rendering for per-node + button in src/viewer/components/DocumentTree.tsx"
Task: "Add createDocument API client method in src/viewer/services/apiClient.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Map create validation failures to HTTP error payloads in src/presentation/http/errors/httpErrorMapper.ts"
Task: "Surface create failure messages and retry guidance in src/viewer/components/ErrorBanner.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Extend unsaved-changes guard transitions for create entry action in src/viewer/state/viewerState.ts"
Task: "Reuse unsaved changes dialog for create confirmation branch in src/viewer/components/UnsavedChangesDialog.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm hover `+` -> create -> tree refresh -> auto-select flow

### Incremental Delivery

1. Foundation (Phase 1-2)
2. Deliver US1 (MVP)
3. Add US2 safety rejection behaviors
4. Add US3 unsaved guard integration for create entry
5. Polish docs and regression verification

### Parallel Team Strategy

1. Developer A: application/core create domain and HTTP route
2. Developer B: viewer sidebar/create UI and state wiring
3. Developer C: error messaging/docs/verification updates

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]-[US3] labels map tasks to spec user stories
- Keep Story 022 scope limited to create flow; delete behavior is Story 023
- Preserve internal `.md` filenames while keeping sidebar display extensionless
