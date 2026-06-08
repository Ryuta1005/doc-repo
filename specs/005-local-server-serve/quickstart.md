# Quickstart: ローカルサーバー起動（Story 005）

## 参照

- タスク一覧: [tasks.md](./tasks.md)
- 受け入れ条件: [spec.md](./spec.md)

## Prerequisites

- Node.js 20 以上
- 依存インストール済み

```bash
npm install
```

## 1. ビルド

```bash
npm run build
```

## 2. 生成物なし状態で serve を実行

```bash
rm -rf .doc-repo
node dist/cli/index.js serve
```

期待結果:

- 初回生成が先に実行される
- 生成成功後に `http://localhost:4000` が表示される
- サーバー起動後に監視開始メッセージが表示される

## 3. ポート優先順位の確認

設定ファイルに `port: 4000` を設定したうえで、CLI で上書きする。

```bash
cat > doc-repo.config.json <<'JSON'
{
  "port": 4000
}
JSON

node dist/cli/index.js serve --port 4500
```

期待結果:

- 起動 URL が `http://localhost:4500` になる

## 4. 初回生成失敗の確認

テンプレートを一時退避し、初回生成を失敗させる。

```bash
mv templates templates.__bak__
node dist/cli/index.js serve
mv templates.__bak__ templates
```

期待結果:

- 初回生成失敗の理由が表示される
- サーバーは起動しない
- 終了コードが `1`

## 5. ポート競合の確認

別プロセスでポート占有後に起動する。

```bash
node -e "require('node:http').createServer(()=>{}).listen(4000)" &
node dist/cli/index.js serve
```

期待結果:

- ポート競合エラーが表示される
- 終了コードが `1`

## 6. 停止確認

起動中の `doc-repo serve` に対して `Ctrl+C` を送る。

期待結果:

- プロセスが終了する
- 同一ポートで再起動できる
