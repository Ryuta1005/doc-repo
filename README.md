# doc-repo

doc-repo is a CLI that converts Markdown files in your repository into a browsable static documentation site with a directory tree.

> [!WARNING]
> `doc-repo` is currently in alpha. CLI arguments and generated file structure may change in future releases.

![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)

## Why doc-repo?

As repositories grow, Markdown documents (specs, design notes, operational docs) tend to become harder to navigate.

- Markdown files are scattered across multiple directories.
- It is hard to browse content across files without opening an editor.
- It is difficult to share a clear reading path with non-developers.

doc-repo addresses this by generating a two-pane viewer (left tree / right content) that makes repository documents easier to explore.

## Features

- Recursively discovers `.md` files in your repository
- Preserves directory structure in tree navigation
- Works without a local server (`index.html` can be opened directly)
- Supports local server mode (`doc-repo serve`) with initial generation
- Watches Markdown files and auto-regenerates on save while `serve` is running
- Reloads the browser automatically via SSE when regeneration succeeds
- Supports directory-scoped generation (`scopePath`)
- Supports `--open` to launch the generated page automatically

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

Open the generated site:

```bash
open .doc-repo/index.html
```

Generate only a specific directory:

```bash
npx doc-repo specs
npx doc-repo docs/project
```

## CLI

```bash
doc-repo [scopePath] [--open]
doc-repo init
doc-repo serve [--port <number>]
```

| Argument / Option | Description                                                              | Default        |
| ----------------- | ------------------------------------------------------------------------ | -------------- |
| `scopePath`       | Directory to generate from (path relative to Git root)                   | Whole Git root |
| `--open`          | Open `.doc-repo/index.html` with your default browser after generation   | `false`        |
| `init`            | Generate `doc-repo.config.json` template in current directory            | -              |
| `serve`           | Run initial generation, start local static server, and watch for changes | -              |
| `--port`          | Port for `serve` (CLI > config > default)                                | `4000`         |

### Serve Responsibilities

- `doc-repo serve` orchestrates: initial generation → server start → file watch start
- Watches `.md` files and re-generates on change, add, or unlink
- After successful regeneration, sends a reload event to all connected browsers via SSE
- The HTTP server is delivery-only and does not run generation by itself
- If initial generation fails, server startup is skipped and command exits with code `1`
- On exit (Ctrl+C / SIGTERM), stops in order: watcher → SSE connections → HTTP server

### Target Root vs Collection Scope

- Target root: resolved from `doc-repo.config.json` if present; falls back to Git root, then current directory
- Collection scope: Directory under target root resolved from `scopePath`

## Configuration File

For full configuration details and validation rules, see [docs/config.md](./docs/config.md).

Create `doc-repo.config.json` in your repository root to configure behavior:

```json
{
  "rootDir": "./docs",
  "include": ["specs/**/*.md"],
  "exclude": ["drafts/**"],
  "port": 4000
}
```

| Field     | Type       | Default        | Description                                                        |
| --------- | ---------- | -------------- | ------------------------------------------------------------------ |
| `rootDir` | `string`   | Git root / cwd | Root directory for Markdown collection (relative to config file)   |
| `include` | `string[]` | `["**/*.md"]`  | Glob patterns to include. `[]` is treated the same as omitted.     |
| `exclude` | `string[]` | `[]`           | Additional glob patterns to exclude (merged with default excludes) |
| `port`    | `number`   | `4000`         | Port for `serve` command (overridden by `--port` CLI option)       |

**Resolution order**: config file (`doc-repo.config.json`) → Git root → current directory.

**Default excludes** (always active): `node_modules/**`, `.git/**`, `.doc-repo/**`

**`exclude` takes precedence over `include`.**

## Output

doc-repo generates a multi-page static site under `.doc-repo`, mirroring your Markdown tree:

```text
.doc-repo/
├── index.html        # redirects to the home page (README if present)
├── styles.css
├── app.js            # browser-side auto-reload (SSE client)
├── README.html
└── docs/
    └── guide/
        └── page.html
```

Each Markdown file becomes a standalone `.html`, and links between documents are
plain relative links, so it works even when opened directly via `file://`.

Reliability behavior:

- Replaces `.doc-repo` only after a successful generation
- Generates in a staging directory before publishing
- Keeps existing `.doc-repo` when generation fails
- Generates an empty site and exits successfully with warning when no Markdown files are found

### Exit Codes

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| `0`  | Success (including success with warnings) |
| `1`  | Failure                                   |

## Current Limitations

- Browser-based Markdown editing is not supported yet

## Markdown Support (Current)

- Converter: `markdown-it`
- `html: false` (raw HTML in Markdown is disabled)
- `linkify: true`, `typographer: true`
- Some GFM extensions (task lists, Mermaid, code highlighting) are not yet supported
- Relative images are automatically copied to `.doc-repo/assets/` and rewritten to work both in static files and via `serve`

## Security Notes

- Raw HTML is disabled, but generation is still intended for trusted repositories
- If you run doc-repo on unknown repositories, review output before sharing

## Git Policy for `.doc-repo`

Choose a policy based on your use case:

- Treat as temporary artifact: add `.doc-repo/` to `.gitignore`
- Treat as distributable artifact: committing generated files is also possible (output is replaced on each successful run)

## Development

For contributors:

```bash
npm install
npm run dev
npm run dev -- specs
```

Build and run compiled CLI:

```bash
node dist/cli/index.js
node dist/cli/index.js specs
```

## Markdown Features & Constraints

**Supported**:

- Relative images (e.g., `![alt](./docs/assets/image.png)`): automatically copied to `.doc-repo/assets/` and rewritten to work in both `file://` mode and `serve` mode

**Not yet supported (planned for future releases)**:

- Attachments in Markdown (PDF, CSV, ZIP, etc. referenced via normal links like `[link](./docs/assets/file.pdf)`)

## Issues / Feedback

Please use GitHub Issues for bug reports and feature requests.

## License

MIT
