# Tasks: 設定ファイルによる動作設定

**Input**: Design documents from `/specs/007-config-file-settings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: この feature specification では TDD やテスト先行は明示されていないため、専用の先行テストタスクは必須化しない。各 story 完了時に既存 Vitest/CLI テストで検証する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 007 用の共通設定解決レイヤーを置く土台を作り、既存 `serve` 専用設定処理から移行できる構造を準備する

- [x] T001 Create shared config directory structure in src/shared/config/
- [x] T002 Add shared config model types in src/shared/types.ts for resolved rootDir/include/exclude/port metadata
- [x] T003 [P] Create config resolver test file scaffold in src/shared/config/resolveRuntimeConfig.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 通常生成と `serve` が同じ設定解決結果を使うための共通設定解決・検証基盤を実装する

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement config file discovery and JSON parsing in src/shared/config/findConfigPath.ts
- [x] T005 [P] Implement config validation helpers for rootDir/include/exclude/port in src/shared/config/validateRuntimeConfig.ts
- [x] T006 Implement shared runtime config resolver in src/shared/config/resolveRuntimeConfig.ts
- [x] T007 Refactor serve option resolution to use shared resolver in src/cli/serve/resolveServeOptions.ts
- [x] T008 [P] Export shared config resolver types/utilities via src/shared/types.ts and src/shared/errors.ts

**Checkpoint**: Foundation ready - both commands can consume one shared config contract

---

## Phase 3: User Story 1 - `rootDir` を設定ファイルで指定して収集範囲を固定する (Priority: P1) 🎯 MVP

**Goal**: 設定ファイルから `rootDir` を解決し、通常生成と `serve` の両方で同じ収集起点を使えるようにする

**Independent Test**: `doc-repo.config.json` に `{"rootDir":"./docs"}` を置き、`doc-repo` と `doc-repo serve` の両方が `docs/` を起点に動作することを確認する

### Implementation for User Story 1

- [x] T009 [US1] Extend generation input to accept resolved config in src/shared/types.ts
- [x] T010 [US1] Update site generation orchestration to consume resolved rootDir/outputDir in src/core/site/generateSite.ts
- [x] T011 [US1] Update CLI default command to resolve config before generate in src/cli/index.ts
- [x] T012 [US1] Preserve fallback root detection behavior inside shared resolver for config-missing cases in src/shared/config/resolveRuntimeConfig.ts
- [x] T013 [US1] Add rootDir-specific unit coverage for config-relative, absolute, and fallback resolution in src/shared/config/resolveRuntimeConfig.test.ts

**Checkpoint**: User Story 1 should allow config-based root selection without breaking config-less execution

---

## Phase 4: User Story 2 - `include`/`exclude` を設定ファイルで指定して収集対象を絞り込む (Priority: P1)

**Goal**: `include` / `exclude` を通常生成・`serve`・watch で統一し、既定除外を維持しながら対象集合を一致させる

**Independent Test**: `exclude:["drafts/**"]` または `include:["specs/**/*.md"]` を指定し、生成結果と watch 挙動の両方で同じ対象集合になることを確認する

### Implementation for User Story 2

- [x] T014 [US2] Extend markdown scanner to accept include/exclude criteria in src/core/scanner/scanMarkdown.ts
- [x] T015 [US2] Thread resolved include/exclude criteria through generate flow in src/core/site/generateSite.ts
- [x] T016 [US2] Normalize include-empty and default exclude merge behavior in src/shared/config/resolveRuntimeConfig.ts
- [x] T017 [US2] Align watch target filtering with resolved scan criteria in src/core/serve/watchTargetFilter.ts
- [x] T018 [US2] Ensure serve orchestration passes shared scan criteria to generate and watch layers in src/core/serve/runServe.ts
- [x] T019 [US2] Add scanner and watch filter coverage for include/exclude precedence and default excludes in src/core/scanner/scanMarkdown.test.ts and src/core/serve/watchTargetFilter.test.ts

**Checkpoint**: User Stories 1 and 2 should now share one target-file definition across generate and serve/watch

---

## Phase 5: User Story 3 - 設定ファイルなしでも従来通り動作する (Priority: P2)

**Goal**: 設定ファイル未使用の既存フローを壊さず、`.git` 探索と `cwd` fallback を維持する

**Independent Test**: 設定ファイルがない状態で `doc-repo` と `doc-repo serve` を実行し、従来どおり `.git` または `cwd` を起点に動作することを確認する

### Implementation for User Story 3

- [x] T020 [US3] Preserve generate fallback warnings and target path behavior when config file is absent in src/core/site/generateSite.ts
- [x] T021 [US3] Preserve serve fallback port and root behavior when config file is absent in src/cli/serve/resolveServeOptions.ts
- [x] T022 [US3] Add regression coverage for no-config `.git` fallback and cwd fallback in src/shared/config/resolveRuntimeConfig.test.ts and src/cli/serve/resolveServeOptions.test.ts

**Checkpoint**: Config-less users should see no behavioral regression in generate or serve

---

## Phase 6: User Story 4 - 不正な設定ファイルのエラー内容を把握する (Priority: P3)

**Goal**: 不正な設定ファイル入力をフィールド名付きの分かりやすい失敗として返す

**Independent Test**: JSON 構文エラー、存在しない/非ディレクトリ rootDir、不正な include/exclude、範囲外 port の各ケースで終了コード 1 と原因表示を確認する

### Implementation for User Story 4

- [x] T023 [US4] Add config parse and validation failure mapping in src/shared/errors.ts
- [x] T024 [US4] Implement rootDir existence and directory validation in src/shared/config/validateRuntimeConfig.ts
- [x] T025 [US4] Surface field-specific config failures through generate command results in src/core/site/generateSite.ts
- [x] T026 [US4] Surface field-specific config failures through serve command results in src/cli/serve/resolveServeOptions.ts and src/core/serve/runServe.ts
- [x] T027 [US4] Add failure-case coverage for invalid JSON, invalid rootDir, invalid include/exclude, and invalid port in src/shared/config/resolveRuntimeConfig.test.ts and src/cli/serve/resolveServeOptions.test.ts

**Checkpoint**: All user stories should now be independently functional and diagnosable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント整合、CLI 契約確認、最終検証を行う

- [x] T028 [P] Update README examples for config-file-based generate/serve usage in README.md and README.ja.md
- [x] T029 [P] Verify quickstart scenarios against implementation in specs/007-config-file-settings/quickstart.md
- [x] T030 Run focused validation for feature 007 using scenarios in specs/007-config-file-settings/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should land after US1 wiring exposes resolved config to generate
- **User Story 3 (Phase 5)**: Depends on Foundational completion; can proceed after US1 if fallback regressions need the shared resolver in place
- **User Story 4 (Phase 6)**: Depends on Foundational completion; easiest after US1/US2 because failures must flow through both commands
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First MVP slice; no dependency on other stories after Foundation
- **User Story 2 (P1)**: Depends on US1’s shared resolver consumption in generate/serve
- **User Story 3 (P2)**: Depends on shared resolver existing, but is otherwise independent validation of fallback behavior
- **User Story 4 (P3)**: Depends on shared resolver and both command flows being wired so errors can surface consistently

### Within Each User Story

- Shared resolver/types before CLI or generation wiring
- Generate path updates before serve/watch alignment checks
- Validation helpers before failure propagation
- Regression coverage after the behavior for that slice is implemented

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005 and T008 can run in parallel once the shared config location is created
- T028 and T029 can run in parallel after implementation is complete
- Coverage tasks that touch different files can be split among contributors once each story’s main wiring lands

---

## Parallel Example: User Story 2

```bash
# Parallelizable after shared resolver exists:
Task: "Extend markdown scanner to accept include/exclude criteria in src/core/scanner/scanMarkdown.ts"
Task: "Align watch target filtering with resolved scan criteria in src/core/serve/watchTargetFilter.ts"

# Parallelizable polish work:
Task: "Update README examples for config-file-based generate/serve usage in README.md and README.ja.md"
Task: "Verify quickstart scenarios against implementation in specs/007-config-file-settings/quickstart.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm config-based `rootDir` works for both `doc-repo` and `doc-repo serve`

### Incremental Delivery

1. Build shared resolver foundation
2. Deliver US1 (`rootDir` support) and validate both commands
3. Deliver US2 (`include`/`exclude` unification) and validate generate/watch parity
4. Deliver US3 (no-config compatibility) and validate fallback behavior
5. Deliver US4 (field-specific failures) and validate failure UX
6. Finish with docs and focused validation

### Parallel Team Strategy

With multiple developers:

1. One developer implements shared resolver and validation helpers
2. Another wires generate flow once shared types stabilize
3. Another aligns serve/watch filtering after resolver contract is fixed
4. Documentation and quickstart verification can run after core behavior is merged

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]-[US4] map directly to spec user stories for traceability
- Prefer reusing existing `resolveServeOptions.ts`, `generateSite.ts`, `scanMarkdown.ts`, and `watchTargetFilter.ts` rather than introducing a second config path
- Final validation should stay focused on the touched suites before broader `npm test`
