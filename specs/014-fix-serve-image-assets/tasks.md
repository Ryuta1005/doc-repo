# Tasks: serve時の相対画像表示不具合修正

**Input**: Design documents from `/specs/014-fix-serve-image-assets/`
**Prerequisites**: plan.md, spec.md

**Tests**: この機能は回帰防止が重要なため、各実装に対応するテストタスクを含める。

**Organization**: タスクはユーザーストーリー単位で整理し、US1 を単独で実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 既存仕様とフィクスチャの前提を揃え、以降の実装を安全に進める

- [x] T001 既存の画像リンク変換挙動を確認し、対象ケースを `src/core/parser/convertMarkdown.test.ts` に TODO コメント付きで明文化する
- [x] T002 画像参照付き Markdown フィクスチャを追加して回帰検証入力を用意する in `tests/fixtures/serve-image-assets/README.md`
- [x] T003 [P] 検証用画像ファイルを追加する in `tests/fixtures/serve-image-assets/docs/assets/screenshot-sample.png`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべての US1 実装で共通利用する画像パス・型定義を先に整備する

**⚠️ CRITICAL**: このフェーズ完了前に US1 実装へ進まない

- [x] T004 参照画像 URL を計算するヘルパーを追加する in `src/shared/sitePaths.ts`
- [x] T005 [P] 参照画像メタデータ型を追加する in `src/shared/types.ts`
- [x] T006 [P] 追加した画像パスヘルパーの単体テストを実装する in `src/shared/sitePaths.test.ts`
- [x] T007 生成バンドルが参照画像一覧を保持できるよう SiteBundle 関連型を更新する in `src/core/site/buildSiteBundle.ts`

**Checkpoint**: Foundation ready - US1 実装を開始可能

---

## Phase 3: User Story 1 - Markdownの相対画像をserveで表示する (Priority: P1) 🎯 MVP

**Goal**: Markdown の相対画像参照を `.doc-repo` 配下に閉じて解決し、`serve` と `file://` の表示を一致させる

**Independent Test**: 相対画像参照を含む Markdown を生成し、出力 HTML の `src` が `.doc-repo/assets/...` を指し、対応ファイルが `.doc-repo` 配下に存在し、`serve` 経由で 200 応答になることを確認する

### Tests for User Story 1

- [x] T008 [P] [US1] 相対画像 URL 変換と除外ルール（外部 URL・ハッシュ・リポジトリ外）を検証するテストを追加する in `src/core/parser/convertMarkdown.test.ts`
- [x] T009 [P] [US1] SiteBundle が参照画像一覧を集約するテストを追加する in `src/core/site/buildSiteBundle.test.ts`
- [x] T010 [P] [US1] copyAssets が参照画像を `.doc-repo/assets/` へコピーするテストを追加する in `src/core/site/copyAssets.test.ts`
- [x] T011 [P] [US1] 生成サイト経由で画像が HTTP 200 になることを確認するテストを追加する in `src/core/serve/startStaticServer.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Markdown 変換で参照画像 URL 変換と画像収集を実装する in `src/core/parser/convertMarkdown.ts`
- [x] T013 [US1] buildSiteBundle でページ横断の参照画像一覧を集約する in `src/core/site/buildSiteBundle.ts`
- [x] T014 [US1] copyAssets でテンプレート資産に加えて参照画像コピーを実装する in `src/core/site/copyAssets.ts`
- [x] T015 [US1] generateSite から rootDir と参照画像一覧を copyAssets へ連携する in `src/core/site/generateSite.ts`
- [x] T016 [US1] serve の既存配信境界を維持する回帰確認を実装する in `src/core/serve/runServe.test.ts`

**Checkpoint**: User Story 1 が単独で機能し、画像表示不具合が解消される

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント整合と最終回帰確認

- [x] T017 [P] README の既知制約を修正後仕様へ更新する in `README.md`
- [x] T018 [P] 日本語 README の既知制約を修正後仕様へ更新する in `README.ja.md`
- [x] T019 受け入れ条件に沿った手動テストケースを更新する（実測欄は空欄維持） in `specs/014-fix-serve-image-assets/manual-tests/test-case.md`
- [x] T020 主要テストスイートを実行して回帰がないことを確認する in `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 依存なし
- **Phase 2 (Foundational)**: Phase 1 完了後に着手。US1 全体をブロック
- **Phase 3 (US1)**: Phase 2 完了後に着手
- **Phase 4 (Polish)**: US1 完了後に着手

### User Story Dependencies

- **US1 (P1)**: Foundational 完了後に開始可能。他ストーリー依存なし

### Within User Story 1

- テストタスク T008-T011 を先行し、失敗を確認してから実装へ進む
- 実装順序は T012 → T013 → T014 → T015 → T016 を基本とする
- ドキュメント更新と最終確認は US1 完了後に実施する

### Parallel Opportunities

- Setup: T003 は T001/T002 と並列可能
- Foundational: T005 と T006 は T004 と並列可能（T007 は T005 完了後推奨）
- US1 Tests: T008-T011 は相互に並列実行可能
- Polish: T017 と T018 は並列実行可能

---

## Parallel Example: User Story 1

- T008 [US1] in `src/core/parser/convertMarkdown.test.ts`
- T009 [US1] in `src/core/site/buildSiteBundle.test.ts`
- T010 [US1] in `src/core/site/copyAssets.test.ts`
- T011 [US1] in `src/core/serve/startStaticServer.test.ts`

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1 と Phase 2 を完了し、共通基盤を確定する
2. Phase 3 の US1 をテスト先行で実装する
3. Independent Test を満たすことを確認して MVP とする

### Incremental Delivery

1. URL 変換（T012）を先に完成
2. 画像集約とコピー（T013-T015）を段階適用
3. serve 回帰確認（T016）とドキュメント更新（T017-T019）で仕上げる

### Parallel Team Strategy

1. 開発者 A: parser / sitePaths（T004, T008, T012）
2. 開発者 B: bundle / copy（T009, T010, T013, T014, T015）
3. 開発者 C: serve 回帰とドキュメント（T011, T016, T017, T018, T019, T020）

---

## Notes

- すべてのタスクはチェックリスト形式（`- [ ] Txxx ...`）に統一
- US1 フェーズのタスクは必ず `[US1]` ラベルを付与
- `serve` の配信範囲は `.doc-repo` 配下限定を維持
- Markdown 画像記法 `![...](...)` の相対画像のみを対象（通常リンク添付ファイルは別チケット）
- 手動テストの実測欄（判定・実行結果・補足）は AI が埋めない
