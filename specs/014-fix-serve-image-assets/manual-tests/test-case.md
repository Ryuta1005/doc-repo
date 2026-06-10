# 手動テストケース・手順書（Story 014）

## 事前確認

- [x] `npm install` 実行済み
- [x] `npm run build` 実行済み
- [x] `node dist/cli/index.js --help` が実行できる
- [x] `curl` またはブラウザでHTTP確認できる
- [x] 検証用ディレクトリを新規作成できる
- [x] 既存の `doc-repo serve` プロセスが停止している

## テスト環境情報

- 実施日:
- 実施者:
- OS:
- Node.js:
- ブランチ: 014-fix-serve-image-assets

## Pass/Fail 判定基準

- Pass: 期待結果をすべて満たす
- Fail: 期待結果を1つ以上満たさない
- Blocked: 前提不足または環境制約で実施不能

## 共通準備

1. 任意の作業場所で検証ディレクトリを作成する。
2. 検証ディレクトリに移動する。
3. `docs/assets/` ディレクトリを作成する。
4. `docs/assets/screenshot-sample.png` に小さなPNGファイルを配置する。
5. `README.md` を以下の内容で作成する。

```markdown
# Fixture

![local image](./docs/assets/screenshot-sample.png)

![external image](https://example.com/image.png)

[Guide](./docs/guide.md)

[PDF attachment](./docs/assets/sample.pdf)
```

1. `docs/guide.md` を以下の内容で作成する。

```markdown
# Guide

guide body
```

1. `docs/assets/sample.pdf` に任意の小さなPDFまたはダミーファイルを配置する。

## ケース一覧

| ID      | 目的                                                      | 優先度 |
| ------- | --------------------------------------------------------- | ------ |
| MT-1401 | 相対画像が生成画像としてコピーされることを確認する        | High   |
| MT-1402 | `serve` 経由で相対画像を取得できることを確認する          | High   |
| MT-1403 | `file://` 経由でも相対画像が表示できることを確認する      | High   |
| MT-1404 | `.doc-repo` 外の直接配信が防止されることを確認する        | High   |
| MT-1405 | 外部URL画像・添付リンク・ページリンクの既存挙動を確認する | Medium |
| MT-1406 | テンプレート資産とページ遷移が維持されることを確認する    | Medium |

---

## MT-1401 相対画像が生成画像としてコピーされることを確認する

目的:

- 通常生成後、Markdown の相対画像参照が `.doc-repo` 配下のURLを指し、画像ファイルも `.doc-repo/assets/` 配下にコピーされることを確認する。

手順:

1. 共通準備を完了する。
2. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js` を実行する。
3. `.doc-repo/README.html` を開き、画像の `src` を確認する。
4. `.doc-repo/assets/docs/assets/screenshot-sample.png` の存在を確認する。

期待結果:

- `.doc-repo/README.html` 内のローカル画像 `src` が `.doc-repo` 配下の生成画像を指す相対URLになっている。
- `.doc-repo/assets/docs/assets/screenshot-sample.png` が存在する。
- 通常生成の終了コードが `0` である。

実測:

- 実行結果:
- 判定:
- 補足:

## MT-1402 serve 経由で相対画像を取得できることを確認する

目的:

- `doc-repo serve` で起動したローカルサーバーから、Markdown の相対画像を HTTP 200 として取得できることを確認する。

手順:

1. 共通準備を完了する。
2. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js serve --port 4500` を実行する。
3. ブラウザで `http://localhost:4500/README.html` を開く。
4. 画像が表示されることを確認する。
5. 別ターミナルで `curl -i http://localhost:4500/assets/docs/assets/screenshot-sample.png` を実行する。
6. 確認後、`serve` プロセスを停止する。

期待結果:

- READMEページ上でローカル画像が表示される。
- `curl` のHTTPステータスが `200` である。
- `Content-Type` が画像またはバイナリとして取得可能なレスポンスである。

実測:

- 実行結果:
- HTTPステータス:
- 判定:Pass
- 補足:

## MT-1403 file:// 経由でも相対画像が表示できることを確認する

目的:

- 同じ生成結果を `file://` で直接開いた場合にも、Markdown の相対画像が表示されることを確認する。

手順:

1. MT-1401 の生成結果を使用する。
2. `.doc-repo/README.html` をブラウザで直接開く。
3. 画像が表示されることを確認する。
4. 生成HTMLの `src` が `.doc-repo/assets/` 配下を指していることを確認する。

期待結果:

- `file://` で開いた READMEページ上でローカル画像が表示される。
- 表示にリポジトリルート直下の元ファイルを直接参照する必要がない。

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-1404 .doc-repo 外の直接配信が防止されることを確認する

目的:

- `serve` が `.doc-repo` 外の元画像ファイルを直接配信せず、生成画像だけを配信することを確認する。

手順:

1. 共通準備を完了する。
2. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js serve --port 4500` を実行する。
3. 別ターミナルで `curl -i http://localhost:4500/../docs/assets/screenshot-sample.png` を実行する。
4. 別ターミナルで `curl -i http://localhost:4500/assets/docs/assets/screenshot-sample.png` を実行する。
5. 確認後、`serve` プロセスを停止する。

期待結果:

- `../docs/assets/screenshot-sample.png` の直接配信は成功しない（`200` ではない）。
- `assets/docs/assets/screenshot-sample.png` は `200` で取得できる。
- `serve` の配信範囲は `.doc-repo` 配下に限定されている。

実測:

- 直接配信HTTPステータス:
- 生成画像HTTPステータス:
- 判定:Pass
- 補足:

## MT-1405 外部URL画像・添付リンク・ページリンクの既存挙動を確認する

目的:

- 外部URL画像はコピー対象にならず、通常リンクで参照される添付ファイルは本チケットのコピー対象外であり、実在 Markdown ページへのリンクは従来どおり `.html` リンクへ変換されることを確認する。

手順:

1. MT-1401 の生成結果を使用する。
2. `.doc-repo/README.html` を開く。
3. 外部画像 `https://example.com/image.png` の `src` がそのまま維持されていることを確認する。
4. `PDF attachment` リンクの `href` が添付リンクとして維持され、`.doc-repo/assets/docs/assets/sample.pdf` が作成されていないことを確認する。
5. `Guide` リンクの `href` が `docs/guide.html` になっていることを確認する。
6. 外部画像用のファイルが `.doc-repo/assets/` 配下に作成されていないことを確認する。

期待結果:

- 外部画像URLはHTML内でそのまま維持される。
- 通常リンクで参照される `sample.pdf` は `.doc-repo/assets/` にコピーされない。
- `Guide` リンクは `docs/guide.html` を指す。
- 外部URL画像は `.doc-repo/assets/` にコピーされない。

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-1406 テンプレート資産とページ遷移が維持されることを確認する

目的:

- 参照画像コピー追加後も、既存のテンプレート資産とページ遷移が壊れていないことを確認する。

手順:

1. MT-1402 と同じ手順で `serve` を起動する。
2. `curl -i http://localhost:4500/styles.css` を実行する。
3. `curl -i http://localhost:4500/app.js` を実行する。
4. ブラウザで `http://localhost:4500/README.html` を開き、`Guide` リンクをクリックする。
5. 確認後、`serve` プロセスを停止する。

期待結果:

- `styles.css` が `200` で取得できる。
- `app.js` が `200` で取得できる。
- `Guide` リンクから `docs/guide.html` へ遷移できる。

実測:

- styles.css HTTPステータス:
- app.js HTTPステータス:
- ページ遷移結果:
- 判定:Pass
- 補足:

---

## 結果記録フィールド

- ケースID:
- 実施日時:
- 実施者:
- コマンド:
- 標準出力要点:
- 標準エラー要点:
- HTTPステータス:
- 終了コード:
- 判定:
- 補足:

---

## 総合判定

- 実行ケース数: 6
- Pass:
- Fail:
- Blocked:
- 総合判定:
- 次アクション:
