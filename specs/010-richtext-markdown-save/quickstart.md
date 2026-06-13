# Quickstart: リッチテキスト編集と Markdown 保存（Story 010）

## 参照

- 仕様: [spec.md](./spec.md)
- 実装計画: [plan.md](./plan.md)
- 調査: [research.md](./research.md)
- 契約: [contracts/http-save-api-contract.md](./contracts/http-save-api-contract.md), [contracts/viewer-editing-contract.md](./contracts/viewer-editing-contract.md)

## Prerequisites

- Node.js 20 以上
- 依存関係インストール済み

```bash
npm install
npm run build
```

## 1. serve 起動

```bash
node dist/cli/index.js serve
```

確認項目:

- 閲覧画面が表示される
- 文書を選択できる
- 編集モードへ切り替えられる

## 2. 編集機能の最小範囲確認

対象文書で次を確認する。

- 本文編集
- 見出し 1/2/3 の設定
- 太字、イタリックの設定
- Markdown 入力ルール（`# `, `## `, `### `, 太字, イタリック）

## 3. 保存と表示更新確認

1. 内容を編集して保存
2. 保存成功メッセージを確認
3. 閲覧画面で最新内容が表示されることを確認

## 4. 未保存変更ガード確認

未保存変更を作成して以下を試す。

- 別ファイル選択
- 編集終了
- ブラウザ離脱

確認項目:

- 確認ダイアログが表示される
- 編集継続または破棄を選べる

## 5. 未対応要素警告とパススルー確認

未対応要素を含む文書を対象に保存を試す。

確認項目:

- 保存前警告が表示される
- 保存継続またはキャンセルを選べる
- 保存継続時は未対応要素の原文保持が優先される

## 6. 保存失敗の 3 分類確認

以下を個別に再現し、理由と再試行可否の表示を確認する。

- 保存対象不正（例: ルート外、非 `.md`）
- 対象文書を保存不能（例: 不存在、権限不足）
- 一時的失敗（例: I/O 一時エラー）

## 7. 本 Story の範囲確認

- 外部変更競合の検知は行われない
- 保存時は上書き保存される
- 競合検知は Story 011 で扱う

## 8. 実装検証メモ（2026-06-14）

- `npm run build` が成功すること
- `npm run test` が成功すること
- 重点確認:
  - `tests/contract/http-document-save.test.ts`
  - `src/core/markdown/serializeEditableMarkdown.test.ts`
  - `src/viewer/navigation.test.ts`
