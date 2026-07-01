# Getting Started

このガイドでは、doc-repoをインストールし、ブラウザでMarkdownドキュメントを表示・編集するまでの手順を説明します。

## 前提

- Node.js 20以降
- Markdownファイルを含むリポジトリまたはディレクトリ

## インストール・起動

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

次のコマンドでdoc-repoを起動します。

```bash
npm run doc-repo
```

インストール済みのdoc-repoバージョンを確認する場合は、どちらかのバージョンオプションを実行します。

```bash
npm run doc-repo -- --version
```

起動後、ブラウザで次のURLを開きます。

```text
http://localhost:4000
```

画面の左側にドキュメントツリー、右側に選択したMarkdownドキュメントが表示されます。

## ドキュメントの表示と編集

1. 左側のドキュメントツリーからMarkdownファイルを選択します。
2. ドキュメントを編集する場合は、画面右上の **Edit**をクリックします。
3. 内容を編集し、**Save**をクリックします。

保存した内容は、元の`.md`ファイルへ直接反映されます。

編集内容を保存せずに終了する場合は、**Cancel**をクリックします。

対応書式やキーボードショートカットについては、[ドキュメントの編集](./editing.ja.md)を参照してください。

## Configuration

設定ファイルがなくてもdoc-repoを起動できます。

表示するファイルやポート番号を変更する場合は、次のコマンドを実行します。

```bash
npm run doc-repo -- init
```

カレントディレクトリに`doc-repo.config.json`が作成されます。設定を変更した後は、doc-repoを再起動してください。

各設定項目については、[Configuration](./config.ja.md)を参照してください。

## トラブルシューティング

### ポートがすでに使用されている

別のポートを指定して起動します。

```bash
npm run doc-repo -- serve --port 4100
```

### Markdownファイルが表示されない

次の点を確認してください。

- Markdownファイルが`rootDir`配下にある
- `include`の条件に一致している
- `exclude`によって除外されていない
- `node_modules/`、`.git/`、`.doc-repo/`配下に置かれていない

### 設定ファイルが読み込まれない

doc-repoは、カレントディレクトリから上位へ`doc-repo.config.json`を探索し、最初に見つかったファイルを使用します。

設定ファイルがあるディレクトリ、またはその配下のディレクトリでコマンドを実行してください。
