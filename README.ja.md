# doc-repo

doc-repo は、Git リポジトリ内の Markdown ファイルをブラウザで閲覧・編集するためのローカルワークスペースです。
Markdown ファイルを正本として維持しながら、リポジトリ内のドキュメントを構造で探しやすくし、ブラウザから更新できるようにします。

> [!WARNING]
> `doc-repo` は現在 alpha 版です。CLI の挙動、編集機能、生成されるランタイムファイルは今後のリリースで変更される可能性があります。

![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)

## Git and Markdown as the Source of Truth

仕様書や設計資料をGitリポジトリ内のMarkdownで管理すれば、コードと同じように変更履歴を残し、レビューしながら更新できます。仕様駆動開発やAIを活用した開発とも相性がよく、リポジトリ上のMarkdownをドキュメントの **Source of Truth** にできます。

一方で、リポジトリ内のMarkdownを読む・更新するには、エディタを開いてファイルを探したり、Gitを使った開発フローを理解したりする必要があります。そのため、チームの全員にとって使いやすいとは限りません。

NotionやConfluenceなどへ同じ内容を移せば扱いやすくなりますが、リポジトリとドキュメントサービスの二重管理になり、内容が食い違う可能性があります。

doc-repoは、リポジトリ内のMarkdownを別のサービスへ移すことなく、ブラウザから閲覧・編集できるワークスペースを提供します。既存のディレクトリ構造をそのまま辿ることができ、編集内容は元のMarkdownファイルへ保存されます。これにより、リポジトリ上のMarkdownをSource of Truthとして維持できます。

## Features

- 設定されたルート配下の `.md` ファイルを再帰的に検出
- リポジトリ内ドキュメントを 2 ペインのブラウザワークスペースで表示
- ツリーナビゲーションでディレクトリ構造を保持
- ブラウザ編集に対応し、変更を Markdown ファイルへ保存
- ローカルワークスペースの実行中に Markdown ファイルを監視
- Markdown ファイルの変更時にブラウザを自動リロード
- Viewer UI ラベルは英語と日本語に対応

コマンドを指定せずに `doc-repo` を実行すると、ローカルブラウザワークスペースが起動します。`doc-repo serve` は同じ処理を明示的に実行する形式です。

## Quick Start

前提:

- Node.js 20+

リポジトリ内で実行します。

```bash
npx doc-repo
```

パッケージが alpha タグで公開されている場合は、次を使います。

```bash
npx doc-repo@alpha
```

その後、ブラウザで `http://localhost:4000` を開きます。

## Documentation

- [Getting Started](./docs/getting-started.ja.md)
- [Configuration](./docs/config.ja.md)
- [Editing and Keyboard Shortcuts](./docs/editing.ja.md)

## CLI Overview

```bash
doc-repo init
doc-repo
doc-repo serve [--port <number>]
```

| コマンド / オプション | 説明                                                   |
| --------------------- | ------------------------------------------------------ |
| `init`                | `doc-repo.config.json` のテンプレートを作成            |
| `doc-repo`            | ローカルブラウザワークスペースを起動し Markdown を監視 |
| `serve`               | デフォルトのワークスペースコマンドを明示的に実行       |
| `--port <number>`     | 設定値またはデフォルトの serve ポートを上書き          |

## Configuration

ワークスペースを設定するには `doc-repo.config.json` を作成します。明示的な最小設定は次のようになります。

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

解決規則、デフォルト除外、バリデーション、その他の例は [Configuration](./docs/config.ja.md) を参照してください。

## Viewer Language

Viewer UI は英語と日本語に対応しています。左サイドバー下部に固定された地球アイコン付きメニューから表示言語を切り替えられます。

デフォルト言語は英語で、選択した言語はページ再読み込み後も復元されます。これは Viewer UI のみを変更します。CLI メッセージ、Markdown 本文、リポジトリ構成は翻訳されません。

## Editing

Viewer の **Edit** をクリックすると、現在のドキュメントをリッチテキスト編集モードに切り替えられます。保存すると、編集内容は元の Markdown ファイルへ書き戻されます。

> [!CAUTION]
> ブラウザでの編集内容は、元の Markdown ファイルへ直接書き込まれます。
> 特にリッチテキスト編集が alpha の間は、編集前に変更をコミットするかバックアップしてください。

対応書式、保存時の検証、未対応 Markdown の警告、保存エラー分類、未保存変更の保護、キーボードショートカットは [Editing and Keyboard Shortcuts](./docs/editing.ja.md) を参照してください。

## Markdown Support

- レンダリングには `markdown-it` を使用します。
- Markdown 内の raw HTML は無効です。
- `linkify` と `typographer` は有効です。
- 相対画像はワークスペース相対のアセット URL に書き換えられ、ローカルワークスペースで配信されます。
- GFM task list は task list UI としては現在サポートされていません。
- Mermaid diagram は diagram として描画されません。
- fenced code block の syntax highlighting は現在提供されていません。
- Markdown からリンクされた PDF、CSV、ZIP などのファイルはリンクとして残る場合がありますが、添付ファイルのコピーや配信は専用機能としてはまだ提供されていません。

Viewer で表示できる Markdown と、リッチテキストエディタで編集・保持できる Markdown は同じではありません。エディタはより小さい書式セットに対応しており、未対応 Markdown セグメントが検出された場合は保存前に警告することがあります。

## Runtime Artifacts

ローカルワークスペースは `.doc-repo/` 配下にランタイムファイルを作成します。

`.doc-repo/` は生成されるランタイム成果物として扱い、`.gitignore` に追加してください。

## Security Notes

- doc-repo は信頼できるリポジトリで使用してください。
- Markdown レンダリング時、raw HTML は無効化されます。
- ローカルサーバーは Viewer に必要なワークスペースファイルを配信するため、信頼できないネットワークへ公開しないでください。

## Development

コントリビューター向け:

```bash
npm install
npm run dev -- serve
npm test
npm run build
```

ビルド済み CLI を実行します。

```bash
node dist/cli/index.js serve
```

## Issues / Feedback

不具合報告や要望は GitHub Issues を利用してください。

## License

MIT
