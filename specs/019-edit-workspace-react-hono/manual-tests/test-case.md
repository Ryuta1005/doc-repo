# 手動テストケース・手順書（Story 019）

## 事前確認

- [x] `npm install` 実行済み
- [x] `npm run build` 実行済み
- [x] `node dist/cli/index.js --help` が実行できる
- [x] 既存の `serve` プロセスが停止している
- [x] 検証用 fixture（通常規模/大量規模/日本語または空白を含むファイル名）を準備済み

## テスト環境情報

- 実施日:
- 実施者:
- OS:
- Node.js:
- ブランチ: 019-edit-workspace-react-hono
- baseline commit:
- new implementation commit:

## Pass/Fail 判定基準

- Pass: 期待結果をすべて満たす
- Fail: 期待結果を1つ以上満たさない
- Blocked: 前提不足または環境制約で実施不能

## 共通準備

1. 検証用ディレクトリへ移動する。
2. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js serve --port 4500` を実行して待機する。
3. ブラウザで `http://localhost:4500` を開く。
4. ケース実施後は `Ctrl+C` で `serve` を停止する。

## ケース一覧

| ID      | 目的                                                        | 優先度 |
| ------- | ----------------------------------------------------------- | ------ |
| MT-1901 | `serve` 起動と初期表示を確認する                            | High   |
| MT-1902 | ツリー選択と本文切替を確認する                              | High   |
| MT-1903 | `GET /api/documents` 契約を確認する                         | High   |
| MT-1904 | `GET /api/document?path=...` 契約を確認する                 | High   |
| MT-1905 | 不正 `path` 入力の 400/404 を確認する                       | High   |
| MT-1906 | 相対画像と静的アセット配信を確認する                        | High   |
| MT-1907 | change/add/unlink と自動更新を確認する                      | High   |
| MT-1908 | 再生成失敗時の更新抑止を確認する                            | High   |
| MT-1909 | 404 発生後の継続利用性を確認する                            | Medium |
| MT-1910 | SSE 切断時の回復/通知を確認する                             | Medium |
| MT-1911 | 静的生成とオフライン閲覧を確認する                          | High   |
| MT-1912 | 性能測定記録の必須項目を監査する                            | High   |
| MT-1913 | 日本語/空白を含む `path` の取得成功を確認する               | High   |
| MT-1914 | `serve` の single port 配信を確認する                       | High   |
| MT-1915 | Markdown URL の直打ち/リロードを確認する                    | High   |
| MT-1916 | ディレクトリ URL/リンクで500にならないことを確認する        | High   |
| MT-1917 | `.html` URL と `.md` URL の閲覧互換を確認する               | Medium |
| MT-1918 | 旧静的アセット混入と `.doc-repo` 上書きがないことを確認する | Medium |

---

## MT-1901 serve 起動と初期表示を確認する

目的:

- `node dist/cli/index.js serve` 起動後に React UI の左ツリー/右本文エリアが表示されることを確認する。

手順:

1. 共通準備を実施する。
2. ターミナルで `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js serve --port 4500` を実行する。
3. ブラウザで `http://localhost:4500` を表示する。
4. 左ツリーと本文エリアが表示されることを確認する。
5. 別ターミナルで `curl -sS http://localhost:4500/app.js | grep viewer-layout` を実行する。
6. 別ターミナルで `curl -sS http://localhost:4500/styles.css | grep viewer-layout` を実行する。
7. ブラウザ開発者ツールの Network で、初期表示時に `/api/documents` が同じ origin で呼ばれていることを確認する。

期待結果:

- サーバー起動に成功する。
- 左ツリーと本文エリアが表示される。
- UI がエラー表示で停止していない。
- `/app.js` と `/styles.css` が同じ port から配信され、React Viewer 用の `viewer-layout` を含む。
- 初期表示が文書一覧 API 経由で構築されている。

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-1902 ツリー選択と本文切替を確認する

目的:

- ツリー上で文書を切り替えた際、本文が対象文書へ更新されることを確認する。

