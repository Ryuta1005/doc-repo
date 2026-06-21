# Tasks: Markdown文書/フォルダ削除

**Input**: Design documents from /specs/023-delete-markdown-doc/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: この feature specification では TDD の明示要求がないため、実装タスクを優先し、各 user story 完了時と最終フェーズで focused regression を実行する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 削除 feature の実装準備と検証素材を整える

- [x] T001 Create delete-feature fixture workspace with managed/unmanaged folder cases in tests/fixtures/delete-document/ (supports FR-014, FR-015, SC-007)
- [x] T002 Add delete API contract reference notes in specs/023-delete-markdown-doc/contracts/http-document-delete-contract.md (supports FR-022, SC-003)
- [x] T003 [P] Add sidebar delete UX verification notes in specs/023-delete-markdown-doc/quickstart.md (supports SC-001, SC-004, SC-007)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全 user story で共通利用する削除ドメイン、HTTP 境界、型を整備する

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define delete request/response domain types in src/shared/types.ts
- [x] T005 [P] Add delete error categories and guidance mapping in src/shared/errors.ts
- [x] T006 Implement delete-target resolution and scope validation utility in src/core/document/resolveDeleteTarget.ts
- [x] T007 [P] Implement folder deletion preflight inspection utility in src/core/document/inspectFolderDeletionScope.ts
- [x] T007b [P] Add unit tests for folder preflight: empty folder, managed-only, unmanaged-mixed, deeply-nested mixed, include/exclude edge cases in src/core/document/inspectFolderDeletionScope.test.ts (supports Constitution Gate-5, FR-015, SC-007)
- [x] T008 [P] Implement safe delete executor for file/folder targets in src/core/document/deleteDocumentTarget.ts
- [x] T009 Implement delete document application use case skeleton in src/application/documents/deleteDocument.ts
- [x] T010 Wire delete document use case export in src/application/documents/index.ts
- [x] T011 Add delete request validator in src/presentation/http/validation/deleteDocumentRequestValidator.ts
- [x] T012 Add delete route registration placeholder in src/presentation/http/routes/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - ミートボールメニューから削除する (Priority: P1) 🎯 MVP

**Goal**: サイドバーのファイル/フォルダ行 hover menu から削除確認へ進み、削除成功後にツリー更新と次選択を完了できる

**Independent Test**: 任意の file/folder 行にホバーしてミートボールメニューを開き、`Trash2 + 削除` から確認ダイアログを経て削除成功し、対象がツリーから消えて残存項目または空状態へ遷移することを確認する

### Implementation for User Story 1

- [x] T013 [P] [US1] Add per-row hover ellipsis trigger rendering for file and folder rows in src/viewer/components/DocumentTree.tsx
- [x] T014 [US1] Add sidebar row menu state and destructive menu item rendering in src/viewer/components/DocumentTree.tsx and src/viewer/styles.css
- [x] T015 [P] [US1] Add delete confirmation dialog component with destructive/cancel button styling in src/viewer/components/DeleteConfirmationDialog.tsx
- [x] T016 [P] [US1] Add deleteDocument API client method in src/viewer/services/apiClient.ts
- [x] T017 [US1] Implement delete document HTTP route handler in src/presentation/http/routes/documentDeleteRoute.ts
- [x] T018 [US1] Connect delete route into route registry and Hono server pipeline in src/presentation/http/routes/index.ts, src/presentation/http/createServer.ts, and src/presentation/http/server/startStaticServer.ts
- [x] T019 [US1] Implement delete document use case orchestration for file and folder success paths in src/application/documents/deleteDocument.ts
- [x] T020 [US1] Add delete flow state and result transitions in src/viewer/state/viewerState.ts
- [x] T021 [US1] Integrate hover menu -> confirm dialog -> delete submit flow in src/viewer/App.tsx
- [x] T022 [US1] Refresh document tree and resolve fallback selection after delete in src/viewer/hooks/useViewerState.ts and src/viewer/App.tsx

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 不正な削除要求を安全に拒否する (Priority: P2)

**Goal**: rootDir/scope/存在/フォルダ配下 unmanaged content に関する不正ケースを安全に拒否し、理由を提示する

**Independent Test**: `.md` 以外 file、rootDir 外、include/exclude 対象外、存在しない target、unmanaged entry を含む folder を個別に実施し、すべて拒否と理由表示を確認する

### Implementation for User Story 2

- [x] T023 [US2] Enforce target-type and path validation rules in src/presentation/http/validation/deleteDocumentRequestValidator.ts
- [x] T024 [US2] Implement include/exclude/rootDir/traversal policy checks for delete targets in src/core/document/resolveDeleteTarget.ts
- [x] T025 [US2] Implement reject-on-unmanaged-content folder preflight in src/core/document/inspectFolderDeletionScope.ts
- [x] T026 [US2] Ensure delete executor never performs partial delete after failed preflight in src/core/document/deleteDocumentTarget.ts
- [x] T027 [P] [US2] Map delete failures to HTTP error payloads in src/presentation/http/errors/httpErrorMapper.ts and related shared error helpers
- [x] T028 [US2] Return user-readable rejection reasons from delete route in src/presentation/http/routes/documentDeleteRoute.ts
- [x] T029 [US2] Surface delete failure messages and retry guidance in src/viewer/errorMessages.ts and src/viewer/components/ErrorBanner.tsx

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - 未保存変更ガードを保ったまま削除する (Priority: P3)

**Goal**: 未保存変更がある場合でも既存確認フローを尊重して delete 操作を継続/中止できる

**Independent Test**: 未保存状態で削除メニューを開き、既存確認ダイアログの選択に応じて delete 確認継続/中止が正しく分岐することを確認する

### Implementation for User Story 3

- [x] T030 [US3] Extend unsaved-changes guard transitions for delete entry action in src/viewer/state/viewerState.ts
- [x] T031 [P] [US3] Reuse existing unsaved changes dialog styling/behavior for delete interruption path in src/viewer/components/UnsavedChangesDialog.tsx and delete confirmation component
- [x] T032 [US3] Integrate delete-entry guard handling in app-level interaction flow in src/viewer/App.tsx
- [x] T033 [US3] Ensure pending delete target is cleared/restored correctly across guard decisions in src/viewer/App.tsx and src/viewer/state/viewerState.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 仕様整合、文言整備、最終検証を実施する

- [x] T034 [P] Add delete locale strings for menu, dialog, and failure reasons in src/viewer/locale/messages.ts
- [x] T035 [P] Update editing and README docs for sidebar delete flow in docs/editing.md, docs/editing.ja.md, README.md, and README.ja.md
- [x] T036 Add focused viewer component tests for hover ellipsis/menu/dialog flow in src/viewer/components/DocumentTree.test.tsx and related viewer tests
- [x] T037 Add HTTP contract tests for file delete, folder delete, and folder reject-on-unmanaged-content in tests/contract/http-document-delete.test.ts and src/presentation/http/createServer.test.ts
- [x] T038 Run quickstart scenario verification and record outcomes guidance in specs/023-delete-markdown-doc/quickstart.md (supports SC-001-SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 delete baseline (route + state + UI)
- **User Story 3 (Phase 5)**: Depends on User Story 1 interaction baseline and existing unsaved guard behavior
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First MVP slice; no dependency on other stories after Foundation
- **User Story 2 (P2)**: Depends on US1 delete success baseline, but remains independently testable as rejection behavior
- **User Story 3 (P3)**: Depends on US1 delete entry flow and existing unsaved guard foundation from prior features

### Within Each User Story

- Shared validator/policy updates before route error mapping
- Route/API behavior before viewer error rendering
- Viewer state updates before App-level integration
- App-level integration before quickstart verification

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005, T007, and T008 can run in parallel after T004 starts
- In US1, T013, T015, and T016 can run in parallel after Phase 2
- In US2, T027 and T029 can run in parallel after T023-T026 baseline
- In US3, T031 can run in parallel with T030 once guard transition design is fixed
- T034 and T035 can run in parallel after user stories complete

---

## Parallel Example: User Story 1

```bash
Task: "Add per-row hover ellipsis trigger rendering for file and folder rows in src/viewer/components/DocumentTree.tsx"
Task: "Add delete confirmation dialog component with destructive/cancel button styling in src/viewer/components/DeleteConfirmationDialog.tsx"
Task: "Add deleteDocument API client method in src/viewer/services/apiClient.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Implement reject-on-unmanaged-content folder preflight in src/core/document/inspectFolderDeletionScope.ts"
Task: "Surface delete failure messages and retry guidance in src/viewer/errorMessages.ts and src/viewer/components/ErrorBanner.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Extend unsaved-changes guard transitions for delete entry action in src/viewer/state/viewerState.ts"
Task: "Reuse existing unsaved changes dialog styling/behavior for delete interruption path in src/viewer/components/UnsavedChangesDialog.tsx and delete confirmation component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm hover ellipsis -> menu delete -> confirm dialog -> tree refresh -> fallback selection flow

### Incremental Delivery

1. Foundation (Phase 1-2)
2. Deliver US1 (MVP)
3. Add US2 safety rejection behaviors
4. Add US3 unsaved guard integration for delete entry
5. Polish docs and regression verification

### Parallel Team Strategy

1. Developer A: application/core delete domain and HTTP route
2. Developer B: viewer sidebar menu/dialog and state wiring
3. Developer C: error messaging/docs/verification updates

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]-[US3] labels map tasks to spec user stories
- Keep Story 023 scope limited to delete flow; create behavior remains Story 022
- Folder delete follows Policy B: recursive delete only for managed markdown content, reject if unmanaged content exists
