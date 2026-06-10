`include: []` を未指定扱い（全 `**/*.md`）とした既定除外マージ

# Implementation Plan: 設定ファイルによる動作設定

**Branch**: `007-config-file-settings` | **Date**: 2026-06-09 | **Spec**: /Users/ryuta/Source/OSS/my_oss/doc-repo/specs/007-config-file-settings/spec.md
**Input**: Feature specification from `/specs/007-config-file-settings/spec.md`

## Summary

`doc-repo.config.json` の探索・読込・検証を `serve` 専用実装から共通設定解決へ切り出し、通常生成と `serve` の両方で同一の `rootDir` / `include` / `exclude` / `port` を使う。`rootDir` は設定ファイル相対で解決し、`include: []` と既定除外マージ、`rootDir/.doc-repo` 出力、`watch` 範囲の一致を保証する。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)
**Primary Dependencies**: commander, fs-extra, fast-glob, markdown-it, chokidar
**Storage**: ファイルシステム（入力 Markdown / 出力 `.doc-repo` / `doc-repo.config.json`）
**Testing**: Vitest（unit/integration）, CLI 実行テスト（既存 `tests/*.test.ts` と `src/**/*.test.ts` 拡張）
**Target Platform**: macOS/Linux/Windows 上の Node.js 実行環境
**Project Type**: npm CLI パッケージ（静的サイト生成 + ローカルサーバー）
**Performance Goals**: 通常生成と `serve` の設定解決結果が一致し、既存 Story 005/006 の体感性能を劣化させない
**Constraints**: `rootDir` は存在するディレクトリ、既定除外は解除不可、CLI 優先順位は現状 `--port` のみ、後方互換を維持
**Scale/Scope**: Story 007 範囲（設定解決の共通化と通常生成/serve/watch への反映）。`doc-repo init` や新規 CLI オプションは対象外

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Constitution 状態: `.specify/memory/constitution.md` はテンプレート状態で強制原則が未定義
- Gate-1（技術方針整合）: PASS（TypeScript/npm CLI/責務分離を維持）
- Gate-2（MVP/Phase 2 整合）: PASS（設定ファイルによる動作固定は roadmap / story-map の Phase 2 と一致）
- Gate-3（責務分離）: PASS（設定探索/検証、scan 条件、CLI wiring を分離する方針）
- Gate-4（後方互換）: PASS（既存 `serve` の `port`/watch を壊さず共通化する計画）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（設定ファイル契約・データモデル・quickstart が Story 007 の範囲内）
- Post-Design Gate-2: PASS（外部インターフェースを CLI と `doc-repo.config.json` 契約に限定）

## Project Structure

### Documentation (this feature)

```text
specs/007-config-file-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cli-contract.md
│   └── config-file-contract.md
├── checklists/
│   └── requirements.md
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
│   │   ├── detectRoot.ts
│   │   └── scanMarkdown.ts
│   ├── serve/
│   │   ├── runServe.ts
│   │   └── watchTargetFilter.ts
│   └── site/
│       └── generateSite.ts
└── shared/
    ├── errors.ts
    ├── logger.ts
    └── types.ts

tests/
├── npm-run-build.test.ts
├── npm-run-dev.test.ts
└── viewer-dom.e2e.test.ts
```

**Structure Decision**: 単一 CLI 構成を維持しつつ、設定解決は `serve` 層専用実装から共通ロジックへ寄せる。`generateSite` は rootDir/include/exclude を受け取れるように拡張し、`scanMarkdown` と watch フィルタで同一ルールを共有する。

## Complexity Tracking

現時点で constitution 違反はなく、追加の正当化事項なし。
