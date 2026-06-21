# Implementation Plan: 新規 Markdown 文書作成（Story 022）

**Branch**: `022-create-markdown-doc` | **Date**: 2026-06-21 | **Spec**: /specs/022-create-markdown-doc/spec.md
**Input**: Feature specification from `/specs/022-create-markdown-doc/spec.md`

## Summary

サイドバーのファイル/フォルダ行に対するホバー時 `+` 操作を起点に、新規 Markdown 文書作成フローを追加する。`+` 押下後は専用モーダルではなく編集画面に遷移し、ツールバーと本文入力欄の間にインラインファイル名入力欄を表示する。ファイル実体は遷移時に作成せず、保存ボタン押下時に初めて作成する。作成先はクリック元ノード文脈で決定し、入力値をファイル名本文として扱って末尾に常に `.md` を自動補完する。内部ファイル名は `.md` を保持しつつ、サイドバー表示は最後の `.md` なしへ統一する。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)  
**Primary Dependencies**: React, Hono, commander, fs-extra, fast-glob, chokidar  
**Storage**: ファイルシステム（入力 Markdown / 出力 `.doc-repo` / rootDir 配下への新規 `.md` 作成）  
**Testing**: Vitest（unit + integration + contract）, viewer/navigation 系 UI テスト, HTTP ルート契約テスト  
**Target Platform**: macOS/Linux/Windows 上の Node.js 実行環境 + ブラウザ（serve UI）
**Project Type**: npm CLI パッケージ（serve 中の React Viewer + Hono HTTP API）  
**Performance Goals**: 新規作成成功時、文書ツリー反映と選択完了を p95 2 秒以内  
**Constraints**: ファイル名のみ入力、`/` `\\` を拒否、`.md` 自動補完、パストラバーサル拒否、重複上書き禁止、既存未保存変更ガードを維持、作成前は実体ファイル非生成、ファイル名入力欄は下線+`ページタイトル` プレースホルダー  
**Scale/Scope**: Story 022（新規作成）に限定。削除機能は Story 023 で扱う

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Gate-1（Markdown Source of Truth）: PASS（初期本文空・内部 `.md` 保持・表示名分離で Markdown 正本を維持）
- Gate-2（Repository Structure Respect / UX Consistency）: PASS（既存 sidebar/editor 体験に整合し、既存構造を破壊しない）
- Gate-3（Safe File Boundary）: PASS（rootDir 外書き込み・path traversal 拒否を仕様と検証タスクで担保）
- Gate-4（No Implicit Overwrite）: PASS（同名重複時は作成拒否、暗黙上書きなし）
- Gate-5（File Operation Test Coverage）: PASS（主要ファイル操作に対する検証タスク T036/T037 と quickstart 計測手順を定義）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（データモデルで UI 文脈・入力・検証・結果を分離）
- Post-Design Gate-2: PASS（create API 契約を HTTP 境界へ限定し、内部実装詳細を露出しない）
- Post-Design Gate-3: PASS（contracts/quickstart/tasks の追跡で安全性・性能・表示整合を確認可能）

## Design Focus: Hover Anchor Driven Create-on-Save

本 feature の中心は「どこに作るか」の誤解をなくすことにある。作成先解決は常に `CreationAnchorContext` を起点に行う。

```text
Sidebar Hover Node
  ↓
Hover + Button Click
  ↓
CreationAnchorContext (file/folder, basePath) + DraftCreateSession
  ↓
Editor Screen (inline filename field + body editor)
  ↓
No physical file yet
  ↓ normalize + validate
Resolved Target (.md under rootDir)
  ↓
Save pressed -> Create + Tree Refresh + Select + Display without extension
```

## Validation Strategy

作成時の判定順序を固定し、利用者へ一貫した理由表示を行う。

1. 入力形式検証: 空文字、区切り文字、拡張子の妥当性
2. パス解決検証: rootDir 外、パストラバーサル拒否
3. 対象範囲検証: include/exclude 判定
4. 重複検証: 既存同名ファイル拒否（上書き禁止）

## Project Structure

### Documentation (this feature)

```text
specs/022-create-markdown-doc/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-document-create-contract.md
│   └── viewer-sidebar-create-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── application/
│   └── documents/
│       └── (create document use case を追加)
├── core/
│   ├── document/
│   │   ├── (create target resolution/validation を追加)
│   │   └── (safe create writer を追加)
├── presentation/
│   └── http/
│       ├── routes/
│       │   └── (create document route を追加)
│       └── validation/
│           └── (create request validation を追加)
├── viewer/
│   ├── components/
│   │   └── (sidebar hover action + inline filename UI を追加)
│   ├── services/
│   │   └── (create API client を追加)
│   ├── state/
│   │   └── (draft create session + create timing state を追加)
│   └── navigation.ts
└── shared/
  └── (create result/error 型を追加)

tests/
├── contract/
│   └── (document create API 契約テストを追加)
├── regression/
│   └── (create + tree refresh 回帰テストを追加)
└── architecture/
  └── (layer violation がないことを確認)
```

**Structure Decision**: 既存の層分離を維持し、UI 仕様（ホバー `+`、インラインファイル名入力、拡張子なし表示）は `src/viewer` に閉じる。作成先決定・安全性検証・ファイル作成は `src/application` / `src/core/document` に閉じ、`src/presentation/http` は契約変換とエラーマッピングのみ担当する。作成トリガーは `+` ではなく保存操作に統一する。

## Complexity Tracking

現時点で constitution 違反はなく、追加の正当化事項なし。
