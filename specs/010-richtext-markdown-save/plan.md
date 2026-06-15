# Implementation Plan: リッチテキスト編集と Markdown 保存

**Branch**: `010-richtext-markdown-save` | **Date**: 2026-06-14 | **Spec**: /specs/010-richtext-markdown-save/spec.md
**Input**: Feature specification from `/specs/010-richtext-markdown-save/spec.md`

## Summary

閲覧中の Markdown 文書を React ベースのリッチテキスト編集 UI で編集し、Markdown へ保存する最小体験を追加する。保存前に未対応要素の警告と保存継続/キャンセルを提供し、未対応要素は原文パススルーを優先する。保存は rootDir 配下の `.md` かつ include/exclude 条件を満たす文書に限定し、外部更新競合検知は導入せず上書き保存する（競合検知は Story 011 で扱う）。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)
**Primary Dependencies**: React, Hono, commander, fs-extra, markdown-it, chokidar, WYSIWYG エディタ: Tiptap（ProseMirror 系）
**Storage**: ファイルシステム（入力 Markdown / 出力 `.doc-repo` / 元 Markdown への保存）
**Testing**: Vitest（unit + integration）, CLI/HTTP 境界テスト, 必要に応じて viewer DOM テスト
**Target Platform**: macOS/Linux/Windows 上の Node.js 実行環境 + ブラウザ（同一 origin の serve UI）
**Project Type**: npm CLI パッケージ（serve 中の React Viewer + Hono HTTP API）
**Performance Goals**: 1MB 程度の文書で編集開始から保存結果表示まで p95 3 秒以内
**Constraints**: 書式対象は本文/見出し1-3/太字/イタリックのみ、下線は対象外、未保存変更確認必須、保存失敗は3分類で理由と再試行可否を提示、未対応要素は原文保持を優先
**Scale/Scope**: Story 010 の編集保存 MVP に限定。競合検知、版情報照合、保存拒否ポリシー強化は Story 011 へ委譲

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Constitution 状態: `.specify/memory/constitution.md` はテンプレート状態で強制原則が未定義
- Gate-1（技術方針整合）: PASS（TypeScript/npm CLI/serve 正規入口/層分離方針に整合）
- Gate-2（MVP 範囲）: PASS（編集保存の最小体験に限定し、非目標機能を追加しない）
- Gate-3（境界分離）: PASS（viewer UI、HTTP 境界、application/core の責務分離を維持）
- Gate-4（仕様明確性）: PASS（clarify で未確定事項を解消済み）

Phase 1 後の再チェック:

- Post-Design Gate-1: PASS（データモデルが編集状態・保存検証・結果通知に分離されている）
- Post-Design Gate-2: PASS（保存 API 契約を HTTP 境界に閉じ、競合検知仕様は Story 011 へ明示委譲）

## Design Focus: Markdown 変換パイプライン

この feature の最大リスクはファイル書き込みそのものではなく、Markdown とリッチテキスト編集状態の往復変換である。以下の処理境界を実装上の中心に据える。

```text
Markdown 原文
    ↓ parse
対応要素 + 未対応原文ノード
    ↓ edit
編集状態
    ↓ serialize
Markdown
```

未対応要素は保存時に原文パススルーを優先し、保持不能時のみ警告対象として扱う。実現方式（未対応ノード化、編集不可ブロック化、原文断片属性保持、AST 部分置換）は `research.md` で検討済み方針に従う。

## Error Classification Strategy

保存失敗の 3 分類はレイヤー責務へ次のように対応させる。

| 利用者向け分類     | 主な発生箇所                            | 再試行     |
| ------------------ | --------------------------------------- | ---------- |
| 保存対象の検証不正 | path/rootDir/include/exclude/拡張子検証 | 原則不可   |
| 対象文書の保存不能 | 不存在、権限不足など                    | 状態確認後 |
| 一時的な保存失敗   | その他の I/O 失敗                       | 可能       |

`src/application` は Node.js 由来エラーをそのまま返さず、上記 3 分類のドメイン結果へ変換して `src/presentation/http` へ渡す。

## Project Structure

### Documentation (this feature)

```text
specs/010-richtext-markdown-save/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-save-api-contract.md
│   └── viewer-editing-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── application/
│   └── (save document use case を追加)
├── core/
│   ├── markdown/
│   │   ├── parseEditableMarkdown.ts
│   │   ├── serializeEditableMarkdown.ts
│   │   └── detectUnsupportedElements.ts
│   └── document/
│       ├── validateSaveTarget.ts
│       └── writeMarkdownDocumentAtomically.ts
├── presentation/
│   └── http/
│       └── (save API route と error mapping を追加)
├── viewer/
│   ├── components/
│   ├── services/
│   └── state/
└── shared/
    └── errors.ts, types.ts, documentIdentifier.ts

tests/
├── contract/
├── regression/
└── (HTTP 境界/保存フローの integration テストを追加)
```

**Structure Decision**: 既存の serve ベース構造を維持し、編集 UI と編集セッション状態は `src/viewer`、保存ユースケースは `src/application`、保存 API の入出力変換とエラーマッピングは `src/presentation/http` へ配置する。Markdown とリッチテキスト編集状態の相互変換、未対応要素の検出・原文保持は `src/core/markdown`、保存対象の安全性検証と原子的ファイル書き込みは `src/core/document` へ分離する。競合検知や版情報照合は導入せず、Story 011 の責務とする。

## Complexity Tracking

現時点で constitution 違反はなく、追加の正当化事項なし。
