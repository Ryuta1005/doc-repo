# Research: リッチテキスト編集と Markdown 保存（Story 010）

## Decision 1: MVP の編集 UI は Tiptap（ProseMirror 系）を採用する

- Decision: React 上のリッチテキスト編集基盤として Tiptap を採用する。
- Rationale: 判定条件（見出し/太字/イタリックのショートカット、Markdown 初期化、Markdown シリアライズ、未対応原文保持、1MB 文書性能、React 組み込み、ライセンス整合）に対して最も拡張しやすい。
- Alternatives considered:
  - 独自 contenteditable 実装: 初期実装は可能だが入力制御と整合性維持のコストが高い。
  - 他のエディタ基盤: 要件充足は可能だが、React 連携と拡張性の比較で優位性が薄い。

## Decision 2: 変換層は「対応要素 + 未対応原文ノード」の二層モデルを採用する

- Decision: `src/core/markdown` に parse/serialize パイプラインを置き、未対応要素を原文断片付きノードとして保持する。
- Rationale: エディタへ取り込む前に未対応原文を独立管理でき、保存時に対応部分だけ再シリアライズして未対応断片を合成できる。
- Alternatives considered:
  - エディタ内部状態のみを正とする: 未対応原文の消失リスクが高い。
  - 文書全体を常時原文優先で保存: 対応要素の編集反映が複雑化する。

## Decision 3: 未対応要素は原文パススルー優先で保持する

- Decision: エディタ未対応要素を含む場合、保存時は原文を可能な限り保持して出力し、保持不能の可能性は保存前警告で利用者へ明示する。
- Rationale: Markdown を正本とする方針に対して、無編集箇所の意味破壊を最小化できる。
- Alternatives considered:
  - 未対応要素を常に除去: 情報欠損リスクが高く採用不可。
  - 未対応要素を常に保存禁止: 安全だが MVP の編集継続性を損なう。

## Decision 4: 保存 API は 3 つの失敗分類を利用者に提示する

- Decision: 保存失敗は「保存対象の検証不正」「対象文書を保存不能（不存在/権限）」「一時的 I/O 失敗」に分類し、理由と再試行可否を返す。
- Rationale: 利用者の次アクションが分類ごとに明確に分かれ、受け入れテストで判定しやすい。
- Alternatives considered:
  - 単一エラー分類: 利用者の対処判断ができない。
  - 細かすぎる分類: Story 010 の範囲を超えて API 実装詳細を固定しすぎる。

## Decision 5: Story 010 では競合検知を行わず上書き保存する

- Decision: 保存時の更新時刻比較・内容ハッシュ比較は行わず、現在の編集内容で上書き保存する。競合警告や保存拒否は Story 011 へ委譲する。
- Rationale: Story 境界を守り、010 は編集保存最小体験の成立に集中できる。
- Alternatives considered:
  - 010 で競合検知まで実装: スコープ肥大化。
  - 常時保存拒否: 利用体験を著しく損なう。

## Decision 6: 保存後の表示更新は既存 serve 更新機構と整合させる

- Decision: 保存成功後は HTTP/API 経由の再取得または既存更新通知機構により、利用者が最新表示を即時確認できる状態にする。
- Rationale: Story 010 の成功条件は実装方式ではなく利用者が最新表示を確認できることにあるため。
- Alternatives considered:
  - 画面手動リロードを必須化: 体験品質が低下し要件未達。

## Decision 7: 保存処理は原子的書き込みを基本戦略とする

- Decision: `validateSaveTarget()` と `writeMarkdownDocumentAtomically()` を分離し、同一ディレクトリ一時ファイル書き込み後の rename 置換を基本とする。
- Rationale: 書き込み途中失敗時に元文書を壊さず維持できる。
- Alternatives considered:
  - 直接上書き書き込み: 部分書き込み失敗時の破損リスクがある。

## Decision 8: 改行コードと末尾改行は既存文書を継承する

- Decision: 保存時に既存文書の改行コード（LF/CRLF）と末尾改行有無を維持する。
- Rationale: 差分ノイズを抑え、Git 運用上の不要変更を最小化できる。
- Alternatives considered:
  - 常に LF/末尾改行ありへ正規化: 運用上の意図しない差分を増やす可能性がある。
