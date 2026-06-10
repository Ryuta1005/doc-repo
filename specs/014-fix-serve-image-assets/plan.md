# Implementation Plan: serve時の相対画像表示不具合修正

**Branch**: `014-fix-serve-image-assets` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-fix-serve-image-assets/spec.md`

## Summary

`doc-repo serve` で Markdown 内の相対画像が表示されない問題を修正する。現状は Markdown 変換時に画像URLが `.doc-repo` 外を指す相対パスへ変換され、`file://` では表示できる一方、HTTP配信では `.doc-repo` 配下に画像が存在しないため 404 になる。

技術的アプローチ：Markdown 変換時にリポジトリ内の参照画像を `.doc-repo/assets/<repo-relative-path>` へ向ける。生成時に実在する参照画像を同じパスへコピーし、`serve` の配信範囲は `.doc-repo` に閉じたまま `file://` と HTTP の挙動を一致させる。

## Technical Context

**Language/Version**: TypeScript (Node.js >= 20)
**Primary Dependencies**: `markdown-it`（Markdown変換）、`fs-extra`（ファイル操作）、Node.js `path`
**Storage**: ファイルシステム（`.doc-repo` 配下へ生成HTMLと参照画像を出力）
**Testing**: Vitest（`*.test.ts`）、必要に応じて既存 e2e テスト
**Target Platform**: CLI / local static server（macOS / Linux / Windows）
**Project Type**: CLI tool
**Performance Goals**: Markdown から参照される小規模画像コピーのみ。通常利用で体感遅延を増やさない
**Constraints**: `serve` は `.doc-repo` 外を直接配信しない。新規依存は追加しない
**Scale/Scope**: Markdown 画像記法 `![...](...)` の相対画像の生成時コピーとURL変換

## Constitution Check

_Constitution は未記入テンプレートのため、プロジェクト固有のゲートなし。_

- [x] 既存の `src/core/parser`、`src/core/site`、`src/shared/sitePaths.ts` の責務分離に従う
- [x] `serve` の安全な配信範囲を維持し、HTTPサーバー側でリポジトリルート配信を追加しない
- [x] `fs-extra` 以外の新規依存は追加しない
- [x] 回帰テストを先に追加できる粒度に保つ

**Post-design re-check**: 軽量バグ修正のため `research.md`、`data-model.md`、`contracts/` は作成しない。仕様と計画で実装判断に必要な範囲を満たす。

## Project Structure

### Documentation (this feature)

```text
specs/014-fix-serve-image-assets/
├── spec.md              # This feature specification
└── plan.md              # This implementation plan
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── sitePaths.ts                    # 生成画像URLの計算を追加・変更
├── core/
│   ├── parser/
│   │   ├── convertMarkdown.ts          # 参照画像URL変換と画像情報の収集
│   │   └── convertMarkdown.test.ts     # URL変換の回帰テスト
│   └── site/
│       ├── buildSiteBundle.ts          # bundleへ参照画像情報を含める
│       ├── buildSiteBundle.test.ts     # 参照画像収集のテスト
│       ├── copyAssets.ts               # テンプレート資産 + 参照画像コピー
│       └── copyAssets.test.ts          # 参照画像コピーのテスト
└── core/serve/
    └── startStaticServer.test.ts       # 必要に応じて生成画像のHTTP 200を確認

tests/
└── viewer-dom.e2e.test.ts              # 必要に応じて相対画像の生成結果を確認
```

**Structure Decision**: 画像URL変換は既存どおり parser/shared の責務に置き、ファイルコピーは site 生成処理に閉じる。`startStaticServer` は `.doc-repo` 配下を配信するだけの責務を維持し、特別な資産解決ロジックを追加しない。通常リンクで参照される添付ファイルは本チケットでは扱わない。

## Implementation Steps

1. `sitePaths.ts` に `.doc-repo/assets/<repo-relative-path>` への相対URLを返すヘルパーを追加する。
2. `convertMarkdown.ts` で Markdown 画像記法の相対画像を生成資産URLへ変換し、参照画像のリポジトリ相対パスを返せるようにする。
3. `SiteBundle` に参照画像一覧を追加し、`buildSiteBundle.ts` で各 Markdown から集約する。
4. `copyAssets.ts` を拡張し、テンプレート資産に加えて、実在する参照画像を `.doc-repo/assets/` 配下へコピーする。
5. `generateSite.ts` から `rootDir` と bundle の参照画像情報を渡してコピー処理を実行する。
6. 回帰テストを追加し、Markdown の `./docs/assets/screenshot-sample.png` が `.doc-repo` 内の URL と実ファイルに解決されることを確認する。
7. README の「Relative images/links may not render...」の既知制約を、修正後の仕様に合わせて更新する。

## Complexity Tracking

_Constitution Check に違反なし。記入不要。_
