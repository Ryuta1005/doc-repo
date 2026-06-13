# 手動テストケース: Story 010 リッチテキスト編集と Markdown 保存

## 事前確認

1. 依存関係をインストールする。

```bash
npm install
```

2. ビルドする。

```bash
npm run build
```

3. サーバーを起動する。

```bash
node dist/cli/index.js serve
```

4. 起動ログに表示された URL をブラウザで開く。

5. 保存 API 検証で使う環境変数を設定する。

```bash
export BASE_URL="http://127.0.0.1:3000"
export VALID_MD="docs/guide/getting-started.md"
export EXCLUDE_MD="docs/excluded/example.md"
export OUTSIDE_INCLUDE_MD="docs/private/not-in-include.md"
```

6. `VALID_MD` は既存の保存対象 `.md` ファイルに置き換える。
7. `EXCLUDE_MD` は exclude 条件に該当する `.md` ファイルに置き換える。
8. `OUTSIDE_INCLUDE_MD` は rootDir 内かつ include 条件外の `.md` ファイルに置き換える。

注記:

- API 契約に合わせて `options.newlineStyle` / `options.hasTrailingNewline` を送信する。
- FR-017 の観点では、サーバーが既存文書形式を維持できることを TC-010-08 で必ず検証する。

## 環境情報

- 実施日:
- 実施者:
- OS:
- Node.js バージョン:
- ブラウザ:
- 起動 URL (BASE_URL):

## 合否基準

- 各ケースの期待結果を満たした場合に Pass とする。
- 期待結果を満たさない場合は Fail とする。
- 前提未整備で実行不能な場合は Blocked とする。

## ケース一覧

| ケースID  | タイトル                                                 | 対応FR                                         | 対応SC |
| --------- | -------------------------------------------------------- | ---------------------------------------------- | ------ |
| TC-010-01 | 編集開始から保存成功までの機能成立                       | FR-001, FR-002, FR-003, FR-006, FR-007, FR-008 | -      |
| TC-010-02 | Markdown 入力ルールの解釈と意味保持                      | FR-004, FR-005, FR-007                         | SC-002 |
| TC-010-03 | 未保存変更ガード（トリガー別）                           | FR-009, FR-010                                 | SC-003 |
| TC-010-04 | 復元非対応の明示と挙動確認                               | FR-011                                         | -      |
| TC-010-05 | 未対応要素警告と保存継続/キャンセル                      | FR-012, FR-020                                 | -      |
| TC-010-06 | 保存対象検証の拒否動作                                   | FR-013, FR-014, FR-015, FR-016                 | SC-004 |
| TC-010-07 | 保存失敗 3 分類の提示                                    | FR-018                                         | -      |
| TC-010-08 | 改行コードと末尾改行維持                                 | FR-017                                         | -      |
| TC-010-09 | 1MB 文書の操作時間測定                                   | FR-019                                         | SC-005 |
| TC-010-10 | 初見利用者の完遂率評価                                   | -                                              | SC-001 |
| TC-010-11 | 外部更新を検知しない上書き保存（Story 011 未実装時のみ） | FR-021                                         | -      |

---

## TC-010-01 編集開始から保存成功までの機能成立

対応FR: FR-001, FR-002, FR-003, FR-006, FR-007, FR-008

手順:

1. 閲覧画面で `VALID_MD` を開く。
2. 編集モードへ切り替える。
3. 本文を 1 箇所更新する。
4. 見出し 1 または見出し 2 を 1 箇所設定する。
5. 保存を実行する。
6. 閲覧画面へ戻り、表示内容を確認する。

期待結果:

- 編集画面に現行本文がロードされる。
- 保存成功メッセージが表示される。
- 閲覧画面で最新内容が確認できる。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-02 Markdown 入力ルールの解釈と意味保持

対応FR: FR-004, FR-005, FR-007
対応SC: SC-002

入力テキスト:

```text
# Heading 1
## Heading 2
### Heading 3
**Bold text**
*Italic text*
```

手順:

1. 編集モードで `VALID_MD` を開く。
2. 上記入力テキストを入力する。
3. 入力直後のエディタ表示を確認する。
4. 保存する。
5. 保存対象の Markdown ファイルを確認する。

```bash
cat "$VALID_MD"
```

期待結果:

