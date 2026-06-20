# Quickstart: 新規 Markdown 文書作成（Story 022）

## 参照

- 仕様: [spec.md](./spec.md)
- 実装計画: [plan.md](./plan.md)
- 調査: [research.md](./research.md)
- データモデル: [data-model.md](./data-model.md)
- 契約: [contracts/http-document-create-contract.md](./contracts/http-document-create-contract.md), [contracts/viewer-sidebar-create-contract.md](./contracts/viewer-sidebar-create-contract.md)

## Prerequisites

- Node.js 20 以上
- 依存関係インストール済み

```bash
npm install
npm run build
```

## 1. サーバー起動

```bash
node dist/cli/index.js serve
```

確認項目:

- ワークスペース画面が表示される
- サイドバーに文書ツリーが表示される

## 2. ホバー `+` 導線確認

1. サイドバーのフォルダ行へホバーする
2. 行右側に `+` が表示されることを確認する
3. ホバー解除で `+` が消えることを確認する
4. ファイル行へホバーして同様に確認する

## 3. 作成先解決確認（folder/file 起点）

1. フォルダ行の `+` から `sample-folder-child` を作成する
2. 期待結果: 対象フォルダ直下に `sample-folder-child.md` が作成される
3. ファイル行の `+` から `sample-file-sibling` を作成する
4. 期待結果: 対象ファイルの親フォルダ直下に `sample-file-sibling.md` が作成される

## 4. 入力ルール確認

1. `example` を入力して作成する
2. 期待結果: 内部は `example.md` で作成される
3. `example.md` を入力して作成する
4. 期待結果: `.md` が二重付与されない
5. `example.txt` を入力して作成する
6. 期待結果: 作成拒否 + 理由表示
7. `child/example` を入力して作成する
8. 期待結果: 作成拒否 + ファイル名のみ入力可の表示

## 5. 表示名ルール確認

1. 作成成功後のサイドバー表示を確認する
2. 期待結果: 表示名は拡張子なし（`example`）
3. 既存 Markdown 文書（作成前から存在する文書）も確認する
4. 期待結果: 既存文書も拡張子なしで表示される
5. ファイルシステム上の実体を確認する
6. 期待結果: 実体は `.md` 拡張子付き（`example.md`）

## 6. 失敗系確認

- 同名ファイル既存時: 上書きされず失敗する
- rootDir 外解決を試みる入力: 拒否される
- include/exclude 条件外: 拒否される

## 7. 未保存変更ガード確認

1. 既存文書を編集して未保存状態にする
2. サイドバーの `+` をクリックする
3. 期待結果: 既存の未保存変更確認フローが表示される
4. 確認ダイアログの選択結果に応じて作成継続/中止される

## 8. SC-005 応答時間確認（2秒以内）

1. サイドバーの任意ノードで `+` を押して作成画面を開く
2. ファイル名を入力して作成を確定する
3. 作成確定操作時刻を `t0`、ツリー反映かつ新規文書選択完了時刻を `t1` として記録する
4. `t1 - t0` を 10 回計測し、p95 が 2 秒以内であることを確認する
5. 2 秒を超えたケースでは、再現手順と実測値を記録する

## 9. 推奨検証コマンド

```bash
npm run typecheck
npm test
```