手順:

1. MT-1901 の起動状態を利用する。
2. ツリー内の文書 A をクリックする。
3. 文書 A の本文が表示されることを確認する。
4. ツリー内の文書 B をクリックする。
5. 本文が文書 B の内容に更新されることを確認する。

期待結果:

- クリックした文書に対応する本文が表示される。
- 前の文書内容が残留しない。

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-1903 GET /api/documents 契約を確認する

目的:

- 文書一覧 API が JSON で文書メタデータを返し、`identifier` が `rootDir` 正規化相対パスになっていることを確認する。

手順:

1. MT-1901 の起動状態を利用する。
2. 別ターミナルで `curl -s http://localhost:4500/api/documents` を実行する。
3. 返却 JSON の各要素に `identifier`, `title` が含まれることを確認する。
4. `identifier` に絶対パスが含まれていないことを確認する。

期待結果:

- HTTP ステータスが `200`。
- JSON 配列が返る。
- `identifier` は `rootDir` 相対形式である。

実測:

- HTTPステータス:
- 実行結果:Pass
- 判定:
- 補足:

## MT-1904 GET /api/document?path=... 契約を確認する

目的:

- 文書取得 API が対象文書の HTML とメタデータを返すことを確認する。

手順:

1. MT-1903 で得た `identifier` を 1 件選ぶ。
2. `node -e "console.log(encodeURIComponent(process.argv[1]))" '<identifier>'` で URL エンコード値を作る。
3. `curl -s "http://localhost:4500/api/document?path=<encoded-value>"` を実行する。
4. 返却 JSON に `identifier`, `title`, `html`, `metadata` があることを確認する。

期待結果:

- HTTP ステータスが `200`。
- `html` にレンダリング済み HTML 文字列が含まれる。
- `identifier` が要求した文書を指す。

実測:

- HTTPステータス:
- 実行結果:
- 判定:
- 補足:

## MT-1905 不正 path 入力の 400/404 を確認する

目的:

- 入力不正と文書未検出でエラー契約が守られることを確認する。

手順:

1. 空 `path` を試す: `curl -i "http://localhost:4500/api/document?path="` を実行する。
2. `..` を含む `path` を試す: `curl -i "http://localhost:4500/api/document?path=..%2FREADME.md"` を実行する。
3. 存在しない文書を試す: `curl -i "http://localhost:4500/api/document?path=not-found.md"` を実行する。
4. 各レスポンスの `error.code` を確認する。

期待結果:

- 不正入力は `400` かつ `error.code=INVALID_REQUEST`。
- 未存在文書は `404` かつ `error.code=DOCUMENT_NOT_FOUND`。
- エラー時もサーバーが継続動作する。

実測:

- HTTPステータス(空path):
- HTTPステータス(`..`):
- HTTPステータス(未存在):
- 実行結果:
- 判定:Pass
- 補足:

## MT-1906 相対画像と静的アセット配信を確認する

目的:

- Markdown の相対画像とテンプレート資産が配信されることを確認する。

手順:

1. 画像参照を含む文書をブラウザ表示する。
2. 画像が表示されることを確認する。
3. 別ターミナルで `curl -i http://localhost:4500/styles.css` を実行する。
4. 別ターミナルで `curl -i http://localhost:4500/app.js` を実行する。
5. 必要に応じて画像 URL に対して `curl -i` を実行する。

期待結果:

- 文書内の相対画像が表示される。
- `styles.css` と `app.js` が `200` で取得できる。
- 画像取得リクエストが成功する。

実測:

- styles.css HTTPステータス:
- app.js HTTPステータス:
- 画像HTTPステータス:
- 判定:Pass  
  `curl -i http://localhost:4500/app.js`
- 補足:

## MT-1907 change/add/unlink と自動更新を確認する

目的:

- Markdown の変更・追加・削除後、手動リロードなしで本文/ツリーに反映されることを確認する。

手順:

1. 表示中の Markdown を編集して保存する。
2. ブラウザ本文が自動更新されることを確認する。
3. 新規 Markdown を追加する。
4. ツリーへ新規文書が自動追加されることを確認する。
5. 既存 Markdown を削除する。
6. ツリーから対象が自動的に消えることを確認する。

期待結果:

- change/add/unlink の各操作後に自動更新が成立する。
- 手動リロードは不要。

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-1908 再生成失敗時の更新抑止を確認する

目的:

- 再生成失敗時に不要な `reload` が発生せず、最後の正常表示が維持されることを確認する。

手順:

1. 表示中の正常な状態を記録する。
2. 検証用ディレクトリ直下で `chmod a-w .` を実行し、生成用 staging ディレクトリを作れない状態にする。
3. 既存 Markdown ファイルに追記保存し、watch の change を発生させる。
4. サーバーログに再生成失敗が出ることを確認する。
5. ブラウザ表示が直前の正常状態のまま維持されることを確認する。
6. 検証用ディレクトリ直下で `chmod u+w .` を実行して権限を復旧する。
7. 同じ Markdown ファイルへ再度追記保存する。
8. 再生成成功後に自動更新が復帰することを確認する。

期待結果:

- 失敗時に画面が壊れない。
- 再生成失敗時に不要な `reload` が発生しない。
- 修正後の再生成成功で自動更新が再開する。
- ケース終了時に検証用ディレクトリの書き込み権限が復旧している。

実測:

- 実行結果:
- 判定:
- 補足:

## MT-1909 404 発生後の継続利用性を確認する

目的:

- 404 エラー後でも別文書選択で継続利用できることを確認する。

手順:

1. 存在しない文書パスへアクセスし 404 を発生させる。
2. UI のエラーメッセージ表示を確認する。
3. ツリーから別文書を選択する。
4. 本文が正常表示へ戻ることを確認する。

期待結果:

- 404 が利用者に識別可能な形で表示される。
- 別文書選択で操作継続できる。

実測:

- 実行結果:
- 判定:
- 補足:

## MT-1910 SSE 切断時の回復/通知を確認する

目的:

- SSE 切断時に再接続または明確な通知が行われることを確認する。

手順:

1. `serve` 実行中にネットワーク offline モードまたはサーバー停止で SSE を切断する。
2. UI 上の挙動（再接続試行または通知）を確認する。
3. ネットワーク復帰またはサーバー再起動を行う。
4. 変更検知が再び機能するか確認する。

期待結果:

- 切断状態が無言で放置されない。
- 復帰後に監視更新が再開する。

実測:

- 実行結果:
- 判定:Pass
- 補足:

## MT-1911 静的生成とオフライン閲覧を確認する

目的:

- `doc-repo [scopePath]` の生成物がオフライン閲覧でき、主要契約が維持されることを確認する。

手順:

1. `serve` を停止する。
2. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js` を実行する。
3. `.doc-repo` が生成されることを確認する。
4. `.doc-repo` 配下の HTML をブラウザで `file://` で開く。
5. 文書表示、リンク遷移、画像表示を確認する。

期待結果:

- 生成が成功する。
- オフライン閲覧で主要導線が成立する。

実測:

- 終了コード:
- 実行結果:
- 判定:Pass
- 補足:

## MT-1912 性能測定記録の必須項目を監査する

目的:

- SC-002/SC-003/SC-005 の測定記録が必須項目を満たすことを確認する。

手順:

1. `specs/019-edit-workspace-react-hono/tasks.md` の T046-T050 が完了していることを確認する。
2. `specs/019-edit-workspace-react-hono/checklists/performance-measurement.md` が存在することを確認する。
3. `specs/019-edit-workspace-react-hono/checklists/performance-results.md` が存在することを確認する。
4. 各測定対象でウォームアップ1回 + 本計測5回 + 中央値 + 差分 + 判定があることを確認する。
5. 20%以上悪化項目がある場合、`user impact`, `reason not fixed in 019`, `approval` が記録されていることを確認する。

期待結果:

