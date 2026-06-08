# Implementation Plan: ローカルサーバー起動

**Branch**: `005-local-server-serve` | **Date**: 2026-06-09 | **Spec**: /specs/005-local-server-serve/spec.md
**Input**: Feature specification from `/specs/005-local-server-serve/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

`doc-repo serve` をオーケストレーション層として定義し、初回生成、ローカル配信開始、監視開始を一連のフローとして成立させる。HTTP サーバー層は生成処理を持たず、生成済みファイル配信のみを担当する。初回生成失敗時はサーバーを起動せず、理由を表示して終了コード `1` で終了する。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js >= 20)  
**Primary Dependencies**: commander (CLI), fs-extra (ファイル操作), 既存 core 生成処理、Node.js `http`/`node:net` 標準機能（配信とポート検証）  
**Storage**: ファイルシステム（入力 Markdown / 出力 `.doc-repo`）  
**Testing**: Vitest（ユニット）, CLI 実行テスト（既存 `tests/*.test.ts` 拡張）  
**Target Platform**: macOS/Linux/Windows 上の Node.js 実行環境
**Project Type**: npm CLI パッケージ（ローカルサーバー機能付き）  
**Performance Goals**: `doc-repo serve` 実行から URL 表示まで通常ケースで 10 秒以内  
**Constraints**: サーバー層は配信専任、生成失敗時は起動禁止、設定優先順位は CLI > 設定ファイル > デフォルト  
**Scale/Scope**: Story 005 範囲に限定（監視の詳細仕様とホットリロード詳細は Story 006 で確定）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Constitution 状態: `.specify/memory/constitution.md` はテンプレート状態で強制原則が未定義
- Gate-1（技術方針整合）: PASS（TypeScript/npm CLI/責務分離を維持）
- Gate-2（MVP 非目標侵害なし）: PASS（編集機能や外部公開機能を追加しない）
- Gate-3（責務分離）: PASS（生成は orchestration、HTTP は配信専任）
- Gate-4（仕様明確性）: PASS（Clarification 反映済み、未解決事項なし）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（データモデルと契約が Story 005 の範囲内）
- Post-Design Gate-2: PASS（外部公開インターフェースを CLI 契約へ限定）

## Project Structure

### Documentation (this feature)

```text
specs/005-local-server-serve/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-contract.md
└── tasks.md
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── cli/
│   ├── index.ts
│   └── *.test.ts
├── core/
│   ├── scanner/
│   ├── parser/
│   └── site/
└── shared/

templates/
└── (static site assets)

tests/
├── npm-run-build.test.ts
├── npm-run-dev.test.ts
└── viewer-dom.e2e.test.ts
```

**Structure Decision**: 単一 CLI プロジェクト構成を維持し、`src/cli` を orchestration、`src/core/site` を生成・配信のユースケース実装、`src/shared` を設定・エラー型の共有境界として利用する。Story 006 の監視詳細は将来拡張として、005 では監視開始の起点だけを設計に含める。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

現時点で constitution 違反はなく、追加の正当化事項なし。
