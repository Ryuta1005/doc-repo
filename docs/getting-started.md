# Getting Started

This guide explains how to install doc-repo and use it to view and edit Markdown documents in your browser.

## Prerequisites

- Node.js 20 or later
- A repository or directory containing Markdown files

## Install and Start

Install doc-repo in the project containing your Markdown files as a `devDependency`.

```bash
npm install --save-dev doc-repo@alpha
```

Add doc-repo to the `scripts` section of your `package.json`.

```json
{
  "scripts": {
    "doc-repo": "doc-repo"
  }
}
```

Start doc-repo with the following command:

```bash
npm run doc-repo
```

To check the installed doc-repo version, run either version option:

```bash
npm run doc-repo -- --version
```

After doc-repo starts, open the following URL in your browser:

```text
http://localhost:4000
```

The document tree appears on the left, and the selected Markdown document appears on the right.

## View and Edit Documents

1. Select a Markdown file from the document tree on the left.
2. To edit the document, click **Edit** in the upper-right corner.
3. Edit the content, then click **Save**.

Saved changes are written directly to the original `.md` file.

To exit without saving your changes, click **Cancel**.

For supported formatting and keyboard shortcuts, see [Editing Documents](./editing.md).

## Configuration

You can start doc-repo without a configuration file.

To change settings such as the files to display or the port number, run:

```bash
npm run doc-repo -- init
```

This creates `doc-repo.config.json` in the current directory. Restart doc-repo after changing the configuration.

For details about each configuration option, see [Configuration](./config.md).

## Troubleshooting

### Port Already in Use

Start doc-repo on another port:

```bash
npm run doc-repo -- serve --port 4100
```

### Markdown Files Are Not Displayed

Check the following:

- The Markdown files are under `rootDir`.
- The files match the `include` patterns.
- The files are not excluded by the `exclude` patterns.
- The files are not under `node_modules/`, `.git/`, or `.doc-repo/`.

### Configuration File Is Not Loaded

doc-repo searches upward from the current directory for `doc-repo.config.json` and uses the first configuration file it finds.

Run the command from the directory containing the configuration file or one of its subdirectories.
