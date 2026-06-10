# Feature Specification: 設定ファイル雛形の生成（doc-repo init）

**Feature Branch**: `008-config-file-init`  
**Created**: 2026-06-10  
**Status**: Draft  
**Input**: User description: "project/planning/backlog/004_日常利用しやすいツールにする/008_生成者は設定ファイルの雛形を生成できる.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 新規プロジェクトで設定ファイルを生成する (Priority: P1)

ドキュメントサイトを初めて構築しようとしているユーザーが、空のディレクトリで `doc-repo init` を実行すると、デフォルト値入りの `doc-repo.config.json` がカレントディレクトリに生成され、生成されたファイルパスがターミナルに表示される。ユーザーはそのまま設定ファイルを編集してすぐに `doc-repo generate` を実行できる。

**Why this priority**: 設定ファイルがなければ他のコマンドが動作しないため、このユーザーストーリーが本機能の中核である。

**Independent Test**: `doc-repo.config.json` が存在しないディレクトリで `doc-repo init` を実行し、ファイルが生成されてパスが表示されることを確認する。それだけで本機能の主要価値が検証できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo.config.json` が存在しないディレクトリにいる、**When** `doc-repo init` を実行する、**Then** カレントディレクトリに `doc-repo.config.json` が作成され、作成されたファイルのパスが標準出力に表示される。
2. **Given** 生成された `doc-repo.config.json`、**When** ファイルを開く、**Then** `rootDir`、`include`、`exclude`、`port` のキーがデフォルト値とともに含まれている。

---

### User Story 2 - 既に初期化済みのプロジェクトで上書きを防ぐ (Priority: P2)

すでに `doc-repo.config.json` が存在するプロジェクトで誤って `doc-repo init` を再実行した場合、既存のファイルが上書きされず、その旨を伝えるメッセージがターミナルに表示される。

**Why this priority**: 誤操作による設定消失を防ぐことはデータ保護として重要だが、P1（生成機能そのもの）の後に実現すればよい。

**Independent Test**: `doc-repo.config.json` が既に存在するディレクトリで `doc-repo init` を実行し、ファイルが変更されずメッセージが表示されることを確認する。

**Acceptance Scenarios**:

1. **Given** `doc-repo.config.json` が既に存在する、**When** `doc-repo init` を実行する、**Then** 既存ファイルは変更されず、「設定ファイルが既に存在する」旨のメッセージが表示され、終了コード `0` で終了する。

---

### User Story 3 - 書き込み不可ディレクトリでのエラー通知 (Priority: P3)

書き込み権限がないディレクトリで `doc-repo init` を実行した場合、失敗理由がターミナルに表示され、終了コード `1` で終了する。

**Why this priority**: エラーハンドリングは品質向上に寄与するが、正常系が動作したあとに対応すれば十分。

**Independent Test**: 書き込み権限なしのディレクトリで `doc-repo init` を実行し、エラーメッセージが表示されて終了コードが `1` になることを確認する。

**Acceptance Scenarios**:

1. **Given** カレントディレクトリへの書き込み権限がない、**When** `doc-repo init` を実行する、**Then** 失敗理由を含むエラーメッセージが表示され、終了コード `1` で終了する。

---

### Edge Cases

- `doc-repo.config.json` が既に存在する場合 → 上書きしない、警告メッセージを表示する、終了コード `0` で終了する
- カレントディレクトリへの書き込み権限がない場合 → エラーメッセージを表示し、終了コード `1` で終了する
- 生成先ディレクトリが存在しない場合（通常は起こらないが）→ エラーメッセージを表示し、終了コード `1` で終了する

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CLIは `init` サブコマンドを提供しなければならない
- **FR-002**: `doc-repo init` はカレントワーキングディレクトリに `doc-repo.config.json` を生成しなければならない
- **FR-003**: 生成される設定ファイルには `rootDir`、`include`、`exclude`、`port` のキーとデフォルト値が含まれていなければならない
- **FR-004**: `doc-repo.config.json` が既に存在する場合、コマンドは上書きしてはならない
- **FR-005**: 既存ファイルが存在する場合、コマンドはその旨を示すメッセージを表示しなければならない（終了コードは `0`）
- **FR-006**: 生成成功時、コマンドは作成したファイルのパスを表示しなければならない（次ステップのヒントは表示しない）
- **FR-007**: 生成失敗時、コマンドは失敗理由を表示し、終了コード `1` で終了しなければならない

### Key Entities

- **設定ファイル（doc-repo.config.json）**: プロジェクト設定を保持するJSONファイル。キー: `rootDir`（デフォルト: `"."`）、`include`（デフォルト: `["**/*.md"]`）、`exclude`（デフォルト: `[]`）、`port`（デフォルト: `3000`）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ユーザーはドキュメントや設定値を手で調べることなく、1コマンドで有効な設定ファイルを生成できる
- **SC-002**: 既に初期化済みのプロジェクトで `init` を再実行しても、既存設定ファイルの内容が失われない
- **SC-003**: 生成された設定ファイルをそのまま使用して `doc-repo generate` が正常に完了する
- **SC-004**: エラー発生時、ユーザーは表示されるメッセージだけで原因を特定し対処できる

## Clarifications

### Session 2026-06-10

- Q: `doc-repo.config.json` が既に存在する場合の終了コードはどうすべきか？ → A: 終了コード `0`（警告メッセージは出すが、エラー扱いしない）
- Q: 生成される `doc-repo.config.json` の `rootDir` のデフォルト値はどうすべきか？ → A: `"."` を明示する（設定ファイルのあるディレクトリ基準）
- Q: 生成成功時に次ステップのヒントを表示すべきか？ → A: ヒントは表示しない。生成したファイルパスの表示のみ（シンプル優先）。

## Assumptions

- 対象ユーザーはdoc-repoを新規プロジェクトに導入しようとしている開発者またはテクニカルライター
- `init` コマンドはインタラクティブなプロンプトを表示せず、非インタラクティブに動作する
- 生成するデフォルト値はほとんどのリポジトリ構造で動作する一般的な設定とする
- `init` コマンドは設定ファイルの生成のみを担い、他のプロジェクトファイルの作成は行わない
- 既存の設定ファイルを上書きする「強制上書き」オプション（`--force` フラグ等）はMVP範囲外とする
