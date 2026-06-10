# Feature Specification: ローカルサーバー起動

**Feature Branch**: `005-local-server-serve`  
**Created**: 2026-06-08  
**Status**: Draft  
**Input**: User description: "project/planning/backlog/004*日常利用しやすいツールにする/005*生成者はローカルサーバーでドキュメントサイトを起動できる.md"

## Clarifications

### Session 2026-06-08

- Q: 005 のポート設定における優先順位はどうするか? → A: CLIオプション → 設定ファイル → デフォルト値
- Q: 生成物がない場合に serve はどう振る舞うか? → A: serve が初回生成を先に実行し、失敗時はサーバーを起動せず終了コード1で終了する

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

### User Story 1 - ワンコマンドで閲覧開始する (Priority: P1)

生成者として、コマンドを1回実行するだけで初回生成からローカル配信開始まで完了し、ブラウザで確認したい。

**Why this priority**: サイトを即時に確認できることがこの機能の中核価値であり、他の振る舞いより優先度が高いため。

**Independent Test**: 生成物がない状態で serve を実行し、初回生成後に配信が開始されることを確認する。初回生成失敗時は配信を開始せず終了することも同時に検証できる。

**Acceptance Scenarios**:

1. **Given** 生成対象の入力が存在し生成物が未作成の状態, **When** 生成者が serve を実行する, **Then** 初回生成が先に実行され、成功後にローカルサーバーが起動し、アクセス可能な URL が標準出力に表示される
2. **Given** サーバー起動後の状態, **When** 生成者が表示された URL にブラウザでアクセスする, **Then** ドキュメントサイトが表示される
3. **Given** 生成対象の入力不備などで初回生成が失敗する状態, **When** 生成者が serve を実行する, **Then** サーバーは起動せず理由が分かるエラーを表示して終了コード `1` で終了する

---

### User Story 2 - 利用環境に合わせてポートを調整する (Priority: P2)

生成者として、ローカル環境の都合に応じてサーバーの待受ポートを設定したい。

**Why this priority**: 起動そのものより優先度は低いが、既存サービスとの共存やチーム内の利用に必須となる場面が多いため。

**Independent Test**: 設定ファイルで `port` を指定して起動し、表示 URL と実際のアクセス先が指定ポートになっていることを確認することで独立検証できる。

**Acceptance Scenarios**:

1. **Given** `port` が未指定の状態, **When** 生成者が `doc-repo serve` を実行する, **Then** 既定のポート `4000` で起動する
2. **Given** 設定ファイルに有効な `port` が設定されている状態, **When** 生成者が `doc-repo serve` を実行する, **Then** 指定されたポートで起動し、表示 URL に同じポート番号が含まれる
3. **Given** 設定ファイルで `port` が指定され、CLI オプションでも `port` が指定されている状態, **When** 生成者が `doc-repo serve` を実行する, **Then** CLI オプションの値を優先して起動する

---

### User Story 3 - 安全に停止し問題時に原因を把握する (Priority: P3)

生成者として、サーバーを明示的に停止でき、起動失敗時には理由を把握したい。

**Why this priority**: 利用継続性と保守性に関わる重要な体験だが、起動して閲覧できること自体よりは優先度が低いため。

**Independent Test**: 稼働中に停止操作を行ってプロセスが終了すること、ポート競合と初回生成失敗の両状態でエラーメッセージと終了コードを確認することで独立検証できる。

**Acceptance Scenarios**:

1. **Given** サーバーが起動中の状態, **When** 生成者が停止操作を行う, **Then** サーバーは終了しポートを開放する
2. **Given** 指定ポートが他プロセスで使用中の状態, **When** 生成者が `doc-repo serve` を実行する, **Then** 理由が分かるエラーメッセージを表示して終了コード `1` で終了する
3. **Given** 初回生成が失敗する状態, **When** 生成者が serve を実行する, **Then** サーバー起動処理へ進まず終了コード `1` で終了する

### Edge Cases

- 生成物が未作成の状態で serve を実行した場合、初回生成を先に行ってから配信を開始できるか
- 初回生成が失敗した場合、サーバー起動を抑止し、原因を識別できるメッセージを表示できるか
- 指定された `port` が範囲外、または整数でない場合、起動前に入力不正として検出できるか
- ブラウザを自動で開かない環境でも、表示された URL だけで手動アクセスできるか

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: システムは serve 実行時に、初回生成、サーバー起動、変更監視開始の順で処理を実行しなければならない
- **FR-002**: システムはサーバー起動後にアクセス URL を標準出力へ表示しなければならない
- **FR-003**: システムは `port` 指定がない場合、既定値 `4000` を使用しなければならない
- **FR-004**: システムは設定ファイルの `port` 指定が有効な場合、その値を起動ポートとして使用しなければならない
- **FR-005**: 生成者は停止操作により起動中サーバーを安全に停止できなければならない
- **FR-006**: システムは起動ポートが競合している場合、原因が分かるメッセージを表示し、終了コード `1` で終了しなければならない
- **FR-007**: システムは不正な `port` 指定を起動前に検出し、対象フィールドと理由が分かるメッセージを表示して終了コード `1` で終了しなければならない
- **FR-008**: システムは設定ファイルが存在しない場合でも、既定値を用いて起動可能でなければならない
- **FR-009**: システムは初回生成が失敗した場合、サーバーを起動せず、利用者が復旧手順を判断できる失敗メッセージを表示して終了コード `1` で終了しなければならない
- **FR-010**: システムは `port` の解決時に、CLI オプション、設定ファイル、デフォルト値の順で優先適用しなければならない
- **FR-011**: HTTP サーバーコンポーネントは生成処理を担当せず、生成済みファイルの配信のみを担当しなければならない

### Key Entities _(include if feature involves data)_

- **ServeConfiguration**: サーバー起動に必要な設定。主な属性は `port`、設定の適用元（既定値または設定ファイル）。
- **ServeSession**: 1回の `doc-repo serve` 実行単位。主な属性は起動状態、公開 URL、終了理由。
- **ServeOrchestrationStep**: serve が実行する段階。初回生成、サーバー起動、変更監視開始の3段階と各段階の成否を表す。
- **ServeFailure**: 起動失敗または実行継続不可の事象。主な属性は失敗種別（ポート競合・入力不正・配信対象不備）と利用者向けメッセージ。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 生成者は初回実行時に、`doc-repo serve` 実行から URL 確認までを 10 秒以内に完了できる
- **SC-002**: 正常系テストケースにおいて、表示された URL へのアクセス成功率が 95% 以上である
- **SC-003**: ポート競合・入力不正・配信対象不備の各異常系で、対象原因を識別できるメッセージが 100% 表示される
- **SC-004**: サーバー停止操作後に同一ポートで再起動できる割合が 100% である
- **SC-005**: 初回生成失敗ケースで、サーバー未起動のまま終了コード `1` で終了する割合が 100% である

## Assumptions

- 生成者はコマンドを実行できるローカル環境とブラウザを利用できる
- 本機能はローカル閲覧の成立を対象とし、外部公開・認証・アクセス制御は対象外とする
- 配信対象は既存のドキュメント生成機能が出力するサイト構造を前提とする
- 設定ファイル探索や設定値解決の詳細仕様は設定ファイル対応ストーリー（007）で最終確定される
- 変更監視の詳細仕様（監視対象、再生成契機、ホットリロード動作）はストーリー 006 で最終確定される
