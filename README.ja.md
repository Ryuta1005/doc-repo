# doc-repo

doc-repoは、Gitリポジトリ内のMarkdownファイルをブラウザで閲覧・編集するためのローカルワークスペースです。

Markdownファイルを正本として維持しながら、リポジトリのディレクトリ構造をたどってドキュメントを探し、ブラウザから更新できます。

> [!WARNING]
> doc-repoは現在alpha版です。CLIの挙動、編集機能、生成されるランタイムファイルは、今後のリリースで変更される可能性があります。

![doc-repo Viewer](./docs/assets/screenshot-sample.png)

## Git and Markdown as the Source of Truth

仕様書や設計資料をGitリポジトリ内のMarkdownで管理すると、コードと同じように変更履歴を残し、レビューしながら更新できます。仕様駆動開発やAIを活用した開発とも相性がよく、リポジトリ上のMarkdownをドキュメントの **Source of Truth** にできます。

一方で、リポジトリ内のMarkdownを読むためにエディタを開いてファイルを探したり、更新のためにGitを扱ったりすることは、チームの全員にとって使いやすいとは限りません。

doc-repoは、Markdownを別のドキュメントサービスへ移すことなく、ブラウザから閲覧・編集できるワークスペースを提供します。編集内容は元のMarkdownファイルへ保存されるため、リポジトリをSource of Truthとして維持できます。

## 主な機能

- リポジトリのディレクトリ構造を保ったまま、Markdownドキュメントをブラウザで閲覧
- ブラウザからMarkdownドキュメントをリッチテキストで編集

## Quick Start

### 前提

- Node.js 20以降
- Markdownファイルを含むリポジトリまたはディレクトリ

### インストール・起動

Markdownファイルを管理しているプロジェクトに、doc-repoを`devDependencies`としてインストールします。

```bash
npm install --save-dev doc-repo@alpha
```

`package.json`の`scripts`にdoc-repoを追加します。

```json
{
  "scripts": {
    "doc-repo": "doc-repo"
  }
}
```

doc-repoを起動します。

```bash
npm run doc-repo
```

ブラウザで次のURLを開きます。

```text
http://localhost:4000
```

画面の左側にドキュメントツリー、右側に選択したMarkdownドキュメントが表示されます。

詳しい手順については、[Getting Started](./docs/getting-started.ja.md)を参照してください。

## Documentation

- [Getting Started](./docs/getting-started.ja.md)
- [Configuration](./docs/config.ja.md)
- [ドキュメントの編集](./docs/editing.ja.md)

## CLI

```bash
npm run doc-repo
npm run doc-repo -- init
npm run doc-repo -- serve --port 4100
```

| コマンド・オプション | 説明                                   |
| -------------------- | -------------------------------------- |
| `doc-repo`           | ローカルワークスペースを起動する       |
| `init`               | `doc-repo.config.json`を作成する       |
| `serve`              | ワークスペースの起動を明示的に指定する |
| `--port <number>`    | Viewerを起動するポート番号を指定する   |

## Configuration

設定ファイルがなくてもdoc-repoを起動できます。

表示するファイルやポート番号を変更する場合は、次のコマンドで`doc-repo.config.json`を作成します。

```bash
npm run doc-repo -- init
```

各設定項目については、[Configuration](./docs/config.ja.md)を参照してください。

## Editing

Viewerの **Edit**をクリックすると、選択中のMarkdownドキュメントを編集できます。保存した内容は、リポジトリ内の元の`.md`ファイルへ直接反映されます。

Viewerで表示できるMarkdownのすべてを、リッチテキストエディタで編集・保持できるとは限りません。

対応書式やキーボードショートカットについては、[ドキュメントの編集](./docs/editing.ja.md)を参照してください。

## Runtime Files

doc-repoは、ランタイムファイルを`.doc-repo/`ディレクトリに作成します。

`.gitignore`へ追加してください。

```gitignore
.doc-repo/
```

## Security

- doc-repoは信頼できるリポジトリで使用してください
- Markdownのraw HTMLはレンダリングされません
- ローカルサーバーを信頼できないネットワークへ公開しないでください

## Development

```bash
npm install
npm run dev -- serve
npm test
npm run build
```

ビルド済みのCLIを起動する場合は、次のコマンドを実行します。

```bash
node dist/cli/index.js serve
```

## Issues / Feedback

不具合報告や機能要望は、GitHub Issuesへ投稿してください。

## License

MIT
