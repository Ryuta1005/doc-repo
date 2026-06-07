# Feature Specification: ワンコマンド生成

**Feature Branch**: `002-one-command-generate`  
**Created**: 2026-06-07  
**Status**: Done  
**Input**: User description: "docs/project/backlog/001*リポジトリMarkdownをブラウザで閲覧可能にする/002*生成者はワンコマンドで生成できる\_なぜならすぐにドキュメントサイトを生成したいから.md"

## Clarifications

### Session 2026-06-07

- Q: 再実行時に既存の `.doc-repo` をどう扱うか? → A: 全置換（実行ごとに `.doc-repo` を再生成して完全に置き換える）
- Q: 対象ルートの自動判定をどうするか? → A: Gitルートを探索し、見つからない場合はカレントディレクトリを対象にする
- Q: 対象リポジトリにMarkdownが0件の場合をどう扱うか? → A: 成功扱いで空サイトを生成し、警告を必須表示する
- Q: 生成途中で失敗したときの出力整合性をどう担保するか? → A: 一時ディレクトリで生成完了後に `.doc-repo` へ切り替える（アトミック置換）
- Q: 終了コードの扱いをどう定義するか? → A: 成功は 0、失敗は 0 以外、警告あり成功も 0

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 1回実行でサイト生成できる (Priority: P1)

生成者として、対象リポジトリでコマンドを1回実行するだけで、Markdown閲覧用サイトを生成したい。
実行すると静的サイトが生成され、`index.html` を開けば Jest のカバレッジレポートのように閲覧できる。

**Why this priority**: MVPで最優先の価値は「すぐに読める成果物を得ること」であり、ワンコマンド生成が成立しないと他機能の価値が発揮されないため。

**Independent Test**: 対象リポジトリでCLIを1回実行し、既定出力先に閲覧可能な成果物が生成されることを確認すれば単独で価値検証できる。

**Acceptance Scenarios**:

1. **Given** 実行者がMarkdownを含むリポジトリ直下にいる, **When** CLIを引数なしで1回実行する, **Then** 既定出力先にブラウザで開けるサイト一式が生成される
2. **Given** 実行者が生成完了後に出力先を確認する, **When** 生成結果を参照する, **Then** 成果物は `.doc-repo` にまとまって存在する

---

### User Story 2 - 実行結果を判別できる (Priority: P2)

生成者として、実行が成功したか失敗したかをその場で判別したい。

**Why this priority**: ワンコマンド体験では操作回数が少ない分、結果のわかりやすさが利用継続に直結するため。

**Independent Test**: 正常ケースと異常ケースでCLIを実行し、終了状態とメッセージから結果判別できることを確認すれば単独で検証できる。

**Acceptance Scenarios**:

1. **Given** 必要条件を満たした実行環境, **When** CLIを実行する, **Then** 成功が明示される
2. **Given** 入力条件に問題がある実行環境, **When** CLIを実行する, **Then** 失敗理由が理解できる形で示される

---

### User Story 3 - 再実行して更新できる (Priority: P3)

生成者として、内容更新後に同じコマンドを再実行し、成果物を最新化したい。

**Why this priority**: 継続利用では再生成が必須だが、初回生成より優先度は低いため。

**Independent Test**: Markdown変更前後で2回実行し、2回目の成果物に更新内容が反映されることを確認すれば単独で検証できる。

**Acceptance Scenarios**:

1. **Given** 既に一度成果物を生成済みでMarkdown内容を更新した, **When** 同じCLIを再実行する, **Then** 出力先の成果物は最新内容に更新される

### Edge Cases

- 実行対象リポジトリにMarkdownが1件もない場合は、空サイトを生成して成功扱いとし、警告を明示する
- 出力先 `.doc-repo` が既に存在する場合、毎回全置換で再生成し前回生成物の残骸を残さない
- 実行途中で生成不能な入力が検出された場合、部分的に壊れた成果物を残さずに終了する
- 読み取り権限が不足するファイルやディレクトリが含まれる場合、利用者が次に取るべき対応を把握できる
- Gitルート探索に失敗した場合でも、カレントディレクトリを対象に実行を継続する
- 生成途中で失敗した場合、`.doc-repo` は切り替え前の状態を維持し、中途半端な生成結果を公開しない

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 生成者は対象リポジトリ内で1回のCLI実行のみでサイト生成処理を開始できること（任意で `scopePath` 位置引数1つを指定可能）
- **FR-002**: システムは実行時にGitルートを探索して対象ルートを自動判定し、探索に失敗した場合はカレントディレクトリを対象として生成処理を行うこと
- **FR-003**: システムは生成成果物を既定出力先 `.doc-repo` に集約して出力すること
- **FR-004**: システムは実行結果について、成功時は成功と出力先を、失敗時は原因と対処の方向性を示すこと
- **FR-005**: システムは同一リポジトリでの再実行時に、`.doc-repo` を全置換で再生成し、最新の入力内容を反映した成果物のみを提供すること
- **FR-006**: システムは生成完了後の成果物をブラウザで閲覧可能な形式として提供すること
- **FR-007**: システムは前提条件を満たさない場合、処理を継続せず失敗として終了すること
- **FR-008**: システムは対象Markdownが0件の場合、空サイト生成を成功扱いとし、0件である旨の警告を利用者に必ず表示すること
- **FR-009**: システムは一時ディレクトリ上で成果物生成を完了した後に `.doc-repo` へ切り替えることで、出力のアトミック置換を実現すること
- **FR-010**: システムは終了コードを、成功時は `0`、失敗時は `0` 以外として返却し、警告あり成功（例: Markdown 0件）でも終了コードは `0` を返却すること

### Key Entities _(include if feature involves data)_

- **生成リクエスト**: 実行時に与えられる処理単位。対象ルート、実行時点、実行コンテキストを持つ
- **生成成果物**: 1回の生成処理で出力されるサイト一式。出力先、生成時刻、閲覧可能状態を持つ
- **実行結果**: 1回の実行に対する判定情報。成功/失敗、理由、利用者向けメッセージを持つ

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 初回利用者の90%以上が、手順書なしでも1回のCLI実行で成果物生成を完了できる
- **SC-002**: 正常な入力条件下での生成処理は、95%以上のケースで2分以内に完了する
- **SC-003**: 生成完了後、利用者の100%が成果物の配置場所を即時に特定できる
- **SC-004**: MVP検証期間中、対象ストーリーに関する「生成手順が分からない」問い合わせ件数を50%以上削減できる

## Assumptions

- 対象ユーザーはローカル端末上でCLI実行権限を持つ
- 入力対象は通常のMarkdownファイルを含む単一リポジトリである
- MVPでは出力先の既定値 `.doc-repo` を変更しない
- MVP範囲ではローカルサーバー起動やブラウザ編集機能は扱わない
- 成果物の受け渡し後は、受け取り手がブラウザで静的ファイルを開ける環境を持つ
