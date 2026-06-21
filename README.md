# doc-repo

doc-repo is a local workspace for viewing and editing Markdown files in a Git repository from your browser.

It lets you browse documents using the repository's existing directory structure and update them from the browser while keeping the Markdown files as the source of truth.

> [!WARNING]
> doc-repo is currently in alpha. Workspace behavior and editing features may change in future releases.

![doc-repo Viewer](./docs/assets/screenshot-sample.png)

## Git and Markdown as the Source of Truth

Managing specifications and design documents as Markdown files in a Git repository lets you track changes and review updates in the same way as source code. This approach also works well with specification-driven development and AI-assisted development, allowing the Markdown files in the repository to serve as the documentation **Source of Truth**.

However, reading and updating Markdown files in a repository may require users to open an editor, locate files, and understand Git-based workflows. This may not be convenient for everyone on a team.

doc-repo provides a browser-based workspace for viewing and editing Markdown without moving the content to a separate documentation service. Changes are saved to the original Markdown files, allowing the repository to remain the Source of Truth.

## Features

- Browse Markdown documents in the browser while preserving the repository's directory structure
- Edit Markdown documents using a rich-text editor in the browser
- Create new Markdown documents from the sidebar hover `+` action
- Delete Markdown documents/folders from the sidebar hover ellipsis menu with confirmation

## Quick Start

### Prerequisites

- Node.js 20 or later
- A repository or directory containing Markdown files

### Install and Start

Install doc-repo in your project as a `devDependency`.

```bash
npm install --save-dev doc-repo@alpha
```

Add doc-repo to the existing `scripts` section of your `package.json`.

```json
{
  "scripts": {
    "doc-repo": "doc-repo"
  }
}
```

Start doc-repo.

```bash
npm run doc-repo
```

Open the following URL in your browser:

```text
http://localhost:4000
```

The document tree appears on the left, and the selected Markdown document appears on the right.

For detailed instructions, see [Getting Started](./docs/getting-started.md).

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Configuration](./docs/config.md)
- [Editing Documents](./docs/editing.md)

## Workspace Commands

```bash
npm run doc-repo
npm run doc-repo -- init
npm run doc-repo -- --version
npm run doc-repo -- serve --port 4100
```

| Command or option | Description                            |
| ----------------- | -------------------------------------- |
| `doc-repo`        | Start the local workspace              |
| `init`            | Create `doc-repo.config.json`          |
| `serve`           | Explicitly start the workspace         |
| `--version`, `-V` | Print the installed doc-repo version   |
| `--port <number>` | Specify the workspace HTTP server port |

## Configuration

doc-repo can run without a configuration file.

To change settings such as the files to display or the port number, create `doc-repo.config.json` with the following command:

```bash
npm run doc-repo -- init
```

For details about each configuration option, see [Configuration](./docs/config.md).

## Editing

Click **Edit** in the Viewer to edit the selected Markdown document. Saved changes are written directly to the original `.md` file in the repository.

To create a new document, hover a file or folder row in the left sidebar and click `+`. Enter a filename only. doc-repo always appends `.md` to the entered name and keeps sidebar labels without the final `.md`.

To delete a document or folder, hover a row in the left sidebar, open the ellipsis menu, and choose **Delete**. Folder deletion follows Policy B: if unmanaged or out-of-scope entries are found under the folder, deletion is rejected to avoid partial removal.

The Viewer may display Markdown that the rich-text editor cannot safely edit or preserve.

For supported formatting and keyboard shortcuts, see [Editing Documents](./docs/editing.md).

## Security

- Use doc-repo only with repositories you trust
- Raw HTML in Markdown is not rendered
- Do not expose the local server to an untrusted network

## Development

```bash
npm install
npm run dev -- serve
npm test
npm run build
```

To run the built command, use:

```bash
node dist/cli/index.js serve
```

## Issues / Feedback

Use GitHub Issues to report bugs or request features.

## License

MIT
