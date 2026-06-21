# Research: 新規 Markdown 文書作成（Story 022）

## Decision 1: 作成起点はサイドバーのホバー `+` のみを正規経路とする

- Decision: 新規作成開始は、サイドバーのファイル/フォルダ行をホバーしたときに表示される `+` ボタンを正規経路とする。
- Rationale: 作成先をクリック元ノード文脈に固定でき、利用者の「どこに作られるか」の認知負荷を下げられる。
- Alternatives considered:
  - グローバル「新規作成」ボタン: 作成先を追加入力する必要があり誤作成が増える。
  - 右クリックメニューのみ: 発見性が下がり、SC-001 を満たしにくい。

## Decision 2: 作成先解決は CreationAnchorContext で統一する

- Decision: クリック元ノードから `CreationAnchorContext` を生成し、folder は直下、file は親フォルダ直下へ解決する。
- Rationale: 仕様で合意した「直下」の意味を一貫して実装できる。
- Alternatives considered:
  - file 直下の擬似階層を導入: ファイルシステム実体と乖離して運用が複雑。
  - 任意入力パス優先: 022 では誤操作リスクが高くスコープ外。

## Decision 3: 入力はファイル名本文のみとし、保存用 `.md` を常に付与する

- Decision: 新規作成画面はファイル名本文のみ受け付ける。入力値にドットや `.md` が含まれていても本文として扱い、保存時に末尾へ常に `.md` を付与する。
- Rationale: ファイル名入力を拡張子解釈から切り離し、`doc.ja` や `a.md` のようなドット付き名称を一貫して扱える。
- Alternatives considered:
  - 相対サブパス許可: バリデーションと UX が複雑化。
  - `.md` 入力時だけ二重付与しない: 入力値の一部を特別扱いするため、`doc.ja.md` のような名称との整合が崩れる。

## Decision 4: 内部ファイル名と表示名を分離する

- Decision: 内部は `.md` 付きファイル名で保存し、サイドバーは拡張子なし表示へ統一する。
- Rationale: ファイルシステム一貫性と UI 可読性を両立できる。
- Alternatives considered:
  - 表示も `.md` 付き: 既存表示規約と不一致。
  - 内部も拡張子なし: Markdown 判定やツール連携で不整合が起きる。

## Decision 5: 失敗分類は既存保存系の方針に合わせる

- Decision: create 失敗は「入力/検証不正」「作成不能（権限/不存在）」「一時的 I/O」の分類で返す。
- Rationale: 利用者の再試行判断を明確にでき、既存エラー表示方針との統一が取れる。
- Alternatives considered:
  - 単一エラーメッセージ: 対処行動が不明確。
  - 詳細すぎる低レベル分類: Story 022 の範囲を超える。

## Decision 6: 未保存変更ガードを create フロー開始前に必ず評価する

- Decision: `+` クリック後、実際の作成画面遷移・確定前に既存の未保存変更確認を通す。
- Rationale: 既存編集体験を壊さずデータ損失リスクを増やさない。
- Alternatives considered:
  - create フローでガード無効化: 既存仕様違反。
  - create 完了後に確認: 文脈が逆転し UX が不自然。

## Resolved Clarifications

- 初期本文: 空本文
- 入力形式: ファイル名のみ（`/` `\\` 不可）
- 表示規約: 内部 `.md` 保持、サイドバー表示は最後の `.md` を外す
