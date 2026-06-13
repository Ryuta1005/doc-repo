# Quickstart: React + Hono ワークスペース基盤（Task 019）

## 参照

- 仕様: [spec.md](./spec.md)
- 実装計画: [plan.md](./plan.md)
- 調査: [research.md](./research.md)

## Prerequisites

- Node.js 20 以上
- 依存インストール済み

```bash
npm install
npm run build
```

## 1. `serve` の体験維持を確認

```bash
node dist/cli/index.js serve
```

確認項目:

- サーバー起動が成功する
- 左ツリーと本文エリアが表示される
- 文書選択で本文が切り替わる
- 相対画像・静的アセットが表示される

## 2. 変更監視と自動更新を確認

1. Markdown を変更して保存
2. Markdown を追加
3. Markdown を削除

確認項目:

- 手動リロードなしで本文/ツリーに反映
- 再生成成功時のみ更新通知
- 失敗時は最後の正常表示を維持

## 3. API 境界の責務分離を確認

確認観点:

- ルート処理、入力検証、エラー変換、application 呼び出しが分離されている
- 文書一覧/取得 API の契約が保持されている
- `identifier` は `rootDir` 正規化相対パスで一貫している

## 4. `build` とオフライン閲覧を確認

```bash
node dist/cli/index.js build
```

確認項目:

- `.doc-repo` に静的成果物が生成される
- 既存と同じ利用方法でオフライン閲覧できる
- 主要な出力契約が維持されている

## 5. 回帰テスト固定の準備

移行前後で同期待結果を比較するため、以下を回帰対象として固定する。

- `doc-repo serve` 起動
- 左ツリー表示
- 文書選択と本文表示
- 相対画像・静的アセット表示
- Markdown 変更
- ファイル追加・削除
- ブラウザ自動更新
- `doc-repo build`
- 生成物のオフライン閲覧
