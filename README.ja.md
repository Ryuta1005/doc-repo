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
doc-repo serve [--port <number>]
```

| 引数 / オプション | 説明                                                     | デフォルト     |
| ----------------- | -------------------------------------------------------- | -------------- |
| `scopePath`       | 生成対象ディレクトリ（Git ルート基準の相対パス）         | Git ルート全体 |
| `--open`          | 生成後に `.doc-repo/index.html` を既定ブラウザで開く     | `false`        |
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

- 対象ルート: Git ルート（見つからない場合はカレント）
- 収集対象: 対象ルート内で `scopePath` が指すディレクトリ配下

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
- include/exclude の詳細設定は未対応

## Markdown 対応方針（現状）

- 変換ライブラリ: `markdown-it`
- `html: false`（Markdown 内の生 HTML は無効）
- `linkify: true`, `typographer: true`
- GFM の一部拡張（例: task list、Mermaid、コードハイライト）は未対応
- 相対画像・相対リンクは現状「入力ファイル配置を維持した再配置」をしていないため、構成によっては期待通りに表示されない場合あり

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
```

ビルド:

```bash
npm run build
```

ビルド済み CLI 実行:

```bash
node dist/cli/index.js
node dist/cli/index.js specs
```

## Issues / Feedback

不具合報告や要望は GitHub Issues を利用してください。

## ライセンス

MIT