- `# `, `## `, `### ` が見出し表示に変換される。
- 太字とイタリックが書式表示へ変換される。
- 解釈済み行で Markdown 記号が画面に生文字として残らない。
- 保存ファイルで見出し 1/2/3、太字、イタリックの意味が保持される。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-03 未保存変更ガード（トリガー別）

対応FR: FR-009, FR-010
対応SC: SC-003

手順:

1. 編集モードで未保存変更を作る。
2. 下表の各サブケースを順に実施する。

| サブケース | 操作                           | 確認内容                           |
| ---------- | ------------------------------ | ---------------------------------- |
| A          | 別ファイルを選択               | アプリ内確認ダイアログが表示される |
| B          | 編集終了を押す                 | アプリ内確認ダイアログが表示される |
| C          | ブラウザ再読込またはタブ閉じる | ブラウザ標準の離脱確認が表示される |

期待結果:

- サブケース A/B ではアプリ内確認 UI が表示される。
- サブケース C ではブラウザ標準確認 UI が表示される。
- A/B では継続編集と破棄を選択でき、破棄時は編集前内容へ戻る。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-04 復元非対応の明示と挙動確認

対応FR: FR-011

手順:

1. 編集モードで未保存変更を作る。
2. アプリ内で「未保存内容は再読込後に復元されない」旨の明示を確認する。
3. そのままブラウザ再読込を実行する。
4. 再表示後に編集内容が復元されないことを確認する。

期待結果:

- 復元非対応である旨が利用者に明示される。
- 再読込後に未保存内容は復元されない。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-05 未対応要素警告と保存継続/キャンセル

対応FR: FR-012, FR-020

事前準備:

1. 以下 3 種類の文書を用意する。
   - 文書 A: 保持可能と定義された未対応要素を含む。
   - 文書 B: 変化可能性ありと定義された未対応要素を含む。
   - 文書 C: 未対応要素を複数箇所・複数種類含む。
2. 文書種別の判定は Story 010 の `research.md` の分類に従う。

手順:

1. 文書 A/B/C をそれぞれ編集モードで開く。
2. 保存操作を行い、警告表示を確認する。
3. 1 回目は「キャンセル」を選び、保存されないことを確認する。
4. 2 回目は「保存継続」を選ぶ。
5. 保存後の Markdown ファイルを比較する。

期待結果:

- 保存前に未対応要素警告が表示される。
- キャンセル時は保存されない。
- 保存継続時は、保持可能と定義された要素の原文が維持される。
- 保持保証外要素は、警告内容と実際の保存結果が整合する。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-06 保存対象検証の拒否動作

対応FR: FR-013, FR-014, FR-015, FR-016
対応SC: SC-004

手順:

1. 以下の API リクエストを順に実行する。

```bash
curl -sS -X POST "$BASE_URL/api/document/save" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"../outside.md","markdownContent":"# invalid","options":{"newlineStyle":"lf","hasTrailingNewline":true}}'
```

```bash
curl -sS -X POST "$BASE_URL/api/document/save" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"/tmp/outside.md","markdownContent":"# invalid","options":{"newlineStyle":"lf","hasTrailingNewline":true}}'
```

```bash
curl -sS -X POST "$BASE_URL/api/document/save" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"docs/sample.txt","markdownContent":"# invalid","options":{"newlineStyle":"lf","hasTrailingNewline":true}}'
```

```bash
curl -sS -X POST "$BASE_URL/api/document/save" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"'"$EXCLUDE_MD"'","markdownContent":"# invalid","options":{"newlineStyle":"lf","hasTrailingNewline":true}}'
```

```bash
curl -sS -X POST "$BASE_URL/api/document/save" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"'"$OUTSIDE_INCLUDE_MD"'","markdownContent":"# invalid","options":{"newlineStyle":"lf","hasTrailingNewline":true}}'
```

2. レスポンスの `status` と `error.category` を確認する。
3. 該当ファイルが新規作成または上書きされていないことを確認する。

期待結果:

- いずれも保存拒否される。
- include 条件外と exclude 条件該当の両方が拒否される。
- 理由が提示される。
- 誤保存が 0 件である。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-07 保存失敗 3 分類の提示

対応FR: FR-018

手順:

1. `invalid-target` は TC-010-06 の結果を利用する。
2. `unwritable-target` は、既存ファイルの書き込み権限を一時的に外して再現する。

