# Implementation Plan: 変更監視と自動更新

**Branch**: `006-markdown-watch` | **Date**: 2026-06-09 | **Spec**: /specs/006-markdown-watch/spec.md
**Input**: Feature specification from `/specs/006-markdown-watch/spec.md`

## Summary

`doc-repo serve` 実行中の Markdown 変更を chokidar で監視し、300ms debounce と単一実行キューで再生成を制御する。再生成成功時のみ SSE `reload` を送信し、失敗時はブラウザを更新せず標準出力/標準エラーで状態を明示する。停止時は watcher、SSE 接続、HTTP サーバーを順に非同期クリーンアップして自然終了する。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)  
**Primary Dependencies**: commander, fs-extra, fast-glob, markdown-it, chokidar（新規）, Node.js `http`/`node:net`  
**Storage**: ファイルシステム（入力 Markdown / 出力 `.doc-repo`）  
**Testing**: Vitest（unit/integration）, CLI 実行テスト（既存 `tests/*.test.ts` 拡張）  
**Target Platform**: macOS/Linux/Windows 上の Node.js 実行環境
**Project Type**: npm CLI パッケージ（ローカルサーバー＋監視）  
**Performance Goals**: Markdown 保存から最新表示まで 5 秒以内（SC-001）  
**Constraints**: `*.md` のみ監視、`.doc-repo`/`.git`/`node_modules` と include/exclude 除外、再生成同時実行禁止、成功時のみ reload 通知  
**Scale/Scope**: Story 006 範囲（watch + auto refresh + status 表示）。編集機能や高度設定 UI は対象外

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Constitution 状態: `.specify/memory/constitution.md` はテンプレート状態で強制原則が未定義
- Gate-1（技術方針整合）: PASS（TypeScript/npm CLI/責務分離を維持）
- Gate-2（MVP 非目標侵害なし）: PASS（ブラウザ編集・外部公開機能を追加しない）
- Gate-3（責務分離）: PASS（監視/再生成/通知/配信の境界を分離）
- Gate-4（仕様明確性）: PASS（Clarifications 5件反映済み、未解決事項なし）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（データモデルと契約が Story 006 の範囲内）
- Post-Design Gate-2: PASS（外部公開インターフェースを CLI とローカル SSE 契約へ限定）

## Project Structure

### Documentation (this feature)

```text
specs/006-markdown-watch/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-contract.md
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
│   ├── serve/
│   │   ├── runServe.ts
│   │   └── startStaticServer.ts
│   ├── scanner/
│   │   ├── detectRoot.ts
│   │   └── scanMarkdown.ts
│   └── site/
│       └── generateSite.ts
└── shared/
    ├── logger.ts
    ├── errors.ts
    └── types.ts

templates/
├── app.js
├── page.html
└── styles.css

tests/
├── npm-run-build.test.ts
├── npm-run-dev.test.ts
└── viewer-dom.e2e.test.ts
```

**Structure Decision**: 単一 CLI 構成を維持し、`src/core/serve` を orchestration 中心に拡張する。監視（chokidar）と SSE 接続管理は serve ドメイン内へ閉じ、scanner/site 既存ロジックを再利用して再生成を実行する。

## Complexity Tracking

現時点で constitution 違反はなく、追加の正当化事項なし。