- T046-T050 が完了している。
- 測定手順ファイルと測定結果ファイルが存在する。
- 必須項目が欠落していない。
- 20% 判定ルールの運用記録が追跡可能である。

Blocked 判定:

- T046-T050 が未完了、または測定手順/測定結果ファイルが未作成の場合は Blocked とし、未完了タスクを補足へ記録する。

実測:

- 実行結果:
- 判定:Pass  
  `   $ npm run build:viewer`  
  `vite v8.0.16 building client environment for production... transforming...✓ 22 modules transformed. rendering chunks... computing gzip size... dist/viewer/assets/main-BkXkqFxR.css 2.75 kB │ gzip: 1.05 kB dist/viewer/app.js 196.23 kB │ gzip: 62.35 kB │ map: 864.05 kB ✓ built in 90ms`  
  Success
- 補足:

## MT-1913 日本語/空白を含む path の取得成功を確認する

目的:

- query parameter 方式で、日本語または空白を含む `rootDir` 相対パスを安全に取得できることを確認する。

手順:

1. 検証用 fixture に `日本語 ファイル.md` または `docs/空白 あり.md` のような Markdown ファイルを用意する。
2. MT-1901 の起動状態を利用する。
3. `curl -s http://localhost:4500/api/documents` を実行し、対象ファイルの `identifier` が一覧に含まれることを確認する。
4. `node -e "console.log(encodeURIComponent(process.argv[1]))" '<identifier>'` で URL エンコード値を作る。
5. `curl -i "http://localhost:4500/api/document?path=<encoded-value>"` を実行する。
6. 返却 JSON の `identifier` が要求した文書を指すことを確認する。

期待結果:

- HTTP ステータスが `200`。
- 日本語または空白を含む `path` が欠損・文字化けせず取得できる。
- `html` に対象文書のレンダリング済み HTML 文字列が含まれる。

実測:

- HTTPステータス:
- identifier:
- encoded path:
- 実行結果:Pass
- 判定:Pass
- 補足:

## MT-1914 serve の single port 配信を確認する

目的:

- React UI、HTTP API、SSE、静的アセットが Front/Back 別 port ではなく、`serve` の同一 port / 同一 origin で配信されることを確認する。

手順:

1. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js serve --port 4500` を起動する。
2. ブラウザで `http://localhost:4500` を開く。
3. 別ターミナルで `curl -i http://localhost:4500/app.js` を実行する。
4. 別ターミナルで `curl -i http://localhost:4500/styles.css` を実行する。
5. 別ターミナルで `curl -i http://localhost:4500/api/documents` を実行する。
6. ブラウザ開発者ツールの Network で `/events` が `http://localhost:4500/events` に接続していることを確認する。

期待結果:

- `/app.js`, `/styles.css`, `/api/documents`, `/events` がすべて同じ port で処理される。
- 別の React/Vite dev server port を必要としない。
- `app.js` と `styles.css` は React Viewer 用の内容を返す。

実測:

- app.js HTTPステータス:
- styles.css HTTPステータス:
- api/documents HTTPステータス:
- events 接続状態:
- 判定:Pass
- 補足:

## MT-1915 Markdown URL の直打ち/リロードを確認する

目的:

- React Viewer の文書 URL を直接開いた場合やブラウザリロード時に、404/500にならず対象文書を表示できることを確認する。

手順:

1. MT-1901 の起動状態を利用する。
2. 文書一覧から `docs/config.ja.md` のような既存 Markdown の `identifier` を1つ選ぶ。
3. ブラウザで `http://localhost:4500/<identifier>` を直接開く。
4. 表示後にブラウザのリロードを実行する。
5. 別ターミナルで `curl -i http://localhost:4500/<identifier>` を実行する。

期待結果:

- URL直打ちで `200` のHTMLが返る。
- リロード後もReact Viewerが起動し、対象文書が表示される。
- サーバーログに `Internal Server Error` や `EISDIR` が出ない。
- 対象文書のAPI取得も同じ port で成功する。

実測:

- identifier:
- URL直打ちHTTPステータス:
- リロード後の表示:
- サーバーログ:
- 判定:Pass
- 補足:

## MT-1916 ディレクトリ URL/リンクで500にならないことを確認する

目的:

- Markdown本文内またはBacklog表内のディレクトリリンクをクリックしても、ディレクトリを `readFile` して500にならないことを確認する。

手順:

1. MT-1901 の起動状態を利用する。
2. ディレクトリへのリンクを含む文書を開く。

- 例: `project/planning/backlog/index.md`

1. `./001_リポジトリMarkdownをブラウザで閲覧可能にする/` のようなディレクトリリンクをクリックする。
2. 別ターミナルで同じディレクトリURLへ `curl -i` を実行する。
3. `index.html` が存在しないディレクトリURLにも `curl -i` を実行する。

期待結果:

- `index.html` が存在するディレクトリURLは `200` でHTMLを返す。
- `index.html` が存在しないディレクトリURLは `404` で返る。
- どちらの場合も `500` にならない。
- サーバーログに `EISDIR` が出ない。

実測:

- indexありディレクトリHTTPステータス:
- indexなしディレクトリHTTPステータス:
- サーバーログ:
- 判定:Pass
- 補足:

## MT-1917 `.html` URL と `.md` URL の閲覧互換を確認する

目的:

- 既存静的出力由来の `.html` URL と、React Viewer の `.md` URL のどちらでも閲覧が成立することを確認する。

手順:

1. MT-1901 の起動状態を利用する。
2. 既存文書を1つ選び、対応する `.md` URL を開く。

- 例: `http://localhost:4500/docs/config.ja.md`

1. 同じ文書の `.html` URL を開く。

- 例: `http://localhost:4500/docs/config.ja.html`

1. それぞれでブラウザリロードを実行する。
2. ブラウザの戻る/進むで表示が破綻しないことを確認する。

期待結果:

- `.md` URL と `.html` URL の両方で `200` のHTMLが返る。
- どちらの入口でもReact Viewerが起動する。
- 対象文書の本文が表示され、リロード後も表示が維持される。
- 戻る/進むでUIがクラッシュしない。

実測:

- `.md` URL HTTPステータス:
- `.html` URL HTTPステータス:
- リロード結果:
- 戻る/進む結果:
- 判定:Pass
- 補足:

## MT-1918 旧静的アセット混入と `.doc-repo` 上書きがないことを確認する

目的:

- `serve` がReact Viewerを配信しつつ、`.doc-repo` の静的生成物を破壊的に上書きしないことを確認する。

手順:

1. `serve` 起動前の `.doc-repo/app.js` と `.doc-repo/styles.css` の先頭数行またはハッシュを記録する。
2. `node /Users/ryuta/Source/OSS/my_oss/doc-repo/dist/cli/index.js serve --port 4500` を起動する。
3. `curl -sS http://localhost:4500/app.js | grep viewer-layout` を実行する。
4. `curl -sS http://localhost:4500/styles.css | grep viewer-layout` を実行する。
5. `serve` 起動後の `.doc-repo/app.js` と `.doc-repo/styles.css` の先頭数行またはハッシュを再確認する。

期待結果:

- HTTP配信される `/app.js` と `/styles.css` はReact Viewer用である。
- `.doc-repo/app.js` と `.doc-repo/styles.css` は `serve` 起動によってReact成果物へ上書きされない。
- 静的生成物の互換確認とReact serve確認を取り違えない。

実測:

- HTTP app.js確認結果:
- HTTP styles.css確認結果:
- `.doc-repo/app.js` 差分:
- `.doc-repo/styles.css` 差分:
- 判定:
- 補足:

---

## 結果記録フィールド

- ケースID:
- 実施日時:
- 実施者:
- コマンド:
- 標準出力要点:
- 標準エラー要点:
- HTTPステータス:
- 終了コード:
- 判定:
- 補足:

---

## 総合判定

- 実行ケース数: 18
- Pass:
- Fail:
- Blocked:
- 総合判定:
- 次アクション:
