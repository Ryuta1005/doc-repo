# Configuration

This document describes the configuration options available in `doc-repo.config.json`.

## Initialize the Configuration File

```bash
npm run doc-repo -- init
```

This creates `doc-repo.config.json` in the current working directory.

```json
{
  "name": "Doc Repo",
  "rootDir": ".",
  "include": ["**/*.md"],
  "exclude": [],
  "port": 4000
}
```

If the configuration file already exists, it is not overwritten.

## Configuration Options

| Option    | Type       | Default                                         | Description                                                |
| --------- | ---------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `name`    | `string`   | `"Doc Repo"`                                    | The name displayed in the Viewer sidebar                   |
| `rootDir` | `string`   | The directory containing the configuration file | The root directory used to collect and save Markdown files |
| `include` | `string[]` | `["**/*.md"]`                                   | Glob patterns for Markdown files to include                |
| `exclude` | `string[]` | `[]`                                            | Additional glob patterns for files to exclude              |
| `port`    | `number`   | `4000`                                          | The port used to start the Viewer                          |

All options are optional.

- Relative paths in `rootDir` are resolved from the directory containing the configuration file.
- If `include` is an empty array, the default value `["**/*.md"]` is used.
- `exclude` takes precedence over `include`.
- `node_modules/**`, `.git/**`, and `.doc-repo/**` are always excluded.
- The `--port` CLI option takes precedence over the `port` value in the configuration file.
- `port` must be an integer between `1` and `65535`.

## Configuration File Discovery

doc-repo searches upward from the current working directory for `doc-repo.config.json` and uses the first configuration file it finds.

If no configuration file is found, doc-repo uses the root of the Git repository. If no Git root is found, it uses the current working directory.

## Configuration Errors

If the configuration file cannot be read, or if a configuration value has an invalid type or range, doc-repo displays an error and exits.
