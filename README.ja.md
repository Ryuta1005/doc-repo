# doc-repo

リポジトリ内の Markdown を、フォルダツリーでたどれる静的ドキュメントサイトに変換する CLI です。

> [!WARNING]
> `doc-repo` は現時点で alpha 想定です。CLI の引数仕様や生成ファイル構成は将来変更される可能性があります。

![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)

## なぜ使うのか

リポジトリ内に仕様書・設計メモ・運用ドキュメントが増えると、次の課題が起きやすくなります。

- Markdown ファイルが複数階層に散らばり、全体を追いづらい
- エディタを開かないと文書の中身を横断閲覧しにくい
- 非開発者へ「まずどのファイルを見ればよいか」を共有しづらい

`doc-repo` は、これらを「左ツリー / 右本文」の 2 ペイン閲覧にまとめることで、閲覧導線をシンプルにします。

## 主な特徴

- リポジトリ内の `.md` を再帰的に自動収集
- ディレクトリ構造を保ったツリーナビゲーション
- ローカルサーバー不要（`index.html` を直接開ける）
- ローカルサーバーモード（`doc-repo serve`）に対応
- `serve` 実行中は Markdown の変更を監視して自動再生成
- 再生成成功時に SSE でブラウザを自動リロード
- 対象ディレクトリ指定（`scopePath`）に対応
- `--open` で生成後にブラウザを自動起動

## クイックスタート

前提:

- Node.js 20 以上

リポジトリ内で実行:

```bash
npx doc-repo
```

alpha タグで配布している期間は、次を利用してください。

```bash
npx doc-repo@alpha
```

生成後にブラウザで開く:

```bash
open .doc-repo/index.html
```

特定ディレクトリのみ生成する場合:

```bash
npx doc-repo specs
npx doc-repo docs/project
```

## CLI

```bash
doc-repo [scopePath] [--open]
doc-repo init
doc-repo serve [--port <number>]
```

| 引数 / オプション | 説明                                                     | デフォルト     |
| ----------------- | -------------------------------------------------------- | -------------- |
| `scopePath`       | 生成対象ディレクトリ（Git ルート基準の相対パス）         | Git ルート全体 |
| `--open`          | 生成後に `.doc-repo/index.html` を既定ブラウザで開く     | `false`        |
| `init`            | カレントディレクトリに `doc-repo.config.json` 雛形を生成 | -              |
| `serve`           | 初回生成後にローカル静的サーバーを起動し、変更を監視する | -              |
| `--port`          | `serve` の待受ポート（CLI > 設定 > 既定）                | `4000`         |

### serve の責務

- `doc-repo serve` が `初回生成 → サーバー起動 → ファイル監視開始` を順に実行
- `.md` ファイルの変更・追加・削除を監視し、検知次第再生成する
- 再生成成功時は SSE で接続中のブラウザへ reload イベントを配信する
- HTTP サーバーは配信専任で、生成処理は担当しない
- 初回生成に失敗した場合はサーバーを起動せず、終了コード `1` で終了
- 終了時（Ctrl+C / SIGTERM）は watcher → SSE 接続 → HTTP サーバーの順で停止する

### 対象ルートと収集対象の違い

- 対象ルート: `doc-repo.config.json` が存在すればそこから解決、なければ Git ルート、さらになければカレントディレクトリ
- 収集対象: 対象ルート内で `scopePath` が指すディレクトリ配下

## 設定ファイル

設定項目の詳細とバリデーション仕様は [docs/config.ja.md](./docs/config.ja.md) を参照してください（英語版: [docs/config.md](./docs/config.md)）。

リポジトリルートに `doc-repo.config.json` を置くことで動作を制御できます。

```json
{
  "rootDir": "./docs",
  "include": ["specs/**/*.md"],
  "exclude": ["drafts/**"],
  "port": 4000
}
```

| フィールド | 型         | デフォルト       | 説明                                                      |
| ---------- | ---------- | ---------------- | --------------------------------------------------------- |
| `rootDir`  | `string`   | Git ルート / cwd | Markdown 収集の起点（設定ファイル基準の相対パスで指定）   |
| `include`  | `string[]` | `["**/*.md"]`    | 収集対象の glob パターン。`[]` は未指定と同じ扱い。       |
| `exclude`  | `string[]` | `[]`             | 既定除外に追加する glob パターン                          |
| `port`     | `number`   | `4000`           | `serve` の待受ポート（`--port` CLI オプションで上書き可） |

**解決順序**: 設定ファイル（`doc-repo.config.json`）→ Git ルート → カレントディレクトリ。

**常時除外**（変更不可）: `node_modules/**`, `.git/**`, `.doc-repo/**`

**`exclude` は `include` より優先されます。**

## 生成結果

`.doc-repo` 配下に、Markdown のツリーをミラーしたマルチページ静的サイトを生成します。

```text
.doc-repo/
├── index.html        # ホーム（README があれば README）へリダイレクト
├── styles.css
├── app.js            # ブラウザ側自動リロード（SSE クライアント）
├── README.html
└── docs/
    └── guide/
        └── page.html
```

各 Markdown は単独の `.html` として出力され、文書間リンクは素の相対リンクになります。
そのため `file://` で直接開いても遷移できます。

信頼性に関する挙動:

- 生成成功時のみ `.doc-repo` を置換（再実行で最新化）
- 一時ディレクトリで生成してから切り替え
- 失敗時は既存 `.doc-repo` を保持
- Markdown 0 件時は空サイトを生成し、警告付き成功（exit code 0）

### 終了コード

| コード | 意味                       |
| ------ | -------------------------- |
| `0`    | 成功（警告付き成功を含む） |
| `1`    | 失敗                       |

## 現在の制限事項

- ブラウザ上での Markdown 編集は未対応

## Markdown 対応方針（現状）

- 変換ライブラリ: `markdown-it`
- `html: false`（Markdown 内の生 HTML は無効）
- `linkify: true`, `typographer: true`
- GFM の一部拡張（例: task list、Mermaid、コードハイライト）は未対応
- 相対画像は自動的に `.doc-repo/assets/` へコピーされ、静的ファイルを直接開いた場合と `serve` の両方で表示できるように URL が書き換わります

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
npm run dev -- specs
npm run build
```

ビルド済み CLI 実行:

```bash
node dist/cli/index.js
node dist/cli/index.js specs
```

## Markdown 機能と制限

**サポート中**:

- 相対画像（例：`![alt](./docs/assets/image.png)`）: 自動的に `.doc-repo/assets/` へコピーされ、`file://` モードと `serve` モードの両方で表示可能に URL が書き換わります

**今後のリリースで対応予定**:

- Markdown 内の添付ファイル（PDF、CSV、ZIP など通常リンク `[link](./docs/assets/file.pdf)` で参照されるもの）

## Issues / Feedback

不具合報告や要望は GitHub Issues を利用してください。

## ライセンス

MIT
