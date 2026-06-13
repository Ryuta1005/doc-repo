# doc-repo

リポジトリ内の Markdown ドキュメントを、ブラウザ上で見やすく閲覧・編集できるドキュメント管理ツールです。Git と Markdown を正本として維持しながら、職種を問わず同じドキュメントを扱える環境を提供します。

> [!WARNING]
> `doc-repo` は現時点で alpha 想定です。CLI の引数仕様や生成ファイル構成は将来変更される可能性があります。

![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)

## なぜ使うのか

仕様駆動開発や AI を活用した開発が広がるにつれ、仕様書・設計書・議事録・運用ドキュメントなどを Markdown で管理する機会が増えています。一方で、Markdown ファイルが複数のディレクトリに分散すると、次の課題が起きやすくなります。

- Markdown ファイルが複数階層に散らばり、全体を追いづらい
- エディタを開かないと文書の中身を横断閲覧しにくい
- 非エンジニアが VS Code や Git を使って内容を探したり修正したりしづらい

`doc-repo` は、リポジトリ内の Markdown を自動的に読み込み、ディレクトリ構造を保ったまま「左ツリー / 右本文」の 2 ペインで表示します。ブラウザ上で文書を編集し、その変更を元の Markdown ファイルへ保存できるため、非エンジニアでも OneNote や Confluence を操作するような感覚で Git リポジトリ上のドキュメントを扱えます。

目的は、単に Markdown を HTML へ変換することではありません。Git と Markdown を正本として維持しながら、誰もがドキュメントを閲覧・編集できるようにすることが中心的なコンセプトです。

## 主な特徴

- リポジトリ内の `.md` を再帰的に自動収集
- ディレクトリ構造を保ったツリーナビゲーション
- ブラウザ上でリポジトリ内 Markdown を閲覧・編集できるドキュメントワークスペース
- 編集内容を元の Markdown ファイルへ保存
- ローカルサーバーモード（`doc-repo serve`）に対応
- `serve` 実行中は Markdown の変更を監視
- Markdown 変更検知時に SSE でブラウザを自動リロード

> [!IMPORTANT]
> タスク 020 の方針により、静的生成の直接入口（`doc-repo [scopePath]`）は廃止されました。
> サポートされる正規入口は `doc-repo serve` のみです。

## クイックスタート

前提:

- Node.js 20 以上

リポジトリ内で実行:

```bash
npx doc-repo serve
```

alpha タグで配布している期間は、次を利用してください。

```bash
npx doc-repo@alpha serve
```

起動後にブラウザで `http://localhost:4000` を開きます。

## CLI

```bash
doc-repo init
doc-repo serve [--port <number>]
```

| 引数 / オプション | 説明                                                     | デフォルト |
| ----------------- | -------------------------------------------------------- | ---------- |
| `init`            | カレントディレクトリに `doc-repo.config.json` 雛形を生成 | -          |
| `serve`           | ローカルサーバーを起動し、変更を監視する                 | -          |
| `--port`          | `serve` の待受ポート（CLI > 設定 > 既定）                | `4000`     |

### serve の責務

- `doc-repo serve` が `サーバー起動 → ファイル監視開始` を順に実行
- `.md` ファイルの変更・追加・削除を監視し、検知時に SSE でブラウザへ reload イベントを配信する
- HTTP サーバーは Viewer 資産とワークスペースファイルを同一 origin で配信する
- 終了時（Ctrl+C / SIGTERM）は watcher → SSE 接続 → HTTP サーバーの順で停止する

### 対象ルート

- 対象ルート: `doc-repo.config.json` が存在すればそこから解決、なければ Git ルート、さらになければカレントディレクトリ
- 収集対象: 対象ルート配下の Markdown 全体（`include`/`exclude` で絞り込み）

## 設定ファイル

設定項目の詳細とバリデーション仕様は [docs/config.ja.md](./docs/config.ja.md) を参照してください（英語版: [docs/config.md](./docs/config.md)）。

リポジトリルートに `doc-repo.config.json` を置くことで動作を制御できます。

```json
{
  "name": "Doc Repo",
  "rootDir": "./docs",
  "include": ["specs/**/*.md"],
  "exclude": ["drafts/**"],
  "port": 4000
}
```

| フィールド | 型         | デフォルト       | 説明                                                      |
| ---------- | ---------- | ---------------- | --------------------------------------------------------- |
| `name`     | `string`   | `"Doc Repo"`     | サイドバー上部に表示するサイト名                          |
| `rootDir`  | `string`   | Git ルート / cwd | Markdown 収集の起点（設定ファイル基準の相対パスで指定）   |
| `include`  | `string[]` | `["**/*.md"]`    | 収集対象の glob パターン。`[]` は未指定と同じ扱い。       |
| `exclude`  | `string[]` | `[]`             | 既定除外に追加する glob パターン                          |
| `port`     | `number`   | `4000`           | `serve` の待受ポート（`--port` CLI オプションで上書き可） |

**解決順序**: 設定ファイル（`doc-repo.config.json`）→ Git ルート → カレントディレクトリ。

**常時除外**（変更不可）: `node_modules/**`, `.git/**`, `.doc-repo/**`

**`exclude` は `include` より優先されます。**

## 生成結果

`.doc-repo` 配下に、`serve` 実行のためのランタイム成果物を生成します。

```text
.doc-repo/
├── index.html        # serve のエントリ
├── assets/
├── viewer/
└── ...
```

生成成果物は `doc-repo serve` 経由で利用することを前提とします。

信頼性に関する挙動:

- Viewer 資産と API を同一 origin / 同一 port で配信
- ワークスペースファイル配信時にパストラバーサルを防止
- API 失敗時は JSON エラーペイロードを返却

### 終了コード

| コード | 意味                       |
| ------ | -------------------------- |
| `0`    | 成功（警告付き成功を含む） |
| `1`    | 失敗                       |

## Markdown 対応方針（現状）

- 変換ライブラリ: `markdown-it`
- `html: false`（Markdown 内の生 HTML は無効）
- `linkify: true`, `typographer: true`
- GFM の一部拡張（例: task list、Mermaid、コードハイライト）は未対応
- 相対画像はワークスペース相対のアセットパスへ書き換えられ、`serve` で配信されます

## セキュリティ注意

- 生 HTML は無効化していますが、生成対象は基本的に信頼できるリポジトリを想定してください
- 未知のリポジトリに対して実行する場合は、生成結果を確認してから共有してください

## `.doc-repo` の Git 管理方針

用途に応じて選択してください。

- 一時生成物として扱う場合: `.gitignore` に `.doc-repo/` を追加
- 成果物配布・公開に使う場合: 生成物コミット運用も可（毎回再生成で置換される前提）

## 開発者向け

開発者向け手順:

```bash
npm install
npm run dev
npm run dev -- serve
npm run build
```

ビルド済み CLI 実行:

```bash
node dist/cli/index.js
node dist/cli/index.js serve
```

## Markdown 機能と制限

**サポート中**:

- 相対画像（例：`![alt](./docs/assets/image.png)`）: `/assets/...` へ書き換えられ、`serve` モードで表示できます

**今後のリリースで対応予定**:

- Markdown 内の添付ファイル（PDF、CSV、ZIP など通常リンク `[link](./docs/assets/file.pdf)` で参照されるもの）

## Issues / Feedback

不具合報告や要望は GitHub Issues を利用してください。

## ライセンス

MIT