```bash
chmod 444 "$VALID_MD"
curl -sS -X POST "$BASE_URL/api/document/save" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"'"$VALID_MD"'","markdownContent":"# overwrite attempt","options":{"newlineStyle":"lf","hasTrailingNewline":true}}'
chmod 644 "$VALID_MD"
```

3. `transient-io` は次の優先順で再現する。
   - 優先A: 実装済みのテスト用失敗注入手段がある場合はそれを利用する。
   - 優先B: 上記がない場合は契約テスト結果で分類保証を確認し、手動では表示文言のみ確認する。

```bash
npm run test -- tests/contract/http-document-save.test.ts
```

4. 各分類で `error.category`, `error.message`, `error.retryable` を記録する。

期待結果:

- 3 分類が識別できる。
- 各分類で理由と再試行可否が提示される。
- `transient-io` の再現不能時は、契約テスト結果で分類保証を補完できる。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-08 改行コードと末尾改行維持

対応FR: FR-017

手順:

1. 次の 4 パターンの文書を用意する。

| 文書 | 改行形式 | 末尾改行 |
| ---- | -------- | -------- |
| A    | LF       | あり     |
| B    | LF       | なし     |
| C    | CRLF     | あり     |
| D    | CRLF     | なし     |

2. 各文書を編集して保存する。
3. 必要に応じて混在改行文書 E も作成し、保存後の扱いを記録する。
4. 次のスクリプトで行末情報を確認する。

```bash
python - <<'PY'
from pathlib import Path
import sys

target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('docs/target.md')
data = target.read_bytes()
crlf_count = data.count(b"\r\n")
lf_only_count = data.replace(b"\r\n", b"").count(b"\n")
print('path=', target)
print('crlf_count=', crlf_count)
print('lf_only_count=', lf_only_count)
print('ends_with_newline=', data.endswith((b"\n", b"\r\n")))
PY "$VALID_MD"
```

期待結果:

- A-D で保存後も改行形式と末尾改行有無が維持される。
- 混在改行文書 E は仕様どおりの扱いであることを記録できる。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-09 1MB 文書の操作時間測定

対応FR: FR-019
対応SC: SC-005

計測定義:

- 区間 A: 編集ボタン押下からエディタ描画完了まで。
- 区間 B: 保存ボタン押下から保存結果表示まで。
- 評価値: A + B（利用者の手入力時間は含めない）。
- 試行回数: 20 回。
- p95: 昇順ソート後の 19 番目（1-origin）を採用。

手順:

1. 約 1MB の検証文書を開く。
2. DevTools Performance API または同等手段で A と B を各試行で計測する。
3. `A + B` の 20 件を算出し、p95 を求める。

期待結果:

- `A + B` の p95 が 3 秒以内。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-10 初見利用者の完遂率評価

対応SC: SC-001

前提:

- テスト参加者数を 10 名以上とする。
- 参加者は対象 UI の初見利用者とする。
- 事前説明は「編集して保存してください」のみとし、操作手順説明はしない。

開始/終了定義:

- 開始: 参加者が編集モード切り替え操作を実行した時点。
- 終了: 保存成功メッセージ表示を確認した時点。

手順:

1. 各参加者に同一文書と同一環境を提供する。
2. 参加者ごとに開始時刻と終了時刻を記録する。
3. 5 分以内完了者数を集計する。

期待結果:

- 参加者の 90% 以上が 5 分以内に完遂する。

実測:

- 判定:
- 実行結果:
- 補足:

## TC-010-11 外部更新を検知しない上書き保存（Story 011 未実装時のみ）

対応FR: FR-021

注意:

- Story 011 未実装環境でのみ実施する。
- 回帰テスト恒久対象ではなく、Story 010 範囲確認の補助ケースとして扱う。
- 破壊的操作のため、対象文書をバックアップしてから実施する。

手順:

1. 対象文書をバックアップする。

```bash
cp "$VALID_MD" "$VALID_MD.bak"
```

2. 文書を編集モードで開く。
3. 別シェルで同一ファイルを外部更新する。
4. 先に開いていた編集画面から保存を実行する。
5. 保存後ファイル内容と UI 表示を確認する。
6. バックアップを戻す。

```bash
mv "$VALID_MD.bak" "$VALID_MD"
```

期待結果:

- 競合警告なしで保存が進む。
- 編集画面からの内容で上書き保存される。

実測:

- 判定:
- 実行結果:
- 補足:

## 総合判定

- 判定:
- 実行結果:
- 補足:
