# doc-repo Configuration

This document explains how `doc-repo.config.json` works.

## File Location

- File name: `doc-repo.config.json`
- Search behavior: the CLI searches from current working directory upward and uses the first file it finds.

## Supported Fields

```json
{
  "rootDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["drafts/**"],
  "port": 4000
}
```

| Field     | Type       | Required | Description                                   |
| --------- | ---------- | -------- | --------------------------------------------- |
| `rootDir` | `string`   | No       | Root directory to collect Markdown files from |
| `include` | `string[]` | No       | Include glob patterns                         |
| `exclude` | `string[]` | No       | Additional exclude glob patterns              |
| `port`    | `number`   | No       | Port used by `doc-repo serve`                 |

Unknown fields are ignored.

## Resolution Rules

### `rootDir`

1. If `rootDir` is set:
   - Relative path: resolved from the directory containing `doc-repo.config.json`
   - Absolute path: used as-is
1. If config exists but `rootDir` is omitted:
   - Use the config file directory as root
1. If config does not exist:
   - Try Git root detection
   - Fallback to current working directory

### `port`

Priority:

1. CLI option `--port`
1. `port` in config file
1. default `4000`

Valid range: `1` to `65535`.

### `include` and `exclude`

- If `include` is omitted, `**/*.md` is used.
- If `include` is an empty array (`[]`), it is treated same as omitted (`**/*.md`).
- `exclude` patterns are appended to default excludes.
- Exclude has higher priority than include.

Default excludes are always active:

- `node_modules/**`
- `.git/**`
- `.doc-repo/**`
- `dist/**`

## Behavior Notes

- `doc-repo` and `doc-repo serve` share the same config resolution behavior.
- Invalid config causes command failure with exit code `1`.
- Error messages include the invalid field where possible.

## Validation Errors

The command fails (`exit code 1`) for:

- JSON parse error
- `rootDir` does not exist
- `rootDir` is not a directory
- `include` is not `string[]`
- `exclude` is not `string[]`
- `port` is out of range or not a number

## Examples

### Collect only under `docs/`

```json
{
  "rootDir": "./docs"
}
```

### Collect only spec markdown and skip manual tests

```json
{
  "rootDir": ".",
  "include": ["specs/**/*.md"],
  "exclude": ["specs/**/manual-tests/**"]
}
```

### Set default serve port

```json
{
  "port": 4100
}
```
