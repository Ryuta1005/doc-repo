# Contract: Viewer Sidebar Delete UX（Story 023）

## Scope

サイドバー上での文書/フォルダ削除 UX 契約を定義する。

## Hover Action Visibility

- ファイル行またはフォルダ行をホバーしている間のみ、行右側に `Ellipsis` ミートボールメニューを表示する
- 同時に複数の destructive entry を露出しない
- ホバー解除時はメニュー trigger を非表示に戻す

## Menu Contract

- ミートボールメニューを開くと、ゴミ箱アイコン付き `削除` 項目を表示する
- file 行、folder 行のどちらにも削除項目を表示する
- メニュー項目の選択は対象行の選択状態と独立して扱える

## Delete Confirmation Contract

- `削除` 項目選択後、確認ダイアログを表示する
- ダイアログは対象ファイル名または対象フォルダ名を識別できる
- ダイアログは h4 相当の見出しとして `削除しますか？` を表示する
- ダイアログ本文に `Git Commitなどをしていない場合、元に戻せません。` を表示する
- ダイアログ本文に `本当に削除しますか？` を重複表示しない
- `キャンセル` は既存の未保存変更ダイアログと同じデザインを使う
- `削除` は赤背景白文字の destructive button とする

## File Delete UX Contract

- file target の `削除` 確定で対象 Markdown を削除する
- 成功後、文書ツリーを更新する
- 削除対象が現在表示中だった場合、存在しない文書へ留まらず残存文書または空状態へ遷移する

## Folder Delete UX Contract

- folder target の `削除` 確定で、配下に managed markdown のみが存在する場合に限り、そのフォルダ自身と配下 Markdown を削除する
- folder 配下に unmanaged entry が 1 件でもある場合、削除は拒否する
- reject 時は「一部だけ消えた」状態を作ってはならない

## Failure UX Contract

- 削除失敗時は理由を表示する
- 失敗理由は再試行または状態確認の判断に使える内容とする
- folder reject 時は「配下に削除対象外が含まれる」ことが利用者に分かる

## Unsaved Changes Guard

- 未保存変更がある場合、削除確認より前に既存の確認フローを適用する
- 利用者の選択に応じて delete flow 継続または中止を行う

## Explicit Out of Scope

- ゴミ箱機能
- 復元導線
- 一括削除
- 競合検知や排他制御

## Verification Checklist

- ホバー時のみミートボールメニューが見える
- メニュー内に `Trash2 + 削除` が出る
- file delete 成功後にツリー更新と fallback selection が行われる
- folder delete 成功時にフォルダ自身も消える
- unmanaged entry を含む folder は全体 reject される
- `キャンセル` は既存未保存変更ダイアログと同じ視覚系を使う
- 未保存変更ありで既存 guard が先に機能する
