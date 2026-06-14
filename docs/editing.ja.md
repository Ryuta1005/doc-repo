# Editing and Keyboard Shortcuts

doc-repo は Markdown ドキュメントをブラウザで編集し、変更を元の `.md` ファイルへ保存できます。

> [!CAUTION]
> ブラウザでの編集内容は、元の Markdown ファイルへ直接書き込まれます。
> 特にリッチテキスト編集が alpha の間は、編集前に変更をコミットするかバックアップしてください。

## Enter Edit Mode

1. Viewer で Markdown ドキュメントを選択します。
2. **Edit** をクリックします。
3. ドキュメントがリッチテキストエディタで開きます。

エディタは一般的な Markdown 構造向けです。完全な Markdown ラウンドトリップエディタではありません。

## Supported Editing Formatting

リッチテキストエディタは現在、次の書式に対応しています。

- 本文
- 見出し 1-6
- 太字
- イタリック
- 取り消し線
- インラインコード
- 引用
- 箇条書き
- 番号付きリスト
- コードブロック
- 水平線
- 対応画像アップロードによる画像挿入
- Viewer で使う info panel / admonition

Viewer のレンダリングは、エディタが安全に編集・保持できる Markdown より多くを表示できる場合があります。

## Save Behavior

**Save** をクリックすると、doc-repo は次を行います。

1. 編集済みドキュメントを Markdown へシリアライズします。
2. 対象が `rootDir` 配下の `.md` ファイルであることを検証します。
3. `include` と `exclude` ルールを確認します。
4. `rootDir` の外へ解決されるパスを拒否します。
5. 結果を元の Markdown ファイルへ書き戻します。

保存パスは Viewer で選択中の既存 Markdown ドキュメントです。

## Unsupported Markdown Warnings

未対応 Markdown セグメントが検出された場合、doc-repo は保存を続行する前に警告を表示します。

この警告は、可能な範囲で原文保持を試みるものの、リッチテキストエディタで安全に表現できない内容は変化する可能性があることを意味します。

## Save Error Categories

保存失敗は次のように分類されます。

| Category             | Retryable | 意味                                                               |
| -------------------- | --------- | ------------------------------------------------------------------ |
| `invalid-target`     | No        | 対象パスが許可された保存対象ルールの外にある                       |
| `unwritable-target`  | No        | ファイルが存在しない、または環境を修正するまで書き込めない         |
| `transient-io`       | Yes       | 一時的な I/O 失敗の可能性がある                                    |

## Unsaved Change Protection

doc-repo は次の場合に未保存の編集を保護します。

- 別のドキュメントへ切り替える。
- 編集モードを終了する。
- ブラウザタブを閉じる、またはリロードする。

未保存変更がある場合、Viewer は編集を続けるか変更を破棄するかを確認します。

## Document Switching

編集中に別のドキュメントを選択した場合:

- 未保存変更がなければ、Viewer はドキュメントを切り替えます。
- 未保存変更があれば、変更を破棄する前に Viewer が確認します。

## Keyboard Shortcuts

| Action          | macOS      | Windows / Linux |
| --------------- | ---------- | --------------- |
| Body text       | `⌘⌥0`      | `Ctrl+Alt+0`    |
| Heading 1       | `⌘⌥1`      | `Ctrl+Alt+1`    |
| Heading 2       | `⌘⌥2`      | `Ctrl+Alt+2`    |
| Heading 3       | `⌘⌥3`      | `Ctrl+Alt+3`    |
| Heading 4       | `⌘⌥4`      | `Ctrl+Alt+4`    |
| Heading 5       | `⌘⌥5`      | `Ctrl+Alt+5`    |
| Heading 6       | `⌘⌥6`      | `Ctrl+Alt+6`    |
| Bold            | `⌘B`       | `Ctrl+B`        |
| Italic          | `⌘I`       | `Ctrl+I`        |
| Strikethrough   | `⌘⇧S`      | `Ctrl+Shift+S`  |
| Inline code     | `⌘⇧M`      | `Ctrl+Shift+M`  |
| Blockquote      | `⌘⇧B`      | `Ctrl+Shift+B`  |
| Bullet list     | `⌘⇧8`      | `Ctrl+Shift+8`  |
| Ordered list    | `⌘⇧7`      | `Ctrl+Shift+7`  |
| Code block      | `⌘⌥C`      | `Ctrl+Alt+C`    |
| Horizontal rule | `⌘⇧-`      | `Ctrl+Shift+-`  |
| Save            | `⌘Enter`   | `Ctrl+Enter`    |

## Editing Notes

- 大きな編集の前には commit または backup を残してください。
- エディタが alpha の間は、小さな編集を推奨します。
- 保存後は Markdown diff を確認してください。
- 複雑な Markdown を含むドキュメントでは、続行前に警告ダイアログをよく確認してください。
