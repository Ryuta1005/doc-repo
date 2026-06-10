# ISSUE: serve時にREADME画像が表示されない

## メタ情報

- 種別: Task
- 番号: 014
- Epic: 004
- ステータス: Todo
- 優先度: P1
- Spec: 005-local-server-serve, 006-markdown-watch
- Depends On: 005, 006

## バグの内容

`README.ja.md` に記載した画像 `./docs/assets/screenshot-sample.png` が、`node dist/cli/index.js serve` で表示されない。
一方で、生成済みHTMLを `file://` で直接開くと表示される。

## 再現手順

1. リポジトリルートで `node dist/cli/index.js serve` を実行する。
2. ブラウザで表示された `README.ja.md` 相当ページを開く。
3. `![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)` の画像が表示されないことを確認する。
4. 同じ生成結果を `open .doc-repo/README.ja.html` で直接開く。
5. 画像が表示されることを確認する。

## 原因

- Markdown変換時に画像URLが `../docs/assets/screenshot-sample.png` へリベースされる。
- `serve` の静的サーバーは配信ルートを `.doc-repo` 配下に限定している。
- `../docs/assets/...` は `.doc-repo` の外を指すため、`serve` 経由では配信できない。
- 生成時に `.doc-repo` へコピーされる静的ファイルは `styles.css` と `app.js` のみで、`docs/assets` は含まれない。

## 修正案

A. 画像・添付資産を `.doc-repo/assets` に収集してコピーし、生成HTMLの参照先も `.doc-repo` 配下へ向ける。
B. `serve` の配信ルートを「リポジトリルート配下」まで広げる（ただし公開範囲の安全性要件を再定義する）。
C. `serve` のみ資産解決ルールを分岐させず、Aの方式で `file://` と `serve` の挙動を一致させる（推奨）。

## 期待結果（完了条件）

- `file://` と `serve` のどちらでも、README内の相対画像が同じように表示される。
- 画像・添付を含む相対パスの解決ルールがドキュメント化される。
- 既存の `serve` テストと生成テストに回帰ケースが追加される。
