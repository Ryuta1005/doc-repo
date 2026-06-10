# Feature Specification: 設定ファイルによる動作設定

**Feature Branch**: `007-config-file-settings`  
**Created**: 2026-06-09  
**Status**: Draft  
**Input**: User description: "project/planning/backlog/004*日常利用しやすいツールにする/007*生成者は設定ファイルで動作を設定できる.md"

## 実装状況（既存基盤）

以下はすでに `serve` コマンド向けに実装済みである。本 Story ではこれを壊さず、`rootDir` の追加と通常生成（`doc-repo [scopePath]`）への適用を完成させることが主目的。

| 機能                                                   | 実装状況    | 備考                       |
| ------------------------------------------------------ | ----------- | -------------------------- |
| 設定ファイル探索（`findConfigPath`）                   | 済（serve） | 上位ディレクトリを再帰探索 |
| JSON読み込み・`include`/`exclude` バリデーション       | 済（serve） | `resolveServeOptions.ts`   |
| `port` 読み込みとバリデーション（1〜65535）            | 済（serve） | `validatePort`             |
| `watchTargetFilter`（watch 対象フィルタ）              | 済（serve） | `include`/`exclude` を反映 |
| `rootDir` の設定ファイルからの読み込み                 | **未実装**  | 本 Story の主対象          |
| 通常生成（`doc-repo [scopePath]`）への設定ファイル反映 | **未実装**  | 本 Story の主対象          |
| `scanMarkdown` への `include`/`exclude` 渡し           | **未実装**  | 本 Story の主対象          |

## 用語定義

- **rootDir**: Markdown の収集・生成・監視の起点となるディレクトリ。次の優先順で決定する。
  1. 設定ファイルに `rootDir` が指定されている場合: 相対パスは設定ファイルが置かれたディレクトリを基準に解決する。絶対パスはそのまま使用する。
  2. 設定ファイルが存在するが `rootDir` が省略されている場合: 設定ファイルが置かれたディレクトリを `rootDir` とする。
  3. 設定ファイルが存在しない場合: 実行ディレクトリから上位に向かって `.git` を探索し、最初に見つかったディレクトリを `rootDir` とする。`.git` も見つからない場合は実行ディレクトリを使用する。

## User Scenarios & Testing _(mandatory)_

### User Story 1 - `rootDir` を設定ファイルで指定して収集範囲を固定する (Priority: P1)

生成者として、`doc-repo.config.json` に `rootDir` を指定しておけば、オプションなしで実行しても決まった範囲の Markdown が生成・監視の対象になる状態にしたい。

**Why this priority**: `rootDir` が設定ファイルから読まれなければ、設定ファイルの主目的である「繰り返し操作の省略」が成立しないから。

