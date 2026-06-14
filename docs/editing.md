# Editing and Keyboard Shortcuts

doc-repo can edit Markdown documents in the browser and save changes back to the original `.md` files.

> [!CAUTION]
> Browser edits are written directly to the original Markdown files.
> Commit or back up your changes before editing, especially while rich-text editing is in alpha.

## Enter Edit Mode

1. Select a Markdown document in the Viewer.
2. Click **Edit**.
3. The document opens in the rich-text editor.

The editor is intended for common Markdown structures. It is not a complete Markdown round-trip editor.

## Supported Editing Formatting

The rich-text editor currently supports:

- Body text
- Headings 1-6
- Bold
- Italic
- Strikethrough
- Inline code
- Blockquote
- Bullet list
- Ordered list
- Code block
- Horizontal rule
- Image insertion for supported image uploads
- Info panels/admonitions used by the Viewer

Viewer rendering may display more Markdown than the editor can safely edit and preserve.

## Save Behavior

When you click **Save**, doc-repo:

1. Serializes the edited document back to Markdown.
2. Validates that the target is a `.md` file under `rootDir`.
3. Checks `include` and `exclude` rules.
4. Rejects paths that resolve outside `rootDir`.
5. Writes the result back to the original Markdown file.

The save path is the existing Markdown document selected in the Viewer.

## Unsupported Markdown Warnings

If unsupported Markdown segments are detected, doc-repo shows a warning before continuing the save.

The warning means doc-repo will try to preserve original text where possible, but some content may change if it cannot be represented safely by the rich-text editor.

## Save Error Categories

Save failures are categorized as:

| Category             | Retryable | Meaning                                                                 |
| -------------------- | --------- | ----------------------------------------------------------------------- |
| `invalid-target`     | No        | The target path is outside the allowed save target rules                 |
| `unwritable-target`  | No        | The file does not exist or cannot be written until the environment is fixed |
| `transient-io`       | Yes       | A temporary I/O failure may have occurred                                |

## Unsaved Change Protection

doc-repo guards unsaved edits when:

- You switch to another document.
- You exit edit mode.
- You close or reload the browser tab.

If unsaved changes exist, the Viewer asks whether to continue editing or discard changes.

## Document Switching

When you select another document while editing:

- If there are no unsaved changes, the Viewer switches documents.
- If there are unsaved changes, the Viewer asks for confirmation before discarding them.

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

- Keep commits or backups before large edits.
- Prefer small edits while the editor is alpha.
- Review the Markdown diff after saving.
- If a document contains complex Markdown, check the warning dialog carefully before continuing.
