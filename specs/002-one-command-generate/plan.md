# Implementation Plan: ワンコマンド生成

**Branch**: `002-one-command-generate` | **Date**: 2026-06-07 | **Spec**: /specs/002-one-command-generate/spec.md
**Input**: Feature specification from `/specs/002-one-command-generate/spec.md`

## Summary

MVPの最小価値として、対象リポジトリでCLIを1回実行すれば `.doc-repo` に閲覧可能な静的サイトを生成できる状態を実現する。技術的には TypeScript の npm CLI とし、対象ルート自動判定（Gitルート優先、失敗時カレント）、一時ディレクトリでの生成後アトミック置換、警告付き成功（Markdown 0件）を採用する。

## Technical Context

**Language/Version**: TypeScript (Node.js LTS 想定)  
**Primary Dependencies**: commander (CLI引数), fast-glob (Markdown探索), markdown-it (Markdown→HTML), fs-extra (ファイル操作)  
**Storage**: ファイルシステム（入力Markdownと出力 `.doc-repo`）  
**Testing**: Vitest（単体テストは各実装ファイル同階層の `*.test.ts`）, Node.js のプロセス実行検証  
**Target Platform**: macOS/Linux/Windows の Node.js 実行環境  
**Project Type**: npm CLI パッケージ（将来 library API 拡張余地あり）  
**Performance Goals**: 一般的なドキュメントリポジトリで95%の実行が2分以内（SC-002）  
**Constraints**: ワンコマンド実行、既定出力先 `.doc-repo`、途中失敗時に壊れた成果物を公開しない  
**Scale/Scope**: Spec A 範囲（CLIと出力基盤）に限定、Story 002 単独で価値成立

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Constitution 状態: `.specify/memory/constitution.md` はプレースホルダで、強制可能な原則が未定義
- Gate-1（MVP整合）: PASS（docs/overview のMVP範囲と一致）
- Gate-2（責務分離）: PASS（CLI/収集/変換/生成の分離方針を維持）
- Gate-3（非目標侵害なし）: PASS（serve/watch/編集機能を含めない）
- Gate-4（仕様明確性）: PASS（clarify 5件反映済み、NEEDS CLARIFICATION なし）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（データモデルとCLI契約がSpec Aの範囲内）
- Post-Design Gate-2: PASS（外部公開インターフェースをCLIに限定）

## Project Structure

### Documentation (this feature)

```text
specs/002-one-command-generate/
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
│   └── index.ts
├── core/
│   ├── scanner/
│   │   └── scanMarkdown.ts
│   ├── parser/
│   │   └── convertMarkdown.ts
│   └── site/
│       └── generateSite.ts
└── shared/
    ├── types.ts
    └── logger.ts

templates/
├── index.html
├── styles.css
└── app.js

tests/
├── integration/
└── contract/
```

**Structure Decision**: 単一の CLI プロジェクト構成を採用。`src/core` に処理責務を分離し、`src/cli` はオーケストレーションのみに限定する。これにより将来の `serve`/`watch` を追加しても core の再利用が可能。

## Complexity Tracking

現時点で constitution 違反はなく、追加の正当化事項なし。