**Independent Test**: `rootDir: "./docs"` を含む `doc-repo.config.json` を作成してオプションなしで `doc-repo` と `doc-repo serve` を実行し、`docs/` 配下のみが対象になることを確認できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo.config.json` に `rootDir: "./docs"` がある状態, **When** `doc-repo` を実行する, **Then** 設定ファイルが置かれたディレクトリを基準に相対パスを解決した `docs/` 配下の Markdown が生成される
2. **Given** `doc-repo.config.json` に `rootDir: "./docs"` がある状態, **When** `doc-repo serve` を実行する, **Then** `docs/` 配下を起点にサイトが生成・監視される
3. **Given** 設定ファイルに `rootDir` が絶対パスで記載されている状態, **When** コマンドを実行する, **Then** 絶対パスをそのまま rootDir として使用する
4. **Given** 設定ファイルに `rootDir` が省略されている状態, **When** コマンドを実行する, **Then** 設定ファイルが置かれたディレクトリを rootDir として使用する

---

### User Story 2 - `include`/`exclude` を設定ファイルで指定して収集対象を絞り込む (Priority: P1)

生成者として、`doc-repo.config.json` に `include`/`exclude` を指定しておけば、通常生成と `serve` の両方で同じ収集範囲が使われる状態にしたい。

**Why this priority**: `include`/`exclude` は serve の watch には既に反映されているが、通常生成には未反映のため、生成対象と監視対象が食い違う問題がある。本 Story で統一する。

**Independent Test**: `exclude: ["drafts/**"]` を設定した状態で `doc-repo` を実行し、`drafts/` が出力に含まれないことを確認できる。

**Acceptance Scenarios**:

1. **Given** `exclude: ["drafts/**"]` を設定した状態, **When** `doc-repo` を実行する, **Then** `drafts/` 配下のファイルは生成されない
2. **Given** `include: ["specs/**/*.md"]` を設定した状態, **When** `doc-repo` を実行する, **Then** `specs/` 配下のみが対象になる
3. **Given** `include` と `exclude` が両方設定されており、あるファイルが両方に一致する状態, **When** `doc-repo` を実行する, **Then** そのファイルは exclude が優先され、収集対象にならない
4. **Given** `exclude: ["drafts/**"]` を設定した状態で `serve` を実行中, **When** `drafts/` 配下の Markdown を変更する, **Then** 変更は無視され、不要な再生成が発生しない（watch と通常生成が一致）
5. **Given** `include`/`exclude` が省略されている状態, **When** コマンドを実行する, **Then** 既存のデフォルト除外（`node_modules/**`, `.git/**`, `.doc-repo/**`）が適用される

---

### User Story 3 - 設定ファイルなしでも従来通り動作する (Priority: P2)

生成者として、設定ファイルを用意しなくても現行と同様にコマンドを実行できる状態を維持したい。

**Why this priority**: 後方互換の確保は既存利用者の体験を壊さないために必須だから。

**Independent Test**: 設定ファイルなしの状態で `doc-repo` と `doc-repo serve` を実行し、従来通りの動作が得られることを確認できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo.config.json` が存在しない状態で上位に `.git` がある, **When** `doc-repo` を実行する, **Then** `.git` が最初に見つかったディレクトリを rootDir としてサイトが生成される
2. **Given** `doc-repo.config.json` も `.git` も存在しない状態, **When** コマンドを実行する, **Then** カレントディレクトリを rootDir としてサイトが生成される
3. **Given** 設定ファイルが存在しない状態, **When** `doc-repo serve` をオプションなしで実行する, **Then** ポート 4000 でサーバーが起動する

---

### User Story 4 - 不正な設定ファイルのエラー内容を把握する (Priority: P3)

生成者として、設定ファイルの記述が不正だった場合に、どのフィールドが問題なのかを含むエラーメッセージを受け取りたい。

**Why this priority**: 設定ミスは頻繁に起こり得るが、エラー内容が分からなければ修正できないから。

**Independent Test**: 不正な設定ファイルを用意してコマンドを実行し、問題のあるフィールドと理由を含むエラーが表示され終了コード 1 で終了することを確認できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo.config.json` の JSON 構文が壊れている状態, **When** コマンドを実行する, **Then** 構文エラーである旨のメッセージが表示され、終了コード 1 で終了する
2. **Given** `rootDir` に存在しないパスが指定されている状態, **When** コマンドを実行する, **Then** `rootDir` フィールドが問題であること・理由が表示され、終了コード 1 で終了する
3. **Given** `port` に文字列や範囲外の数値が指定されている状態, **When** コマンドを実行する, **Then** `port` フィールドが問題であること・理由が表示され、終了コード 1 で終了する
4. **Given** `include` または `exclude` に文字列配列以外の値が指定されている状態, **When** コマンドを実行する, **Then** 対象フィールドが問題であること・理由が表示され、終了コード 1 で終了する

---

### Edge Cases

- 設定ファイルが上位のディレクトリに複数存在する場合は、最初に見つかった（最も近い）ものを使う
- `port` の有効範囲は 1〜65535。範囲外はバリデーションエラー（既存実装の動作を維持）
- 設定ファイルが空（`{}`）の場合はすべてデフォルト値を使い、エラーにしない
- 設定ファイルに未知のフィールドが含まれている場合は、警告なしで無視する
- `rootDir` に解決後のパスが `.doc-repo` の外を指していてもエラーにしない（出力先は常に検出したルートの `.doc-repo`）

## Requirements _(mandatory)_

### Functional Requirements

**既存動作の維持**

- **FR-001**: システムはコマンド実行時に、実行ディレクトリから上位に向かって `doc-repo.config.json` を探索し、最初に見つかったファイルを設定として使用しなければならない（既存実装を維持）
- **FR-002**: システムは `doc-repo.config.json` が見つからない場合にのみ、`.git` 探索で rootDir を決定しなければならない。設定ファイルが存在する場合は `.git` 探索を行わない（既存実装を維持）
- **FR-003**: システムは `port` の CLI オプション・設定ファイル・デフォルト値の優先順を維持しなければならない（既存実装を維持）
- **FR-004**: システムは `port` が 1〜65535 の範囲外の場合、フィールド名と理由を含むエラーを表示して終了コード 1 で終了しなければならない（既存実装を維持）
- **FR-005**: システムは `include`/`exclude` が文字列配列以外の場合、フィールド名と理由を含むエラーを表示して終了コード 1 で終了しなければならない（既存実装を維持）

**本 Story の新規対象**

- **FR-006**: システムは設定ファイルの `rootDir` フィールドを読み取り、Markdown の収集起点として使用しなければならない
- **FR-007**: `rootDir` の相対パスは設定ファイルが置かれたディレクトリを基準に解決しなければならない
- **FR-008**: `rootDir` が省略された場合は、設定ファイルが置かれたディレクトリを rootDir として使用しなければならない
- **FR-009**: 解決後の `rootDir` が存在しないパスを指している場合、またはディレクトリではない場合、`rootDir` フィールドが問題であること・理由を含むエラーを表示して終了コード 1 で終了しなければならない
- **FR-010**: システムは通常生成（`doc-repo [scopePath]`）でも設定ファイルを読み込み、`rootDir`・`include`・`exclude` を反映しなければならない
- **FR-011**: 通常生成と `serve` は同じ設定解決結果（rootDir, include, exclude, port）を使用しなければならない
- **FR-012**: `serve` のファイル監視範囲も、解決された `rootDir`・`include`・`exclude` に従わなければならない（既存の `watchTargetFilter` への接続を確認・維持）
- **FR-013**: `exclude` は `include` より優先されなければならない。両方に一致したファイルは収集対象外とする
- **FR-014**: `include` が省略された場合および `include: []`（空配列）が明示されている場合は、いずれも `**/*.md` を収集対象として扱わなければならない
- **FR-015**: 設定ファイルに未知のフィールドが含まれている場合は、警告なしで無視しなければならない
- **FR-016**: 設定ファイルが存在しない場合でも、オプションなしのコマンド実行を従来通りサポートしなければならない
- **FR-017**: 利用者が `exclude` を指定した場合は、指定パターンを既定除外（`node_modules/**`・`.git/**`・`.doc-repo/**`）に追加しなければならない。利用者指定の `exclude` は既定除外を解除しない
- **FR-018**: 生成物は解決済みの `rootDir` 配下の `.doc-repo` へ出力しなければならない

### Key Entities _(include if feature involves data)_

- **ConfigFile**: `doc-repo.config.json` の内容。属性は `rootDir`（省略可）、`include`（省略可）、`exclude`（省略可）、`port`（省略可）。未知フィールドは無視。
- **ResolvedConfig**: ConfigFile・CLI オプション・デフォルト値を優先度順にマージした最終的な設定値。決定済みの `rootDir`・`include`・`exclude`・`port` を保持し、通常生成と `serve` の両方がこれを参照する。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `rootDir: "./docs"` を設定した状態でオプションなしの `doc-repo` と `doc-repo serve` を実行したとき、両コマンドの対象ファイル集合が `docs/` 配下のみで一致する
- **SC-002**: 通常生成と `serve` が同一の設定解決結果（rootDir・include・exclude）を使用し、生成対象と監視対象がずれない
- **SC-003**: `include`/`exclude` を設定した場合に除外対象が両コマンドで一致し、不要な再生成が発生しない
- **SC-004**: 設定ファイルが存在しない状態でコマンドを実行したとき、従来通りの結果が得られる（後方互換）
- **SC-005**: 不正な設定ファイルでコマンドを実行したとき、問題のあるフィールドと理由が含まれるエラーメッセージが表示され、終了コード 1 で終了する

## Assumptions

- 設定ファイルの形式は JSON（`doc-repo.config.json`）のみ対象。YAML 等は対象外
- `include`/`exclude` の glob パターン評価は既存の fast-glob の仕様に従う
- `exclude` が `include` に優先されるルールは通常生成・`serve` の両方に共通適用する
- 設定ファイルのエンコーディングは UTF-8
- CLI に現時点で存在するオプションは `--port` のみ。`--root-dir` 等の CLI オプション追加は本 Story の対象外
- 同じ設定項目が CLI オプションと設定ファイルの両方で指定された場合は CLI オプションを優先する（現在は `port` のみ）

## Clarifications

### Session 2026-06-09

- Q: 用語（configDir / rootDir）の扱い → A: `rootDir` のみを仕様の主要概念とする。設定ファイルの場所は実装内部の一時情報として扱い、仕様上は `rootDir` の決定フローに統合する
- Q: 利用者指定の `exclude` はデフォルト除外を置き換えるか、追加するか → A: 常時追加。既定除外（`node_modules/**`, `.git/**`, `.doc-repo/**`）は利用者が解除できない（FR-017）
- Q: `include: []`（空配列）の意味 → A: 省略（未指定）と同一扱いとし、全 `**/*.md` が対象になる。空配列では収集対象ゼロにはならない（FR-014）
- Q: `rootDir` のバリデーション条件 → A: 存在すること かつ ディレクトリであること（FR-009）
- Q: outputDir の位置 → A: 解決済み `rootDir/.doc-repo` 固定。設定変更は本 Story の対象外（FR-018）
