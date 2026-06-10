# Quickstart: 設定ファイルによる動作設定（Story 007）

## 参照

- 仕様: [spec.md](./spec.md)
- 実装計画: [plan.md](./plan.md)

## Prerequisites

- Node.js 20 以上
- 依存インストール済み

```bash
npm install
npm run build
```

## 1. rootDir を指定した generate を確認

1. リポジトリ内に `doc-repo.config.json` を作成する。

```json
{
  "rootDir": "./docs"
}
```

2. `doc-repo` をオプションなしで実行する。

```bash
node dist/cli/index.js
```

期待結果:

- `docs/` 配下のみが収集対象になる
- 生成物は `./.doc-repo` に出力される

## 2. include / exclude の反映を確認

```json
{
  "rootDir": ".",
  "include": ["specs/**/*.md"],
  "exclude": ["specs/**/manual-tests/**"]
}
```

```bash
node dist/cli/index.js
```

期待結果:

- `specs/**/*.md` のみ収集される
- `manual-tests` 配下は除外される
- `.git` / `node_modules` / `.doc-repo` は常に除外される

## 3. serve が同じ設定を使うことを確認

```bash
node dist/cli/index.js serve
```

期待結果:

- `generate` と同じ対象集合で初回生成される
- watch も同じ `rootDir` / `include` / `exclude` に従う

## 4. CLI port 優先を確認

```json
{
  "port": 3000
}
```

```bash
node dist/cli/index.js serve --port 5000
```

期待結果:

- 待受ポートは 5000
- 設定ファイルの 3000 より CLI 指定が優先される

## 5. バリデーション失敗を確認

```json
{
  "rootDir": "./README.md",
  "port": 70000
}
```

```bash
node dist/cli/index.js
```

期待結果:

- 終了コード 1
- 問題のあるフィールド名と理由が表示される

## Manual Verification Targets

- 設定ファイルあり/なしで `generate` と `serve` の対象集合が一致する
- `include: []` が空サイト生成になる
- `include: []` が全 `**/*.md` 収集になる（`include` 未指定と同一）
- `exclude` が既定除外へ追加される
- `rootDir` が存在しない、またはディレクトリでない場合に失敗する
