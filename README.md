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
```

| Argument / Option | Description                                                            | Default        |
| ----------------- | ---------------------------------------------------------------------- | -------------- |
| `scopePath`       | Directory to generate from (path relative to Git root)                 | Whole Git root |
| `--open`          | Open `.doc-repo/index.html` with your default browser after generation | `false`        |

### Target Root vs Collection Scope

- Target root: Git root (or current directory when Git root is not found)
- Collection scope: Directory under target root resolved from `scopePath`

## Output

doc-repo generates a multi-page static site under `.doc-repo`, mirroring your Markdown tree:

```text
.doc-repo/
├── index.html        # redirects to the home page (README if present)
├── styles.css
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

- Local server mode (`serve`) is not supported yet
- File watching (`watch`) is not supported yet
- Browser-based Markdown editing is not supported yet
- Detailed include/exclude rules are not supported yet

## Markdown Support (Current)

- Converter: `markdown-it`
- `html: false` (raw HTML in Markdown is disabled)
- `linkify: true`, `typographer: true`
- Some GFM extensions (task lists, Mermaid, code highlighting) are not yet supported
- Relative images/links may not render as expected in some repository layouts because assets are not currently rewritten/rebased

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

Build:

```bash
npm run build
```

Run compiled CLI:

```bash
node dist/cli/index.js
node dist/cli/index.js specs
```

## Issues / Feedback

Please use GitHub Issues for bug reports and feature requests.

## License

MIT
