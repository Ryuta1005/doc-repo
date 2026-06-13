# Implementation Plan: React + Hono ワークスペース基盤（Task 019）

**Branch**: `019-edit-workspace-react-hono` | **Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-edit-workspace-react-hono/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Phase 2 までの閲覧・`serve`・`watch` 体験を維持したまま、HTTP 境界を Hono、Viewer UI を React で再構成する。中核処理（探索・変換・設定解決）は application/core に委譲し、`build` の静的出力契約とオフライン閲覧方法を維持する。文書識別子は `rootDir` からの正規化相対パスを採用し、Phase 3 の保存 API が既存の文書一覧・取得 API 契約へ影響を与えず追加できるよう、HTTP ルート/入力検証/エラー変換/application 呼び出しを分離する。

## Technical Context

**Language/Version**: TypeScript（Node.js >= 20）  
**Primary Dependencies**: commander, fs-extra, fast-glob, markdown-it, chokidar, React, Hono（具体バージョンは実装時決定）  
**Storage**: ファイルシステム（入力 Markdown / 出力 `.doc-repo`）  
**Testing**: Vitest（unit/integration）+ 既存 e2e/CLI テストの回帰固定  
**Target Platform**: macOS/Linux/Windows の Node.js CLI 実行環境
**Project Type**: npm CLI パッケージ（ローカルサーバー + 静的生成）  
**Performance Goals**: 既存 Phase 2 と同等以上の体感（固定数値目標は置かない）  
**Constraints**: 体験維持を最優先、`build` 契約維持、SSE 維持、保存 API 本体は未実装、責務分離を維持  
**Scale/Scope**: Task 019（React + Hono への基盤移行、保存 API 追加可能構造まで）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Constitution はテンプレート状態で強制原則が未定義のため、プロジェクト方針ベースでゲートを適用:

- [x] 技術方針整合: TypeScript/npm CLI/責務分離（scan/parse/site/cli）を維持
- [x] MVP 非目標侵害なし: 編集保存・競合解決は 019 では実装しない
- [x] 境界分離: Hono は HTTP 境界のみ、処理本体は application/core 呼び出し
- [x] 互換性維持: `serve`/`watch`/`build` の主要体験と契約を維持
- [x] 回帰方針: 移行前に回帰対象を固定し、移行後に同期待結果を確認

Post-design re-check:

- [x] research.md で未確定事項を解消
- [x] data-model.md で識別子・境界責務・通知モデルを定義
- [x] contracts/ で CLI/HTTP 契約を明文化
- [x] quickstart.md で回帰確認導線を定義

## Project Structure

### Documentation (this feature)

```text
specs/019-edit-workspace-react-hono/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── index.ts
│   └── serve/
│       └── resolveServeOptions.ts
├── core/
│   ├── scanner/
│   ├── parser/
│   ├── site/
│   └── serve/
└── shared/

templates/
├── app.js
├── page.html
└── styles.css

tests/
├── npm-run-build.test.ts
├── npm-run-dev.test.ts
├── viewer-dom.e2e.test.ts
└── image-serving.e2e.test.ts

docs/
project/
└── overview/
    └── application-architecture.md   # 019で追加/更新対象
```

**Structure Decision**: 既存の単一 CLI 構成を維持し、`src/core` をフレームワーク非依存に保ったまま `src/cli`/`src/core/serve` で Hono 境界を再編する。React は Viewer UI 層として配置し、core への直接依存を持たせない。`build` 成果物の契約は `templates`/site 生成フローで維持する。

## Phase 0: Outline & Research

研究成果は [research.md](./research.md) を参照。

NEEDS CLARIFICATION 解消結果:

1. 文書識別子方式: `rootDir` 正規化相対パスに決定
2. 自動更新方式: SSE 維持に決定
3. 保存 API 拡張性: HTTP 境界の責務分離を先行固定
4. 性能評価基準: 固定数値ではなく Phase 2 同等性基準
5. `serve` と `build` の依存表現: 形態差を吸収する形で明確化
6. 回帰テスト方針: 移行前固定 + 移行後同期待結果を確認
7. 恒久アーキテクチャ文書化: `project/overview/application-architecture.md` へ集約

## Phase 1: Design & Contracts

### Data Model

- [data-model.md](./data-model.md)
- 主要エンティティ: `DocumentIdentifier`, `DocumentSummary`, `DocumentDetail`, `ViewerTreeNode`, `WatchEvent`, `ReloadSignal`, `HttpBoundaryLayer`

### Contracts

- [contracts/cli-contract.md](./contracts/cli-contract.md)
- 対象: `doc-repo serve`/`doc-repo build` の CLI 挙動、`serve` 実行時 HTTP/SSE 契約、境界責務分離

### Quickstart

- [quickstart.md](./quickstart.md)
- 回帰対象（FR-013）を手順化

### Agent Context Update

- 実行コマンド: `.specify/scripts/bash/update-agent-context.sh copilot`
- 目的: 現在計画で確定した技術文脈をエージェントコンテキストへ反映

## Phase 2: Task Planning Approach

`/speckit.tasks` では以下順でタスク化する:

1. HTTP 境界分離（ルート/検証/エラー変換/application 呼び出し）
2. 文書一覧・文書取得 API（識別子: 正規化相対パス）
3. React Viewer 連携（`serve` 時 API 経由）
4. SSE 自動更新維持
5. `build` 契約維持確認
6. 回帰テスト固定と移行後検証
7. `project/overview/application-architecture.md` 更新

## Complexity Tracking

Constitution 違反はなし。追加の正当化事項なし。
