# Tasks: React + Hono ワークスペース基盤（Task 019）

**Input**: Design documents from `/specs/019-edit-workspace-react-hono/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: このfeatureでは回帰テスト固定が必須（FR-013）なので、各ストーリーにテストタスクを含める。HTTP API 契約は内部 pipeline だけではなく、Hono adapter を起動した実 HTTP request/response の integration test で検証する。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（別ファイル・依存なし）
- **[Story]**: 対応するユーザーストーリー（US1, US2, ...）
- すべてのタスクに具体的なファイルパスを含める

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: React + Hono 移行に必要な最小セットアップを追加する

- [x] T001 Update runtime and build dependencies for React/Hono viewer pipeline in package.json
- [x] T002 Add viewer build configuration and scripts in vite.viewer.config.ts
- [x] T003 [P] Create initial module skeletons for application/presentation/viewer in src/application/documents/index.ts, src/presentation/http/index.ts, src/viewer/main.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ストーリーの前提となる回帰固定と境界基盤を先に整備する

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー実装へ進まない

- [x] T004 固定対象の回帰ケース一覧を定義しテスト計画を作成 in tests/regression/phase2-baseline.md
- [x] T005 [P] Add shared document identifier normalization utility in src/shared/documentIdentifier.ts
- [x] T006 [P] Add shared HTTP error model and response type in src/presentation/http/errors/httpErrorTypes.ts
- [x] T007 Implement application use case for listing documents in src/application/documents/listDocuments.ts
- [x] T008 Implement application use case for fetching one document in src/application/documents/getDocument.ts
- [x] T009 Create Hono server bootstrap with separated route/validation/error layers in src/presentation/http/createServer.ts
- [x] T010 Wire serve entrypoint to presentation HTTP server adapter in src/core/serve/runServe.ts

**Checkpoint**: 回帰固定方針と境界基盤が整い、各ストーリーを独立実装可能

---

## Phase 3: User Story 1 - 既存の閲覧体験の維持 (Priority: P1) 🎯 MVP

**Goal**: `serve` 起動時に左ツリー・本文・文書選択・画像/静的アセット表示を機能同等で維持する

**Independent Test**: `doc-repo serve` を起動し、ツリー表示→文書選択→本文表示→画像表示が既存同等に動作する

### Tests for User Story 1

- [x] T011 [P] [US1] Add document list API contract tests, including adapter-level HTTP response verification for `GET /api/documents`
- [x] T012 [P] [US1] Add document detail API contract tests, including adapter-level HTTP response verification for `GET /api/document?path=<encoded rootDir-relative path>`
- [x] T013 [US1] Extend viewer regression for tree/select/body behavior in tests/viewer-dom.e2e.test.ts

### Implementation for User Story 1

- [x] T014 [P] [US1] Implement `GET /api/documents` route in src/presentation/http/routes/documentsListRoute.ts
- [x] T015 [P] [US1] Implement `GET /api/document?path=<encoded rootDir-relative path>` route in src/presentation/http/routes/documentsDetailRoute.ts
- [x] T016 [P] [US1] Implement query `path` validation/normalization (`encodeURIComponent` 前提, empty/out-of-root/`..` rejection) in src/presentation/http/validation/documentRequestValidator.ts
- [x] T017 [P] [US1] Implement HTTP error mapping for 400/404/500 in src/presentation/http/errors/httpErrorMapper.ts
- [x] T018 [P] [US1] Implement React DocumentTree component in src/viewer/components/DocumentTree.tsx
- [x] T019 [P] [US1] Implement React DocumentViewer component in src/viewer/components/DocumentViewer.tsx
- [x] T020 [US1] Implement viewer API client for list/detail endpoints in src/viewer/services/apiClient.ts
- [x] T021 [US1] Integrate React viewer bundle serving in Hono server in src/presentation/http/createServer.ts

**Checkpoint**: US1 単体で閲覧体験を提供可能

---

## Phase 4: User Story 2 - Markdown 変更監視と自動更新 (Priority: P1)

**Goal**: Markdown の変更・追加・削除を手動リロードなしで反映する

**Independent Test**: ファイル change/add/unlink を実行し、本文/ツリー更新と自動更新が成立する

### Tests for User Story 2

- [x] T022 [P] [US2] Add E2E watch regression tests for change/add/unlink with browser auto-reload completion in tests/npm-run-dev.test.ts
- [x] T023 [P] [US2] Add integration tests for SSE `reload` dispatch conditions (success only, payload.type=`reload`) in src/core/serve/refreshCoordinator.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Implement SSE events route for `reload` notifications with payload.type=`reload` in src/presentation/http/routes/eventsRoute.ts
- [x] T025 [US2] Adapt markdown watcher flow to Hono-boundary notification path in src/core/serve/startMarkdownWatcher.ts
- [x] T026 [US2] Enforce regenerate-success-only reload dispatch in src/core/serve/refreshCoordinator.ts
- [x] T027 [US2] Implement client-side SSE listener and reload behavior in src/viewer/services/sseClient.ts

**Checkpoint**: US2 単体で既存 watch 体験を提供可能

---

## Phase 5: User Story 3 - Hono HTTP 境界の確立 (Priority: P1)

**Goal**: ルート/検証/エラー変換/application 呼び出しを分離し、core 非依存境界を確立する

**Independent Test**: 境界レイヤーの単体テストで、ルートが application 以外を直接呼ばないことを検証できる

### Tests for User Story 3

- [x] T028 [P] [US3] Add boundary separation tests for route/validation/error mapping in src/presentation/http/createServer.test.ts
- [x] T029 [P] [US3] Add dependency guard test to prevent core importing Hono/React in tests/architecture/dependency-boundary.test.ts

### Implementation for User Story 3

- [x] T030 [US3] Refactor HTTP route registration to modular route layer in src/presentation/http/routes/index.ts
- [x] T031 [US3] Refactor validation and error mapping pipeline wiring in src/presentation/http/createServer.ts
- [x] T032 [US3] Refactor application adapters to use core scanner/parser/site only in src/application/documents/getDocument.ts

**Checkpoint**: US3 単体で責務分離が成立

---

## Phase 6: User Story 4 - 静的生成機能の維持 (Priority: P1)

**Goal**: 静的生成コマンド（`doc-repo [scopePath]` / 現行CLIデフォルト実行）の主要な出力契約とオフライン閲覧方法を維持する

**Independent Test**: `doc-repo [scopePath]` の成果物をオフライン閲覧し、既存利用方法が維持される

### Tests for User Story 4

- [x] T033 [P] [US4] Extend static-generation/offline regression tests for `doc-repo [scopePath]` in tests/npm-run-build.test.ts
- [x] T034 [P] [US4] Extend image/static asset compatibility tests in tests/image-serving.e2e.test.ts

### Implementation for User Story 4

- [x] T035 [US4] Preserve static generation output contract (`doc-repo [scopePath]`) while integrating viewer assets in src/core/site/buildSiteBundle.ts
- [x] T036 [US4] Preserve offline asset resolution behavior in src/core/site/renderPages.ts

**Checkpoint**: US4 単体で静的生成互換を確認可能

---

## Phase 7: User Story 5 - エラーハンドリングと安定性 (Priority: P1)

**Goal**: 404/切断/削除ケースで UI と API が安定して動作する

**Independent Test**: 不正識別子・削除済み文書・SSE切断を発生させ、クラッシュせず継続利用できる

### Tests for User Story 5

- [x] T037 [P] [US5] Add HTTP error contract tests for 400/404/500, including adapter-level HTTP response verification for invalid and not-found document paths
- [x] T038 [P] [US5] Add viewer stability tests for deleted-current-document fallback in src/viewer/state/viewerState.test.ts

### Implementation for User Story 5

- [x] T039 [US5] Implement standardized error payload mapping (`400 INVALID_REQUEST`, `404 DOCUMENT_NOT_FOUND`, `500 INTERNAL_ERROR`) in src/presentation/http/errors/httpErrorMapper.ts
- [x] T040 [US5] Implement viewer fallback selection when current document is removed in src/viewer/hooks/useViewerState.ts
- [x] T041 [US5] Implement reconnect/failure notice handling for SSE in src/viewer/services/sseClient.ts
- [x] T042 [US5] Add user-facing error banner component in src/viewer/components/ErrorBanner.tsx

**Checkpoint**: US5 単体で安定性要件を確認可能

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 複数ストーリーに跨る最終整備

- [x] T043 [P] Update architecture responsibilities and dependency directions in project/overview/application-architecture.md
- [x] T044 Validate quickstart scenarios and synchronize docs in specs/019-edit-workspace-react-hono/quickstart.md
- [x] T045 [P] Consolidate HTTP contract wording and rendered HTML terminology in specs/019-edit-workspace-react-hono/contracts/http-api-contract.md
- [x] T046 [P] Fix baseline target for SC-002/SC-003/SC-005 (baseline commit + fixtures) in specs/019-edit-workspace-react-hono/checklists/performance-measurement.md
- [x] T047 Define performance measurement procedure and record format (warmup + 5 runs + median + 20% gate) in specs/019-edit-workspace-react-hono/checklists/performance-measurement.md
- [x] T048 Measure baseline implementation for SC-002/SC-003/SC-005 and record results in specs/019-edit-workspace-react-hono/checklists/performance-results.md
- [x] T049 Measure new implementation under identical conditions for SC-002/SC-003/SC-005 and record results in specs/019-edit-workspace-react-hono/checklists/performance-results.md
- [x] T050 Calculate per-target degradation rate and, for >=20% items, record user impact/reason-not-fixed-in-019/approval in specs/019-edit-workspace-react-hono/checklists/performance-results.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 直ちに開始可能
- **Phase 2 (Foundational)**: Setup 完了後、全ストーリーの前提
- **Phase 3-7 (User Stories)**: Foundational 完了後に着手
- **Phase 8 (Polish)**: すべての対象ストーリー完了後

### User Story Dependencies

- **US1**: Foundational 完了後に開始可能（MVP）
- **US2**: US1 の API/UI 基盤に依存
- **US3**: US1 の初期実装を境界分離へ整理
- **US4**: US1/US3 後に静的生成契約（`doc-repo [scopePath]`）維持を確認
- **US5**: US1/US2 の上に安定化を追加

### Within Each User Story

- テストタスクを先行作成し、失敗確認後に実装する
- ルート実装前に検証/エラー変換を用意する
- Viewer コンポーネント実装後に API 結合する

### Parallel Opportunities

- `[P]` 付きタスクは同時進行可能
- US1 の route/component/validator は並列化可能
- US2 の watcher と SSE client はテスト先行で並列化可能
- US4 の静的生成テストと image test は並列化可能

---

## Parallel Example: User Story 1

```bash
# Contract tests in parallel
Task: T011 tests/contract/http-documents-list.test.ts
Task: T012 tests/contract/http-documents-detail.test.ts

# UI components in parallel
Task: T018 src/viewer/components/DocumentTree.tsx
Task: T019 src/viewer/components/DocumentViewer.tsx
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1-2 を完了
2. US1 を完了
3. US1 独立テストで閲覧体験維持を検証
4. ここで一度デモ/確認

### Incremental Delivery

1. US1: 閲覧体験維持
2. US2: watch 自動更新維持
3. US3: 境界分離確立
4. US4: 静的生成契約（`doc-repo [scopePath]`）維持
5. US5: 安定性強化

### Parallel Team Strategy

- Dev A: HTTP/API（US1/US3）
- Dev B: Viewer React（US1/US5）
- Dev C: Watch/SSE（US2）
- Dev D: Build/Docs（US4/Phase8）

---

## Notes

- すべてのタスクは spec の FR-001〜FR-013 に追跡可能
- 固定性能数値は導入しない（同等性基準）
- 保存 API 本体は 019 スコープ外（境界準備のみ）
- `tasks.md` は `/speckit.tasks` の成果物として、実装順の単一ソースとする
- `core/serve` に残る責務混在（watcher制御、CLI連携、運用ログ）は 019 では全面分離しない。Hono 移行必須分のみ `src/presentation/http` へ移し、残件は別リファクタリング候補として管理する
