# Quickstart: 設定ファイル雛形の生成（doc-repo init）

**Date**: 2026-06-10
**Branch**: `008-config-file-init`

## 新規プロジェクトへの導入手順

### 1. `doc-repo init` を実行する

```bash
cd /path/to/your-project
doc-repo init
```

**出力例（初回）**:

```
設定ファイルを作成しました: /path/to/your-project/doc-repo.config.json
```

**出力例（既存ファイルあり）**:

```
設定ファイルは既に存在します: /path/to/your-project/doc-repo.config.json
```

### 2. 生成された設定ファイルを確認・編集する

```json
{
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

必要に応じて各フィールドを編集してください:

- `rootDir`: Markdown ファイルを収集するルートディレクトリ（例: `"./docs"`）
- `include`: 収集対象の glob パターン（デフォルトは全 `.md` ファイル）
- `exclude`: 除外する glob パターン（例: `["node_modules/**", "drafts/**"]`）
- `port`: `doc-repo serve` で使用するポート番号（デフォルト: `4000`）

### 3. サイトを生成する

```bash
doc-repo
```

## エラーケース

### 書き込み権限がない場合

```
エラー: 設定ファイルの作成に失敗しました。
理由: ...
```

終了コード `1` で終了します。

## 関連コマンド

- `doc-repo` — Markdown からサイトを生成する
- `doc-repo serve` — ローカルサーバーでサイトを起動する
