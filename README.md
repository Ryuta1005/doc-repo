# doc-repo

doc-repo is a local browser workspace for reading and editing Markdown files in a Git repository.
It keeps Markdown files as the source of truth while making repository docs easier to browse, navigate by structure, and update from a browser.

> [!WARNING]
> `doc-repo` is currently alpha software. CLI behavior, editing behavior, and generated runtime files may change in future releases.

![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)

## Git and Markdown as the Source of Truth

Managing specifications and design documents as Markdown in a Git repository makes it possible to track changes and review updates in the same way as source code. This approach also works well with spec-driven and AI-assisted development, allowing repository Markdown to serve as the **source of truth** for documentation.

However, reading and updating Markdown files in a repository often requires opening an editor, navigating the file structure, and understanding Git-based workflows. This is not always convenient or accessible for everyone on a team.

Moving the same content to a service such as Notion or Confluence may make it easier to use, but it also creates a second copy that must be kept in sync with the repository. Over time, the two versions may diverge.

doc-repo provides a browser-based workspace for reading and editing repository Markdown without moving it to a separate service. Users can navigate the existing directory structure, and edits are saved back to the original Markdown files. This keeps repository Markdown as the source of truth.

## Features

- Recursively discovers `.md` files under the configured root
- Shows repository documents in a two-pane browser workspace
- Preserves directory structure in tree navigation
- Supports browser editing and saves changes back to Markdown files
- Watches Markdown files while the local workspace is running
- Reloads the browser automatically when Markdown files change
- Provides English and Japanese Viewer UI labels

Running `doc-repo` without a command starts the local browser workspace. `doc-repo serve` is the explicit equivalent.

## Quick Start

Prerequisite:

- Node.js 20+

Run inside a repository:

```bash
npx doc-repo
```

If the package is published under an alpha tag, use:

```bash
npx doc-repo@alpha
```

Then open `http://localhost:4000` in your browser.

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Configuration](./docs/config.md)
- [Editing and Keyboard Shortcuts](./docs/editing.md)

## CLI Overview

```bash
doc-repo init
doc-repo
doc-repo serve [--port <number>]
```

| Command / Option  | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `init`            | Create a `doc-repo.config.json` template                   |
| `doc-repo`        | Start the local browser workspace and watch Markdown files |
| `serve`           | Explicit form of the default workspace command             |
| `--port <number>` | Override the configured/default serve port                 |

## Configuration

Create `doc-repo.config.json` to configure the workspace. A minimal explicit configuration looks like this:

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

For resolution rules, default excludes, validation behavior, and more examples, see [Configuration](./docs/config.md).

## Viewer Language

The Viewer UI is available in English and Japanese. Use the globe menu fixed at the bottom of the left sidebar to switch languages.

The default language is English, and your selected language is restored when you reload the page. This changes only the Viewer UI; CLI messages, Markdown content, and repository structure are not translated.

## Editing

Click **Edit** in the Viewer to switch the current document into rich-text edit mode. Saving writes the edited content back to the original Markdown file.

> [!CAUTION]
> Browser edits are written directly to the original Markdown files.
> Commit or back up your changes before editing, especially while rich-text editing is in alpha.

For supported formatting, save validation, unsupported Markdown warnings, save error categories, unsaved-change guards, and keyboard shortcuts, see [Editing and Keyboard Shortcuts](./docs/editing.md).

## Markdown Support

- Rendering uses `markdown-it`.
- Raw HTML in Markdown is disabled.
- `linkify` and `typographer` are enabled.
- Relative images are rewritten to workspace-relative asset URLs and served by the local workspace.
- GFM task lists are not currently supported as task-list UI.
- Mermaid diagrams are not rendered as diagrams.
- Syntax highlighting for fenced code blocks is not currently provided.
- File attachments such as PDF, CSV, and ZIP files linked from Markdown may remain as links, but attachment copying/serving is not a dedicated feature yet.

Viewer rendering support and rich-text editor preservation are not the same thing. The editor supports a smaller set of formatting and may warn before saving when unsupported Markdown segments are detected.

## Runtime Artifacts

The local workspace prepares runtime files under `.doc-repo/`.

Treat `.doc-repo/` as a generated runtime artifact and add it to `.gitignore`.

## Security Notes

- Use doc-repo with repositories you trust.
- Raw HTML is disabled during Markdown rendering.
- The local server serves workspace files needed by the Viewer, so avoid exposing it on untrusted networks.

## Development

For contributors:

```bash
npm install
npm run dev -- serve
npm test
npm run build
```

Run the compiled CLI:

```bash
node dist/cli/index.js serve
```

## Issues / Feedback

Please use GitHub Issues for bug reports and feature requests.

## License

MIT
