# Data Model: 設定ファイルによる動作設定

## Entity: ConfigFile

- Purpose: `doc-repo.config.json` に記述された利用者指定設定を表す。
- Fields:
  - `rootDir`: string | undefined
  - `include`: string[] | undefined
  - `exclude`: string[] | undefined
  - `port`: number | undefined
- Validation Rules:
  - `rootDir` は指定された場合 string
  - `include` / `exclude` は指定された場合 string[]
  - `port` は指定された場合 1〜65535 の整数
  - 未知フィールドは無視

## Entity: RootDirResolution

- Purpose: 実行時に最終的な `rootDir` がどの規則で決まったかを表す。
- Fields:
  - `rootDir`: string
  - `source`: enum(`config-rootDir`, `config-directory`, `git-root`, `cwd-fallback`)
  - `configPath`: string | null
- Validation Rules:
  - `rootDir` は存在し、ディレクトリでなければならない
  - `configPath` は `source` が `config-*` の場合のみ非 null

## Entity: ScanCriteria

- Purpose: Markdown 収集と監視に共通利用する対象条件を表す。
- Fields:
  - `includePatterns`: string[]
  - `excludePatterns`: string[]
  - `defaultExcludes`: string[]
- Validation Rules:
  - `includePatterns=[]` は「対象ゼロ」を意味する
    - `includePatterns=[]` は `include` 未指定と同一扱いとし、全 `**/*.md` が対象になる
  - `defaultExcludes` は常に `node_modules/**`, `.git/**`, `.doc-repo/**`
  - 収集対象は `include` 一致かつ `exclude` 不一致

## Entity: ResolvedConfig

- Purpose: CLI オプション・設定ファイル・デフォルト値をマージした最終設定。
- Fields:
  - `rootDir`: string
  - `outputDir`: string
  - `includePatterns`: string[]
  - `excludePatterns`: string[]
  - `port`: number
  - `portSource`: enum(`cli`, `config`, `default`)
  - `rootSource`: enum(`config-rootDir`, `config-directory`, `git-root`, `cwd-fallback`)
  - `configPath`: string | null
- Validation Rules:
  - `outputDir` は常にコマンド実行ディレクトリ（cwd）直下の `.doc-repo`
  - `portSource=cli` の場合は CLI 指定値が最終値
  - 通常生成と `serve` の両方で同一形の設定を使う

## Entity: ConfigValidationFailure

- Purpose: 設定解決中に利用者へ返す失敗情報を表す。
- Fields:
  - `field`: enum(`config`, `rootDir`, `include`, `exclude`, `port`)
  - `reason`: string
  - `hint`: string | null
  - `exitCode`: 1
- Validation Rules:
  - `field=config` は JSON 構文エラー等、ファイル全体の問題に使う
  - `field=rootDir` は存在しない、またはディレクトリでない場合に使う

## Relationships

- `ConfigFile` は 0..1 の `RootDirResolution` と 1 の `ScanCriteria` に影響する。
- `RootDirResolution` と `ScanCriteria` と CLI オプションをマージして 1 の `ResolvedConfig` を生成する。
- `ResolvedConfig` の検証失敗は 0..n の `ConfigValidationFailure` として表現される。
