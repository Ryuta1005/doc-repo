# Getting Started

このガイドでは、初回起動から最初のブラウザ編集までを一通り確認します。

## Prerequisites

- Node.js 20+
- Markdown ファイルを含むリポジトリまたはディレクトリ

## Start with `npx`

閲覧したいリポジトリで実行します。

```bash
npx doc-repo
```

パッケージが alpha タグで公開されている場合は、次を使います。

```bash
npx doc-repo@alpha
```

その後、次の URL を開きます。

```text
http://localhost:4000
```

Viewer には左側にドキュメントツリー、右側に選択した Markdown ドキュメントが表示されます。

## Start with a Local Install

`doc-repo` がプロジェクトにローカルインストールされている場合:

```bash
npx doc-repo
```

`npx doc-repo serve` は同じ処理を明示的に実行する形式です。

このリポジトリのソースから作業している場合:

```bash
npm install
npm run dev -- serve
```

## Create a Configuration File

テンプレートを作成します。

```bash
npx doc-repo init
```

これにより、現在のディレクトリに `doc-repo.config.json` が書き出されます。

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

設定を変更した後は、`doc-repo` を再実行してください。

すべての設定ルールは [Configuration](./config.ja.md) を参照してください。

## Browse Markdown Files

1. `doc-repo` を起動します。
2. `http://localhost:4000` を開きます。
3. 左側のツリーから Markdown ファイルを選択します。
4. メインペインでレンダリングされたドキュメントを読みます。

ドキュメントが表示されない場合は、Markdown ファイルが `rootDir` 配下にあり、`include` / `exclude` 設定に一致しているか確認してください。

## Edit and Save a Document

1. Markdown ドキュメントを選択します。
2. **Edit** をクリックします。
3. エディタで小さな変更を加えます。
4. **Save** をクリックします。
5. リポジトリ内の元の `.md` ファイルを確認します。

> [!CAUTION]
> ブラウザでの編集内容は、元の Markdown ファイルへ直接書き込まれます。
> 特にリッチテキスト編集が alpha の間は、編集前に変更をコミットするかバックアップしてください。

対応書式、保存警告、キーボードショートカットは [Editing and Keyboard Shortcuts](./editing.ja.md) を参照してください。

## Runtime Files

ローカルワークスペースは `.doc-repo/` をランタイム成果物ディレクトリとして作成します。

`.gitignore` に追加してください。

```gitignore
.doc-repo/
```

## Common First-Run Issues

### Port already in use

別のポートを使います。

```bash
npx doc-repo serve --port 4100
```

### No Markdown files are shown

確認してください。

- Markdown ファイルが `rootDir` 配下に存在する。
- `include` が期待するファイルに一致している。
- `exclude` が対象ファイルを除外していない。
- `node_modules/`, `.git/`, `.doc-repo/` 配下のファイルは常に除外される。

### Config is not being used

doc-repo は現在の作業ディレクトリから上位へ `doc-repo.config.json` を探します。リポジトリ、または設定ファイル配下のサブディレクトリからコマンドを実行してください。
