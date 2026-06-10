# Implementation Plan: 設定ファイル雛形の生成（doc-repo init）

**Branch**: `008-config-file-init` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-config-file-init/spec.md`

## Summary

`doc-repo init` コマンドを追加し、カレントディレクトリに `doc-repo.config.json` の雛形を生成する。生成時にはファイルパスを表示し、既存ファイルがある場合は上書きせず警告メッセージを表示して終了コード `0` で終了する。

技術的アプローチ：既存の `src/core/` パターンに従い、コアロジックを `src/core/init/createConfigFile.ts` に配置し、`src/cli/index.ts` に `init` サブコマンドを追加する。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)
**Primary Dependencies**: `commander`（CLI引数）、`fs-extra`（ファイル操作）
**Storage**: ファイルシステム（`doc-repo.config.json` をカレントディレクトリに生成）
**Testing**: Vitest（`*.test.ts`）
**Target Platform**: CLI（macOS / Linux / Windows）
**Project Type**: CLI tool
**Performance Goals**: N/A（ファイル1件の書き込みのみ）
**Constraints**: N/A
**Scale/Scope**: 単一ファイルの生成

## Constitution Check

_Constitution は未記入テンプレートのため、プロジェクト固有のゲートなし。_

- [x] 実装は既存の `src/core/` + `src/cli/` 責務分離パターンに従う
- [x] テストは Vitest の `vi.mock` パターンで記述する
- [x] `fs-extra` 以外の新規依存は追加しない

**Post-design re-check**: data-model.md・contracts/ の内容は上記制約に違反しない。

## Project Structure

### Documentation (this feature)

```text
specs/008-config-file-init/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # /speckit.tasks output
```

### Source Code (repository root)

```text
src/
├── cli/
│   └── index.ts                         # init サブコマンド追加
├── core/
│   └── init/
│       └── createConfigFile.ts          # 新規：設定ファイル生成コアロジック

tests/                                   # 既存 e2e テスト（変更なし）
src/core/init/
└── createConfigFile.test.ts             # 新規：ユニットテスト
```

**Structure Decision**: コアロジックを `src/core/init/` に分離し、CLI の `index.ts` から呼び出す既存パターンを踏襲。`init` 固有の CLI オプション解決が不要なため、`src/cli/init/` ディレクトリは作らず `index.ts` に直接ハンドラを記述する。

## Complexity Tracking

_Constitution Check に違反なし。記入不要。_
