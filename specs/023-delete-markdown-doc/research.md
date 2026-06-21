# Research: Markdown文書/フォルダ削除（Story 023）

## Decision 1: 削除起点はサイドバー行ホバー時のミートボールメニューを正規経路とする

- Decision: ファイル行・フォルダ行をホバーしたときだけ `Ellipsis` を表示し、メニュー内の `Trash2 + 削除` を削除操作の正規入口とする。
- Rationale: 既存の hover `+` create 体験と並べて発見性を保ちつつ、破壊的操作を常時露出しないで済む。
- Alternatives considered:
  - 行内に常時削除ボタンを表示: 誤操作リスクが高く、既存 sidebar の情報密度も悪化する。
  - 右クリックメニューのみ: 発見性が低く、SC-001 を満たしにくい。

## Decision 2: HTTP 境界は create/save と同じ専用 route を追加する

- Decision: delete は `POST /api/document/delete` の専用 route とし、request validation と error mapping を presentation 層に閉じる。
- Rationale: create/save と同じ境界パターンを踏襲でき、viewer 側の API client も一貫した実装にできる。
- Alternatives considered:
  - `DELETE /api/document?path=...` の query ベース API: folder/file の target type や将来の preflight 拡張を表現しづらい。
  - save/create route へ delete を統合: 責務が混ざり契約が不明瞭になる。

## Decision 3: フォルダ削除は Policy B を採用する

- Decision: フォルダ削除は配下の管理対象 Markdown を再帰削除する。ただし配下に管理対象外ファイル、`.md` 以外、include 対象外、exclude 対象が 1 つでも含まれる場合はフォルダ全体を削除拒否する。
- Rationale: 利用者視点では「フォルダを消す」を成立させつつ、添付ファイルや管理対象外構成を巻き込む誤削除を防げる。
- Alternatives considered:
  - 空フォルダのみ削除: 利用価値が低く、Story 023 の期待を満たしにくい。
  - フォルダ配下を無差別再帰削除: Repository Structure Respect と Safe File Boundary の観点で危険。

## Decision 4: 削除前確認は専用ダイアログとし、キャンセルは既存未保存変更ダイアログの見た目に合わせる

- Decision: 削除前に専用 confirmation dialog を表示し、h4 相当の見出しに `削除しますか？`、本文に `Git Commitなどをしていない場合、元に戻せません。` を固定表示する。本文に `本当に削除しますか？` は重複表示しない。`キャンセル` は既存未保存変更ダイアログと同じ視覚系、`削除` は赤背景白文字の destructive button とする。
- Rationale: 破壊的操作の意味を明確にしつつ、キャンセル導線は既存 UI 言語と整合する。
- Alternatives considered:
  - browser native confirm: 文言・ボタン意図・見た目の統一ができない。
  - 既存未保存変更ダイアログの文面だけ差し替え: destructive intent を表現しきれない。

## Decision 5: 未保存変更ガードは delete entry 前に必ず評価する

- Decision: 削除メニューから確認ダイアログへ進む前に、既存の unsaved changes guard を評価する。
- Rationale: create/save/edit ですでに成立しているデータ損失防止フローを壊さない。
- Alternatives considered:
  - 削除だけガード免除: 既存 UX と不整合で、Story 010 の期待を崩す。
  - 削除確認後に未保存確認: ダイアログの優先度が逆転して操作が分かりにくい。

## Decision 6: 削除後の選択解決は既存の document list refresh と fallback selection を再利用する

- Decision: 削除成功後は文書一覧を再取得し、既存の selected identifier 解決ロジックを使って次の選択を決める。
- Rationale: 新しい選択アルゴリズムを増やさず、既存の create/save/watch 更新とも挙動を揃えられる。
- Alternatives considered:
  - 削除専用の fallback ルールを別実装: 分岐が増え、回帰点が増える。
  - UI ローカル state だけでツリー差分更新: server truth とのズレが出やすい。

## Resolved Clarifications

- 削除導線: サイドバー hover 時のミートボールメニュー
- メニュー項目: `Trash2 + 削除`
- 確認文言: `削除しますか？` / `Git Commitなどをしていない場合、元に戻せません。`
- フォルダ削除方針: Policy B（managed markdown only recursive delete, reject on unmanaged content）
- 非機能範囲: 排他制御、ゴミ箱、復元機能は対象外
