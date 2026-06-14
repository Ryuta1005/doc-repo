# Getting Started

This guide walks from first launch to the first browser edit.

## Prerequisites

- Node.js 20+
- A repository or directory containing Markdown files

## Start with `npx`

Run from the repository you want to browse:

```bash
npx doc-repo serve
```

If the package is published under an alpha tag, use:

```bash
npx doc-repo@alpha serve
```

Then open:

```text
http://localhost:4000
```

The Viewer shows a document tree on the left and the selected Markdown document on the right.

## Start with a Local Install

If `doc-repo` is installed locally in a project:

```bash
npx doc-repo serve
```

If you are working in this repository from source:

```bash
npm install
npm run dev -- serve
```

## Create a Configuration File

To create a template:

```bash
npx doc-repo init
```

This writes `doc-repo.config.json` in the current directory:

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

Run `doc-repo serve` again after changing the config.

For all configuration rules, see [Configuration](./config.md).

## Browse Markdown Files

1. Start `doc-repo serve`.
2. Open `http://localhost:4000`.
3. Select a Markdown file from the left tree.
4. Read the rendered document in the main pane.

If no document appears, check that your Markdown files are under `rootDir` and match your `include` / `exclude` settings.

## Edit and Save a Document

1. Select a Markdown document.
2. Click **Edit**.
3. Make a small change in the editor.
4. Click **Save**.
5. Check the original `.md` file in your repository.

> [!CAUTION]
> Browser edits are written directly to the original Markdown files.
> Commit or back up your changes before editing, especially while rich-text editing is in alpha.

For supported formatting, save warnings, and keyboard shortcuts, see [Editing and Keyboard Shortcuts](./editing.md).

## Runtime Files

`doc-repo serve` creates `.doc-repo/` as a runtime artifact directory.

Add it to `.gitignore`:

```gitignore
.doc-repo/
```

## Common First-Run Issues

### Port already in use

Use another port:

```bash
npx doc-repo serve --port 4100
```

### No Markdown files are shown

Check:

- Markdown files exist under `rootDir`.
- `include` matches the files you expect.
- `exclude` does not remove them.
- Files under `node_modules/`, `.git/`, and `.doc-repo/` are always excluded.

### Config is not being used

`doc-repo serve` searches upward from the current working directory for `doc-repo.config.json`. Run the command from the repository or a subdirectory under the config file.
