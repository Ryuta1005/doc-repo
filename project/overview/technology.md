# 技術方針

## 技術選定の考え方

doc-repo は、Git と Markdown を正本にしながら、ブラウザ上で閲覧・編集できるドキュメントワークスペースを提供する。

020 以降の正規入口は `doc-repo serve` に統一する。過去の静的 HTML 生成入口、テンプレート UI、生成専用 pipeline は廃止済みであり、今後の設計では互換維持対象として扱わない。

## 現行構成

- 言語: TypeScript
- パッケージ形態: npm パッケージ
- 正規入口: `doc-repo serve`
- HTTP 境界: Hono
- Viewer UI: React
- 変更監視: Chokidar
- テスト方針: Vitest による単体テストと、CLI / HTTP 境界の integration test

## アーキテクチャ方針

中心に置くべきは React でも Hono でもなく、Markdown とリポジトリファイルを扱う application/core 層である。

```text
client   ─┐
server   ─┼→ application/core
commands ─┘

application/core → React や Hono を知らない
```

Hono は HTTP リクエスト・レスポンス境界を担当し、ファイル探索、Markdown 変換、設定解決、保存時の検証などの処理は application/core 層から呼び出す。

React は Viewer / Editor UI を担当し、core に依存されない。UI 状態、選択中文書、保存状態、エラー表示などは React 側に閉じる。

## 層の責務

### CLI 層

- `doc-repo init` と `doc-repo serve` の入口を提供する
- CLI 引数と設定ファイルを解決する
- Hono ワークスペースの起動結果を利用者向けに表示する

### Serve 層

- HTTP server の起動を統括する
- Markdown 変更監視を開始する
- 変更通知を SSE でブラウザへ送る
- 終了シグナル時に watcher、SSE、HTTP server を順に停止する

### HTTP 層

- React Viewer の配信
- 静的アセットの配信
- 文書一覧 API
- 文書取得 API
- SSE
- 将来の保存 API

HTTP 層は入力検証とレスポンス変換に集中し、実際のファイル操作やビジネスルールを直接抱え込まない。

### Application / Core 層

- Markdown ファイルの探索
- include / exclude の適用
- rootDir 解決
- Markdown 変換
- 文書 ID / パスの正規化
- 保存 API で必要になる安全なファイル操作

この層はフレームワーク非依存に保つ。

### Viewer 層

- 文書ツリー表示
- 文書本文表示
- API client
- SSE client
- 将来の編集 UI

## 配信契約

Hono が React UI、HTTP API、SSE、静的アセットを同一 port / 同一 origin で配信する。

`port` は Front / Back に分けない。CLI の `--port` と設定ファイルの `port` は、ワークスペース全体の単一入口を指す。

## Markdown とリンクの扱い

Markdown 変換は、Viewer が扱いやすい HTML と参照メタデータを返す。文書間リンクは既知の文書 ID に照合し、Viewer 内で遷移できるリンクへ正規化する。

画像や添付などのリポジトリ資産は、Hono の配信境界で扱う。静的生成物へコピーする前提は置かない。

## テスト方針

- 純粋ロジックは実装ファイルと同じ階層の `*.test.ts` で検証する
- CLI は利用者と同じ入口から終了コードとメッセージを検証する
- HTTP API は実リクエスト / レスポンスで status code、headers、payload を検証する
- error mapper 単体だけで契約充足とせず、Hono adapter 経由の挙動も確認する
- 静的生成専用テストは 020 で削除対象とし、今後の回帰は serve / API / Viewer 契約として維持する

## パッケージ追加方針

### 現在採用

| 技術    | 用途 |
| ------- | ---- |
| Hono    | HTTP server、API、SSE、静的アセット配信 |
| React   | Viewer / Editor UI |
| Chokidar | Markdown 変更監視 |
| Vitest  | 単体テストと integration test |

### Phase 3 で検証するもの

| 技術 | 用途 |
| ---- | ---- |
| WYSIWYG エディタ | Markdown とリッチテキスト編集の往復 |
| Tiptap / ProseMirror 系 | Markdown ショートカット、ツールバー、保存データ生成 |

Phase 3 の Spike では、本文、見出し1〜3、太字、イタリック、保存に絞って、既存 Markdown を読み込み、無編集保存で意味が壊れないことを重視する。

## 現時点の推奨結論

- 正規入口は `doc-repo serve`
- 静的生成入口と templates は復活させない
- Hono は HTTP 境界に集中させる
- React は UI に集中させる
- application/core はフレームワーク非依存に保つ
- 010 以降の編集・保存は `serve` ベースの同一 origin ワークスペース前提で設計する
