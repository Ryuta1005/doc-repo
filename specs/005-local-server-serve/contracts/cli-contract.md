# CLI Contract: `doc-repo serve`

## Scope

この契約は Story 005 の範囲で `doc-repo serve` の入出力と終了条件を定義する。

## Command

```bash
doc-repo serve [options]
```

## Options

- `--port <number>`: 待受ポートを指定する。
- `--help`: ヘルプを表示する。

## Usage Examples

```bash
doc-repo serve
```

```bash
doc-repo serve --port 4500
```

## Configuration Resolution

`port` の解決優先順位:

1. CLI オプション (`--port`)
2. `doc-repo.config.json` の `port`
3. デフォルト値 `4000`

## Behavioral Contract

1. コマンド開始時に初回生成を実行する。
2. 初回生成成功後に HTTP サーバーを起動する。
3. サーバー起動後に監視開始処理へ進む。
4. HTTP サーバーは生成処理を実行せず、生成済みファイルを配信する。
5. 初回生成失敗時はサーバーを起動しない。

## Standard Output (Success)

- 起動 URL を表示する。
- 監視開始状態を判別できるメッセージを表示する。

出力例:

```text
[doc-repo] generate: success
[doc-repo] serve: listening on http://localhost:4000
[doc-repo] watch: started
```

## Standard Error (Failure)

以下の失敗時は理由が分かるメッセージを標準エラーへ出力する。

- 初回生成失敗
- ポート競合
- `port` の入力不正（型不正、範囲外）

出力例:

```text
[doc-repo] error: INITIAL_GENERATE_FAILED: <reason>
```

```text
[doc-repo] error: PORT_CONFLICT: port 4000 は既に使用されています。
```

## Exit Codes

- `0`: 正常終了
- `1`: 異常終了（初回生成失敗、入力不正、起動失敗）

## Non-Goals in This Contract

- 監視の詳細条件（監視対象、再生成トリガー、ホットリロード方式）の確定
- 外部公開向けサーバー運用要件（TLS、認証、アクセス制御）
