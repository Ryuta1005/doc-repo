# Editing Documents

doc-repo lets you edit Markdown documents from your browser.

Saved changes are written directly to the original `.md` file.

## Open the Viewer

Run the following command from the project containing your Markdown documents:

```bash
npm run doc-repo
```

After doc-repo starts, open the URL shown in the terminal in your browser.

By default, the Viewer is available at:

```text
http://localhost:4000
```

For more information about starting and configuring doc-repo, see [Getting Started](./getting-started.md).

## Edit a Document

1. Select the file you want to edit from the document tree on the left.
2. Click **Edit** in the upper-right corner.
3. Edit the document.
4. If needed, change the filename in the field above the body.
5. Click **Save** when you are finished.

To exit without saving your changes, click **Cancel**.

## Create a Document

1. Hover a file or folder row in the document tree.
2. Click the `+` button shown on the hovered row.
3. The editor opens directly with an inline filename field between the toolbar and body input.
4. Enter a filename and click **Save**. The file is created at this point.

Notes:

- `.md` is always appended to the entered name. For example, `doc.ja` becomes `doc.ja.md`, and `a.md` becomes `a.md.md`.
- Path separators and path-like inputs are rejected.

## Delete a Document or Folder

1. Hover a file or folder row in the document tree.
2. Click the ellipsis menu shown at the end of the row.
3. Select **Delete** (trash icon).
4. Confirm the target name and warning message in the confirmation dialog.
5. Click **Delete** to execute, or **Cancel** to abort.

Notes:

- Delete is available for both files and folders.
- Folder delete follows Policy B: deletion is rejected when any unmanaged or out-of-scope entry exists under the folder.
- When unsaved edits exist, the unsaved-changes guard appears before the delete confirmation.
- After a successful delete, the tree refreshes and selection falls back to a remaining document or empty state.

## Saving

When you click **Save**, your changes are written to the currently open `.md` file.

If you change the filename in edit mode, doc-repo saves the content to the new `.md` filename in the same folder and removes the old name.

Before saving, doc-repo verifies that the target meets the following conditions:

- It is under `rootDir`.
- It is an existing Markdown file.
- It matches the `include` and `exclude` rules.

If any of these conditions are not met, the file is not changed and an error is displayed.

## Supported Formatting

The rich-text editor supports the following formatting:

- Body text
- Headings 1–6
- Bold
- Italic
- Strikethrough
- Inline code
- Blockquotes
- Bullet lists
- Ordered lists
- Code blocks
- Dividers
- Image uploads and insertion
- `info panel` / `admonition` elements used by the Viewer

The Viewer may display Markdown that the rich-text editor does not support. Documents containing unsupported Markdown may change when edited and saved.

## Keyboard Shortcuts

| Action        | macOS    | Windows / Linux |
| ------------- | -------- | --------------- |
| Body text     | `⌘⌥0`    | `Ctrl+Alt+0`    |
| Heading 1     | `⌘⌥1`    | `Ctrl+Alt+1`    |
| Heading 2     | `⌘⌥2`    | `Ctrl+Alt+2`    |
| Heading 3     | `⌘⌥3`    | `Ctrl+Alt+3`    |
| Heading 4     | `⌘⌥4`    | `Ctrl+Alt+4`    |
| Heading 5     | `⌘⌥5`    | `Ctrl+Alt+5`    |
| Heading 6     | `⌘⌥6`    | `Ctrl+Alt+6`    |
| Bold          | `⌘B`     | `Ctrl+B`        |
| Italic        | `⌘I`     | `Ctrl+I`        |
| Strikethrough | `⌘⇧S`    | `Ctrl+Shift+S`  |
| Inline code   | `⌘⇧M`    | `Ctrl+Shift+M`  |
| Blockquote    | `⌘⇧B`    | `Ctrl+Shift+B`  |
| Bullet list   | `⌘⇧8`    | `Ctrl+Shift+8`  |
| Ordered list  | `⌘⇧7`    | `Ctrl+Shift+7`  |
| Code block    | `⌘⌥C`    | `Ctrl+Alt+C`    |
| Divider       | `⌘⇧-`    | `Ctrl+Shift+-`  |
| Save          | `⌘Enter` | `Ctrl+Enter`    |
