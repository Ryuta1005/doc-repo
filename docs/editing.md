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
4. Click **Save** when you are finished.

To exit without saving your changes, click **Cancel**.

## Saving

When you click **Save**, your changes are written to the currently open `.md` file.

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
