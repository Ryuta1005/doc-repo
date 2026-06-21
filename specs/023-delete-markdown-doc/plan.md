# Implementation Plan: Markdown文書/フォルダ削除（Story 023）

**Branch**: `023-delete-markdown-doc` | **Date**: 2026-06-21 | **Spec**: /specs/023-delete-markdown-doc/spec.md
**Input**: Feature specification from `/specs/023-delete-markdown-doc/spec.md`

## Summary

サイドバーのファイル行・フォルダ行ホバー時に `Ellipsis` ミートボールメニューを表示し、そこから `Trash2 + 削除` 導線で Markdown 文書またはフォルダを削除できるようにする。削除は確認ダイアログを必須とし、ファイルは単体削除、フォルダは配下の管理対象 Markdown を再帰削除する。ただし配下に管理対象外ファイル、`.md` 以外、include 対象外、exclude 対象が 1 つでもあればフォルダ全体の削除を拒否する。HTTP 境界は既存の save/create と同じく Hono adapter に閉じ、viewer では既存の未保存変更確認デザインと選択状態更新を再利用する。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)  
**Primary Dependencies**: React, Hono, commander, fs-extra, fast-glob, chokidar, lucide-react  
**Storage**: ファイルシステム（rootDir 配下の Markdown / フォルダ削除、`.doc-repo` serve runtime）  
**Testing**: Vitest（unit + contract + integration）, viewer component tests, HTTP boundary tests  
**Target Platform**: macOS/Linux/Windows 上の Node.js 実行環境 + ブラウザ（serve UI）
**Project Type**: npm CLI パッケージ（serve 中の React Viewer + Hono HTTP API）  
**Performance Goals**: 削除成功時、文書ツリー反映と次選択確定を p95 2 秒以内  
**Constraints**: rootDir 外拒否、path traversal 拒否、include/exclude 尊重、フォルダ削除は管理対象 Markdown のみ再帰削除、配下に管理対象外ファイルが 1 つでもあれば拒否、未保存変更ガード尊重、ゴミ箱/復元/排他制御なし、既存ダイアログデザイン整合  
**Scale/Scope**: Story 023（削除）に限定。既存作成/保存契約の延長として delete API と viewer 導線を追加する

## Constitution Check

_Gate: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Gate-1（Markdown Source of Truth）: PASS（削除対象は Markdown 実体とフォルダ実体であり、UI 状態が正本を置き換えない）
- Gate-2（Repository Structure Respect）: PASS（rootDir 配下に限定し、フォルダ削除は管理対象外ファイル混在時に拒否して既存構造破壊を避ける）
- Gate-3（Safe File Boundary）: PASS（path traversal / rootDir 外拒否を仕様・契約・検証へ反映する）
- Gate-4（No Implicit Overwrite）: PASS（削除は明示確認を必須とし、暗黙的な破壊操作を許さない）
- Gate-5（File Operation Test Coverage）: PASS（主要ファイル操作として file delete / folder preflight / HTTP 契約 / viewer interaction を tasks に含める）
- Gate-6（UX Consistency）: PASS（未保存変更ダイアログのキャンセルデザイン、既存選択解決、サイドバー hover interaction に整合）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（DeletionTarget / PreflightReport / ConfirmationState に責務を分離し、Markdown 正本を維持）
- Post-Design Gate-2: PASS（presentation 層は request validation / response mapping に限定し、application/core に削除判断を閉じる）
- Post-Design Gate-3: PASS（folder delete の reject-on-unmanaged-content 方針が contracts/quickstart/tasks に一貫反映される）

## Design Focus: Confirmed Delete with Preflight Scope Inspection

本 feature の中心は「誤って消さない」ことと「消せるときは迷わせず消す」ことにある。削除処理は必ず target 解決と preflight 検査を先に行う。

```text
Sidebar Row Hover
  ↓
Ellipsis menu open
  ↓
Trash2 + Delete click
  ↓
Unsaved changes guard? → yes: existing dialog first
  ↓ no blockers
Delete confirmation dialog
  ↓
Resolve DeletionTarget (file/folder)
  ↓
Preflight policy check
  ├─ file: .md + in-scope + exists
  └─ folder: all descendants are managed markdown only
  ↓
Delete operation
  ↓
Refresh documents + resolve next selection + clear removed UI state
```

## Validation Strategy

削除判定順序を固定し、部分削除を避ける。

1. 入力検証: target type / target path / 空値検証
2. パス解決検証: rootDir 外、path traversal 拒否
3. 対象範囲検証: include/exclude 判定
4. 存在検証: file/folder 実体確認
5. フォルダ事前検査: 配下に unmanaged content があれば全体 reject
6. 実削除: file 単体または folder + managed descendants を一括削除
7. UI 更新: ツリー再取得と fallback selection 解決

## Project Structure

### Documentation (this feature)

```text
specs/023-delete-markdown-doc/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-document-delete-contract.md
│   └── viewer-sidebar-delete-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── application/
│   └── documents/
│       └── (delete document/folder use case を追加)
├── core/
│   └── document/
│       ├── (delete target resolution を追加)
│       ├── (folder preflight inspection を追加)
│       └── (safe delete executor を追加)
├── presentation/
│   └── http/
│       ├── routes/
│       │   └── (document delete route を追加)
│       └── validation/
│           └── (delete request validation を追加)
├── viewer/
│   ├── components/
│   │   ├── DocumentTree.tsx
│   │   └── (delete confirmation dialog / menu state を追加)
│   ├── services/
│   │   └── apiClient.ts
│   ├── state/
│   │   └── viewerState.ts
│   ├── locale/
│   │   └── messages.ts
│   └── App.tsx
└── shared/
    ├── types.ts
    └── errors.ts

tests/
├── contract/
│   └── (document delete API 契約テストを追加)
├── regression/
│   └── (sidebar delete flow / fallback selection 回帰を追加)
└── architecture/
    └── (layer violation がないことを確認)
```

**Structure Decision**: 既存の create/save と同じ責務分離を維持する。viewer は hover menu / confirmation dialog / deleted selection cleanup を担当し、application/core は削除対象解決・フォルダ事前検査・実削除を担当する。presentation/http は delete request validation、error mapping、Hono route 登録のみを担当する。

## Complexity Tracking

現時点で constitution 違反はなく、追加の正当化事項なし。
