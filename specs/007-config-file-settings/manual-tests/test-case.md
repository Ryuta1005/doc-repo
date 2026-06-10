# 手動テストケース・手順書（Story 007）

## 実施前チェック

- [x] `npm install` 済み
- [x] `npm run build` が成功
- [x] 検証用のディレクトリ構成（`docs/`, `drafts/`, `specs/` など）を用意
- [x] 既存の `doc-repo serve` が停止している

## テスト環境情報

- 実施日:
- 実施者:
- OS:
- Node.js:
- ブランチ: `007-config-file-settings`

## 判定基準

- Pass: 期待結果をすべて満たす
- Fail: 期待結果を1つでも満たさない
- Blocked: 前提不備で実行不能

## ケース一覧

| ID     | 目的                                       | 優先度 |
| ------ | ------------------------------------------ | ------ |
| MT-701 | rootDir 相対解決と generate/serve 適用確認 | High   |
| MT-702 | rootDir 省略時の決定確認                   | High   |
| MT-703 | 設定なし `.git` / `cwd` fallback 確認      | High   |
| MT-704 | include/exclude の generate 適用確認       | High   |
| MT-705 | serve watch 範囲と generate 範囲一致確認   | High   |
| MT-706 | `include: []` の収集対象ゼロ確認           | Medium |
| MT-706 | `include: []` の未指定扱い確認             | Medium |
| MT-707 | `--port` 優先確認                          | Medium |
| MT-708 | JSON 構文エラー確認                        | High   |
| MT-709 | `rootDir` 不在/非ディレクトリエラー確認    | High   |
| MT-710 | `include` / `exclude` 型不正エラー確認     | Medium |
| MT-711 | `port` 型/範囲不正エラー確認               | Medium |

---

## MT-701 rootDir 相対解決と generate/serve 適用確認

目的:

- 相対 `rootDir` が設定ファイル配置ディレクトリ基準で解決され、`generate` と `serve` の両方に反映されることを確認する。

手順:

1. 設定ファイル配置ディレクトリに `doc-repo.config.json` を作成する。
2. 設定に `{"rootDir":"./docs"}` を記載する。
3. `node dist/cli/index.js` を実行する。
4. `node dist/cli/index.js serve` を実行する。
5. 生成・監視対象が `docs/` 起点であることを確認する。

期待結果:

- 生成対象は `docs/` 配下
- 生成物は `docs/.doc-repo`
- serve の初回生成と監視も `docs/` 基準

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-702 rootDir 省略時の決定確認

目的:

- 設定ファイルが存在し `rootDir` が省略された場合、設定ファイル配置ディレクトリが rootDir になることを確認する。

手順:

1. `doc-repo.config.json` を `{}` で作成する。
2. 設定ファイル配置ディレクトリ直下に対象 `.md` を置く。
3. `node dist/cli/index.js` を実行する。

期待結果:

- 設定ファイル配置ディレクトリを rootDir として収集する
- `.doc-repo` がその配下に生成される

実測:

- 実行結果:
- 判定:Passspecs/007-config-file-settings/manual-tests/test-case.md
- 補足:

## MT-703 設定なし `.git` / `cwd` fallback 確認

目的:

- 設定ファイルがない場合に `.git` 探索、さらに `cwd` fallback が機能することを確認する。

手順:

1. `doc-repo.config.json` が存在しない状態を作る。
2. `.git` 配下のサブディレクトリから `node dist/cli/index.js` を実行する。
3. `.git` のない一時ディレクトリで同コマンドを実行する。

期待結果:

- `.git` がある場合: `.git` ルートを rootDir とする
- `.git` がない場合: `cwd` を rootDir とする

実測:

- 実行結果:
- 判定:
- 補足:

## MT-704 include/exclude の generate 適用確認

目的:

- `include`/`exclude` が generate で適用され、`exclude` が優先されることを確認する。

手順:

1. `doc-repo.config.json` に `include` と `exclude` を設定する。
2. 両方に一致する `.md` を1件用意する。
3. `node dist/cli/index.js` を実行する。
4. 出力結果の対象一覧を確認する。

期待結果:

- `include` 一致かつ `exclude` 不一致のみ出力対象
- 両方一致したファイルは除外される
- 既定除外（`.git`, `node_modules`, `.doc-repo`）は常に除外される

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-705 serve watch 範囲と generate 範囲一致確認

目的:

- `serve` の監視範囲が generate の収集範囲と一致することを確認する。

手順:

1. `include` / `exclude` を設定した `doc-repo.config.json` を用意する。
2. `node dist/cli/index.js serve` を実行する。
3. 収集対象内 `.md` を変更し、再生成が走ることを確認する。
4. 除外対象 `.md` を変更し、再生成しないことを確認する。

期待結果:

- 対象内変更は再生成される
- 除外対象変更は無視される
- generate と watch の対象が一致する

実測:

- 実行結果:
- 判定:
- 補足:

## MT-706 include: [] の収集対象ゼロ確認

目的:

## MT-706 include: [] の未指定扱い確認

手順:

- `include: []` が `include` 省略と同一扱いとなり、全 `**/*.md` が収集対象になることを確認する。

1. `doc-repo.config.json` に `"include": []` を設定する。
2. `node dist/cli/index.js` を実行する。
3. 必要に応じて `node dist/cli/index.js serve` も実行する。

期待結果:

期待結果:

- `include` を指定しない場合と同じ Markdown が収集される
- 全 `**/*.md` が対象になる（空サイトにはならない）
  実測:

- 実行結果:
- 判定:
- 補足:

## MT-707 --port 優先確認

目的:

- CLI `--port` が設定ファイル `port` より優先されることを確認する。

手順:

1. `doc-repo.config.json` に `"port": 3000` を設定する。
2. `node dist/cli/index.js serve --port 5000` を実行する。
3. 待受ポート表示を確認する。

期待結果:

- 実際の待受ポートは 5000

実測:

- 実行結果:Pass
- 判定:
- 補足:

## MT-708 JSON 構文エラー確認

目的:

- JSON 構文エラー時に終了コード 1 と原因表示になることを確認する。

手順:

1. `doc-repo.config.json` に不正 JSON を記載する（例: 末尾カンマ）。
2. `node dist/cli/index.js` を実行する。

期待結果:

- 終了コード 1
- 構文エラー内容が表示される

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-709 rootDir 不在/非ディレクトリエラー確認

目的:

- `rootDir` が存在しない、またはファイルを指す場合に失敗することを確認する。

手順:

1. `rootDir` に存在しないパスを設定して実行する。
2. `rootDir` にファイルパス（例: `./README.md`）を設定して実行する。

期待結果:

- いずれも終了コード 1
- `rootDir` が問題であることと理由が表示される

実測:

- 実行結果:Pass
- 判定:
- 補足:

## MT-710 include/exclude 型不正エラー確認

目的:

- `include` / `exclude` が文字列配列以外の場合に失敗することを確認する。

手順:

1. `include` に文字列を設定して実行する。
2. `exclude` に数値配列を設定して実行する。

期待結果:

- 終了コード 1
- 該当フィールド名と型不正理由が表示される

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-711 port 型/範囲不正エラー確認

目的:

- `port` 型不正または範囲外で失敗することを確認する。

手順:

1. `port` に文字列を設定して実行する。
2. `port` に `70000` を設定して実行する。

期待結果:

- 終了コード 1
- `port` フィールドが問題であることと理由が表示される

実測:

- 実行結果:Pass
- 判定:
- 補足:

---

## 結果記録フィールド

- ケースID:
- 実施日時:
- 実施者:
- コマンド:
- 標準出力要点:
- 標準エラー要点:
- 終了コード:
- 判定:
- 補足:

---

## 総合判定

- 実行ケース数: 11
- Pass:
- Fail:
- Blocked:
- 総合判定:
- 次アクション:
