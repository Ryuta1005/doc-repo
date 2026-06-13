# Tasks: リッチテキスト編集と Markdown 保存

**Input**: Design documents from /specs/010-richtext-markdown-save/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本 feature では受け入れ条件と成功指標が明確であり、HTTP 契約と主要ユーザーフローの検証が必要なため、story ごとに契約/統合テストタスクを含める。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 編集保存機能を追加するための土台を整える

- [x] T001 Create save feature test fixture markdown files in tests/fixtures/save/
- [x] T002 Create save API contract test scaffold in tests/contract/http-document-save.test.ts
- [x] T003 [P] Record Tiptap + unsupported pass-through feasibility spike conclusions in specs/010-richtext-markdown-save/research.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全 story に共通して必要な保存ドメインと HTTP 境界の基本部品を実装する

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define save request/response domain types in src/shared/types.ts
- [x] T005 [P] Add save error categories and mapping helpers in src/shared/errors.ts
- [x] T006 Implement save target validation utility (root/include/exclude/extension/path traversal) in src/core/document/validateSaveTarget.ts
- [x] T007 [P] Implement atomic markdown writer preserving newline style and trailing newline in src/core/document/writeMarkdownDocumentAtomically.ts
- [x] T008 Create markdown conversion pipeline contracts in src/core/markdown/index.ts
- [x] T009 Wire save route registration placeholder in src/presentation/http/routes/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 閲覧中文書を編集して保存する (Priority: P1) 🎯 MVP

**Goal**: 閲覧中の文書を編集モードで更新し、Markdown として保存して最新表示を確認できる

**Independent Test**: 文書を開いて編集モードで本文/見出し/太字/イタリックを変更し、保存後に閲覧表示が更新されることを確認する

### Tests for User Story 1

- [x] T010 [P] [US1] Add HTTP contract test for successful save in tests/contract/http-document-save.test.ts
- [x] T011 [P] [US1] Add viewer integration test for edit-save-return flow in src/viewer/navigation.test.ts

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement save document use case in src/application/documents/saveDocument.ts
- [x] T013 [US1] Implement save API route handler in src/presentation/http/routes/documentSaveRoute.ts
- [x] T014 [US1] Add save request validator for API payload in src/presentation/http/validation/saveDocumentRequestValidator.ts
- [x] T015 [P] [US1] Implement editor API client methods for save and pre-save warning in src/viewer/services/apiClient.ts
- [x] T016 [P] [US1] Add rich text editor component with heading/bold/italic support in src/viewer/components/DocumentEditor.tsx
- [x] T017 [P] [US1] Add editor toolbar component for heading1-3/bold/italic actions in src/viewer/components/EditorToolbar.tsx
- [x] T018 [US1] Extend viewer state for edit mode and save lifecycle in src/viewer/state/viewerState.ts
- [x] T019 [US1] Integrate editor mode toggle and save flow into viewer app shell in src/viewer/App.tsx
- [x] T020 [US1] Ensure save success triggers latest document reload in src/viewer/hooks/useViewerState.ts

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 誤操作による変更消失を防ぐ (Priority: P2)

**Goal**: 未保存変更がある状態でのファイル切替・編集終了・離脱に確認を出し、変更消失を防ぐ

**Independent Test**: 編集途中で別文書選択・編集終了・ブラウザ離脱を試し、確認ダイアログと継続/破棄動作を確認する

### Tests for User Story 2

- [x] T021 [P] [US2] Add unsaved-changes guard behavior tests in src/viewer/state/viewerState.test.ts
- [x] T022 [P] [US2] Add navigation guard integration tests in src/viewer/navigation.test.ts

### Implementation for User Story 2

- [x] T023 [US2] Implement unsaved changes guard state transitions in src/viewer/state/viewerState.ts
- [x] T024 [P] [US2] Implement browser beforeunload guard hook in src/viewer/hooks/useUnsavedChangesGuard.ts
- [x] T025 [P] [US2] Add discard confirmation dialog component in src/viewer/components/UnsavedChangesDialog.tsx
- [x] T026 [US2] Integrate document-switch and edit-exit guard handling in src/viewer/App.tsx

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - 保存リスクを事前に判断して操作する (Priority: P3)

**Goal**: 未対応要素警告、保存対象検証、保存失敗3分類提示を提供し、安全に保存操作できる

**Independent Test**: 未対応要素を含む文書と不正保存ケースを用意し、警告、拒否理由、再試行可否表示を確認する

### Tests for User Story 3

- [x] T027 [P] [US3] Add contract tests for warning response and failure categories in tests/contract/http-document-save.test.ts
- [x] T028 [P] [US3] Add integration tests for include/exclude and invalid target save rejection in tests/contract/http-errors.test.ts
- [x] T029 [P] [US3] Add conversion tests for unsupported segment pass-through behavior in src/core/markdown/serializeEditableMarkdown.test.ts

### Implementation for User Story 3

- [x] T030 [P] [US3] Implement unsupported element detection and warning builder in src/core/markdown/detectUnsupportedElements.ts
- [x] T031 [US3] Implement editable markdown parser preserving raw unsupported fragments in src/core/markdown/parseEditableMarkdown.ts
- [x] T032 [US3] Implement pass-through aware markdown serializer in src/core/markdown/serializeEditableMarkdown.ts
- [x] T033 [US3] Integrate parse/serialize warning pipeline into save use case in src/application/documents/saveDocument.ts
- [x] T034 [US3] Implement API response mapping for invalid-target/unwritable-target/transient-io in src/presentation/http/errors/httpErrorMapper.ts
- [x] T035 [US3] Update save route to return warning step and categorized failure payloads in src/presentation/http/routes/documentSaveRoute.ts
- [x] T036 [US3] Surface warning dialog, retryability messaging, and continue-save UX in src/viewer/components/DocumentEditor.tsx and src/viewer/components/ErrorBanner.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 仕様整合、手順検証、最終品質確認を実施する

- [x] T037 [P] Update save/edit usage documentation in README.md and README.ja.md
- [x] T038 [P] Verify quickstart scenarios and expected outcomes in specs/010-richtext-markdown-save/quickstart.md
- [x] T039 Run focused validation tests for Story 010 contracts and viewer flows in tests/contract/http-document-save.test.ts and src/viewer/navigation.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 editor state and app integration baseline
- **User Story 3 (Phase 5)**: Depends on User Story 1 save route/use case baseline
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First MVP slice; no dependency on other stories after Foundation
- **User Story 2 (P2)**: Depends on US1 edit mode/state/save baseline
- **User Story 3 (P3)**: Depends on US1 save API flow; can proceed without US2 completion

### Within Each User Story

- Contract/integration tests for story behavior before final story completion
- Domain/use case updates before HTTP route updates
- HTTP route updates before viewer API wiring
- Viewer state updates before UI interaction integration

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005 and T007 can run in parallel once T004 starts
- In US1, T015/T016/T017 can run in parallel after T012-T014 baseline
- In US2, T024 and T025 can run in parallel after T023 baseline
- In US3, T027/T028/T029 can run in parallel, and T030 with T034 can run in parallel
- T037 and T038 can run in parallel after feature completion

---

## Parallel Example: User Story 1

```bash
# Parallel implementation after save use case and route baseline exist:
Task: "Implement editor API client methods for save and pre-save warning in src/viewer/services/apiClient.ts"
Task: "Add rich text editor component with heading/bold/italic support in src/viewer/components/DocumentEditor.tsx"
Task: "Add editor toolbar component for heading1-3/bold/italic actions in src/viewer/components/EditorToolbar.tsx"
```

## Parallel Example: User Story 2

```bash
# Parallelizable after unsaved-changes state transition model is defined:
Task: "Implement browser beforeunload guard hook in src/viewer/hooks/useUnsavedChangesGuard.ts"
Task: "Add discard confirmation dialog component in src/viewer/components/UnsavedChangesDialog.tsx"
```

## Parallel Example: User Story 3

```bash
# Parallelizable workstreams for warning and failure-handling:
Task: "Implement unsupported element detection and warning builder in src/core/markdown/detectUnsupportedElements.ts"
Task: "Implement API response mapping for invalid-target/unwritable-target/transient-io in src/presentation/http/errors/httpErrorMapper.ts"
Task: "Add contract tests for warning response and failure categories in tests/contract/http-document-save.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Confirm edit-save-latest-view flow works end-to-end

### Incremental Delivery

1. Foundation (Phase 1-2)
2. MVP delivery with US1
3. Add US2 unsaved-change guard
4. Add US3 warning/validation/failure classification
5. Polish docs and focused validation

### Parallel Team Strategy

1. One developer focuses on save use case and HTTP route
2. One developer focuses on viewer editing UI and state integration
3. One developer focuses on contract/integration tests and regression checks

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]-[US3] labels map tasks to spec user stories
- Keep Story 010 scoped: no conflict detection/version checks in this feature
- Maintain markdown source-of-truth: preserve unsupported segments where possible
- Dependency installation during implementation uses explicit `npm i <package>` commands instead of manual package.json edits
