# Configuration

This document is the reference for `doc-repo.config.json`.

## File Name and Discovery

- File name: `doc-repo.config.json`
- Discovery: doc-repo searches from the current working directory upward and uses the first config file it finds.
- If no config file is found, doc-repo falls back to Git root detection, then the current working directory.

## Create a Template

Run:

```bash
doc-repo init
```

This creates `doc-repo.config.json` in the current working directory.

Generated template:

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

If `doc-repo.config.json` already exists, `doc-repo init` does not overwrite it.

## Fields

| Field     | Type       | Required | Default when omitted                         | Description                                                        |
| --------- | ---------- | -------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `name`    | `string`   | No       | `"Doc Repo"`                                 | Site name shown in the Viewer sidebar                              |
| `rootDir` | `string`   | No       | Config directory, Git root, or current cwd   | Root directory used to collect and save Markdown files             |
| `include` | `string[]` | No       | `["**/*.md"]`                                | Glob patterns for Markdown files to include                        |
| `exclude` | `string[]` | No       | `[]`                                         | Additional glob patterns to exclude                                |
| `port`    | `number`   | No       | `4000`                                       | Port used by the local workspace                                   |

Unknown fields are currently ignored.

## Root Directory Resolution

When a config file exists:

1. If `rootDir` is set:
   - Relative paths are resolved from the directory containing `doc-repo.config.json`.
   - Absolute paths are used as-is.
2. If `rootDir` is omitted:
   - The directory containing `doc-repo.config.json` is used.

When no config file exists:

1. doc-repo searches for a Git root from the current working directory.
2. If no Git root is found, the current working directory is used.

## Include and Exclude Rules

- `include` and `exclude` are evaluated relative to `rootDir`.
- If `include` is omitted, `**/*.md` is used.
- If `include` is an empty array (`[]`), it is treated the same as omitted.
- `exclude` is added to the default excludes.
- Exclude rules take precedence over include rules.

Default excludes are always active:

- `node_modules/**`
- `.git/**`
- `.doc-repo/**`

`dist/**` is not a default exclude in the current implementation.

## Port Resolution

Port priority:

1. CLI option `--port`
2. `port` in `doc-repo.config.json`
3. Default `4000`

The port must be an integer from `1` to `65535`.

## Validation Errors

The workspace command fails with exit code `1` when:

- `doc-repo.config.json` cannot be parsed as JSON
- `name` is missing a string value when provided, or is an empty string
- `port` is not an integer from `1` to `65535`
- `include` is provided but is not a string array
- `exclude` is provided but is not a string array
- `rootDir` is provided but is not a string
- `rootDir` does not exist
- `rootDir` is not a directory

Error output includes the failing field where possible.

## Examples

### Explicit Defaults

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

### Collect Only Under `docs/`

Because `include` is evaluated relative to `rootDir`, this collects all Markdown files under `docs/`:

```json
{
  "rootDir": "./docs",
  "include": ["**/*.md"]
}
```

### Collect Specs and Skip Manual Test Notes

```json
{
  "rootDir": ".",
  "include": ["specs/**/*.md"],
  "exclude": ["specs/**/manual-tests/**"]
}
```

### Use a Different Default Port

```json
{
  "port": 4100
}
```
