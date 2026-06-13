# Feature Specification: React + Hono ワークスペース基盤

**Feature Branch**: `019-edit-workspace-react-hono`  
**Created**: 2026-06-13  
**Status**: Draft  
**Input**: Task 019 - Rebuild Phase 2 serving & watch experience with React + Hono architecture

## Clarifications

### Session 2026-06-13

- Q: 文書識別子は何を正とするか？ → A: `rootDir` からの正規化相対パスを文書識別子として使用し、`GET /api/document?path=<encoded rootDir-relative path>` の query parameter 方式で受け渡す。
- Q: Phase 3 の保存API追加に向けた HTTP 境界の要件をどう定義するか？ → A: HTTPルート、入力形式の検証、HTTPエラーへの変換、application層の呼び出しを分離し、Phase 3の保存APIを既存の文書一覧・取得APIの契約へ影響を与えず追加できる構造とする。
- Q: FR-013 の回帰テスト要件をどう明確化するか？ → A: React + Honoへの移行前に、Phase 2の主要な利用者体験を回帰テストとして固定し、移行後も同じ期待結果を満たすことを確認する。対象は `doc-repo serve` 起動、左ツリー表示、文書選択と本文表示、相対画像・静的アセット表示、Markdown変更、ファイル追加・削除、ブラウザ自動更新、`doc-repo [scopePath]`（静的生成コマンド/現行CLIのデフォルト実行）、生成物のオフライン閲覧を含む。
- Q: Success Criteria の性能基準をどう定義するか？ → A: 019の目的は性能改善ではなく体験維持であるため、固定数値は使わない。Markdown変更は既存Phase 2と同等以上の体感で反映され、通常規模fixtureで文書一覧・文書取得・画面切替に著しい性能劣化がないことを基準とする。大量ファイル時は既存実装と同等程度を基準にし、具体的な性能改善は019のスコープ外とする。静的生成コマンド（`doc-repo [scopePath]`）はファイルサイズ同一ではなく、主要な出力契約とオフライン閲覧方法の維持を基準とする。

## User Scenarios & Testing

### Scenario 1 - 既存の閲覧体験の維持 (Priority: P1)

ユーザーが `doc-repo serve` を実行すると、既存と同じように左ツリーナビゲーション、本文表示、ファイル選択、画像・静的アセット表示が動作する。

**Why this priority**: 既存ユーザーの表示体験を損なわずに、内部アーキテクチャを再構成する基盤。これができなければ Phase 3 への移行が成り立たない。

**Independent Test**: 既存の serve 動作（ツリー表示→ファイル選択→本文表示→画像表示）について、React UI で機能的に同等の体験を提供できるか。

**Acceptance Scenarios**:

1. **Given** サーバーが起動している **When** ブラウザで http://localhost:PORT にアクセス **Then** React UI でツリー、本文エリアが表示される
2. **Given** ツリーが表示されている **When** ファイルをクリック **Then** 本文内容が React で更新される
3. **Given** Markdown に画像参照がある **When** ページを表示 **Then** 画像が表示される
4. **Given** 静的アセット（CSS 等）が参照されている **When** ページを表示 **Then** スタイルが適用される

---

### Scenario 2 - Markdown 変更監視と自動更新 (Priority: P1)

ユーザーが外部エディタでMarkdownファイルを変更・追加・削除すると、ブラウザ上の本文またはツリーが自動的に最新状態へ更新される。

**Why this priority**: Phase 2で提供しているwatchとブラウザ自動更新は、ローカル閲覧体験の中心であり、基盤移行後も維持する必要がある。

**Independent Test**: Markdownの変更・追加・削除を行い、利用者による手動再読み込みなしで画面へ反映されることを確認する。

**Acceptance Scenarios**:

1. **Given** サーバーが watch モードで起動している **When** ローカルの Markdown ファイルを変更 **Then** ブラウザが自動的に新しい内容を表示する
2. **Given** ツリー構造に新しいファイルが追加される **When** ブラウザの自動リロードが完了する **Then** ツリーが自動更新される
3. **Given** ファイルが削除される **When** ブラウザの自動リロードが完了する **Then** ツリーが自動更新される

---

### Scenario 3 - Hono HTTP 境界の確立 (Priority: P1)

React が HTTP API 経由でサーバー管理データを取得し、Hono がリクエストを処理する。ファイル探索、Markdown 変換など中核処理は core/application 層に委譲される。

**Why this priority**: アーキテクチャ上の責務分離により、UI 層と core 層のデカップリングを確実にする。これにより Phase 3 の保存 API 追加がスムーズになり、複数 UI の同時対応も可能になる。

**Independent Test**: 文書一覧・文書取得などサーバー側データ取得が HTTP API 経由で行われ、core 層が独立して動作することが確認できる。

**Acceptance Scenarios**:

1. **Given** React が起動している **When** 「文書一覧 API」呼び出し **Then** JSON で文書リストが返される
2. **Given** 文書一覧が取得できた **When** `GET /api/document?path=<encoded rootDir-relative path>` を呼び出す **Then** Markdown HTML とメタデータが返される
3. **Given** HTTP API が Hono を通じて呼び出される **When** Hono が core 層に処理を委譲 **Then** core は React / Hono に依存せず動作する

---

### Scenario 4 - 静的生成機能の維持 (Priority: P1)

`doc-repo [scopePath]`（静的生成コマンド/現行CLIのデフォルト実行）で静的 HTML 出力が生成され、Phase 1 の価値が失われない。

**Why this priority**: MVP の収益価値。読むだけで十分なユーザーには静的出力で対応。

**Independent Test**: 静的生成コマンド（現行CLIのデフォルト実行）が `.doc-repo` へ静的成果物を生成し、既存と同じ利用方法でオフライン閲覧できることを確認する。

**Acceptance Scenarios**:

1. **Given** `doc-repo [scopePath]` が実行される **When** 完了 **Then** `.doc-repo` に HTML が生成される
2. **Given** 生成された HTML をブラウザで開く **When** オフラインで閲覧 **Then** コンテンツが表示される

---

### Scenario 5 - エラーハンドリングと安定性 (Priority: P1)

存在しないファイル、ネットワーク障害、サーバー再起動など予期しない状況でも、ユーザーに適切なメッセージが返され、閲覧体験が大きく損なわれない。

**Why this priority**: Phase 2 の serve では安定性が基盤。React への移行時にこれが落ちると、ユーザー信頼が失われる。

**Independent Test**: エラーが発生したときに、適切なメッセージが UI に表示され、他の操作の妨げにならない。

**Acceptance Scenarios**:

1. **Given** ユーザーが存在しないファイルを選択 **When** API が 404 を返す **Then** エラーメッセージが表示され、別ファイルの選択は可能
2. **Given** ファイルが削除された **When** ツリーが更新される **Then** UI がクラッシュせず、別ファイルが選択状態になる
3. **Given** ネットワークが一時的に途絶 **When** SSE が切断される **Then** 再接続を試みるまたは明確にユーザーへ通知する

---

### Edge Cases

- Markdown ファイルが大量な場合、ツリー表示が遅くなるか？（今回は「既存と同等」が要件なので、既存と同程度なら OK）
- ブラウザで戻る・進むボタンを押した場合の動作？（React Router 統合が必要か、要検証）
- サーバー再起動最中にブラウザがリクエストを送る場合？（エラーハンドリング）
- Markdown ファイルの文字コード混在時の処理？（既存挙動に合わせる）
- 現在選択中のファイルが削除された場合、選択状態をどうするか？
- ファイル追加・削除でツリーの展開状態がどうなるか？
- 文書取得中に別文書を素早く選択した場合の挙動？
- 不正または存在しない文書識別子を指定した場合？
- `rootDir` 外の画像・アセット参照があった場合？
- 同名ファイルが異なるディレクトリに存在する場合の識別？
- URLエンコードが必要な日本語名・空白を含むパスの取り扱い？
- watchイベントが短時間に連続した場合のデバウンス？
- SSE切断後の再接続ロジック？

## Requirements

### Functional Requirements

- **FR-001**: `doc-repo serve` コマンドで React + Hono サーバーが起動し、既存と同じ HTTP ポートでリッスンする
- **FR-002**: React UI が左ツリー、右本文エリアで Markdown ファイルを表示する
- **FR-003**: ユーザーがツリーをクリックして別のファイルを選択できる
- **FR-004**: 文書取得 API は、core/application 層が生成した表示用 HTML と文書メタデータを返す
- **FR-005**: ブラウザが既存の SSE（Server-Sent Events）による自動更新機能で Markdown 変更を検知する
- **FR-006**: 画像・静的アセット（CSS、JS）が Hono を通じて配信される
- **FR-007**: 文書一覧 API は `GET /api/documents` で JSON の文書メタデータを返す
- **FR-008**: 文書取得 API は `GET /api/document?path=<encoded rootDir-relative path>` で、`rootDir` からの正規化相対パスを文書識別子として対象文書の HTML を返す
- **FR-009**: 静的生成コマンド（現行CLIのデフォルト実行、`doc-repo [scopePath]`）が既存の主要な出力契約とオフライン閲覧方法を維持した静的成果物を生成する
- **FR-010**: Hono サーバーが core/scanner, core/parser, core/site 層を呼び出し、React に依存しない
- **FR-011**: React UI は core に直接依存しない。`serve` 時のサーバー管理データは Hono の HTTP API 経由で取得する
- **FR-012**: HTTPルート、入力形式の検証、HTTPエラーへの変換、application層の呼び出しを分離し、Phase 3の保存APIを既存の文書一覧・取得APIの契約へ影響を与えず追加できる構造とする
- **FR-013**: React + Honoへの移行前に、Phase 2の主要な利用者体験を回帰テストとして固定し、移行後も同じ期待結果を満たすことを確認する。
  - 回帰対象（少なくとも）: `doc-repo serve` の起動、左ツリー表示、文書選択と本文表示、相対画像・静的アセット表示、Markdownの変更、ファイルの追加・削除、ブラウザ自動更新、`doc-repo [scopePath]`（静的生成コマンド/現行CLIのデフォルト実行）、生成物のオフライン閲覧

### Key Entities

#### ファイルシステム・Markdown 処理 層（既存 core 層）

- **SiteScanner**: ファイルシステムを探索し、Markdown ファイル一覧を取得
- **MarkdownParser**: Markdown テキストを HTML に変換
- **SitePaths**: ファイルパスとルーティングを管理

#### HTTP API 境界（Hono 層）

**文書一覧 API**

- 役割: 利用可能な文書一覧をメタデータ付きで返す
- エンドポイント: `GET /api/documents`
- 形式: JSON, レスポンス例: `[{ "identifier": "...", "title": "...", "path": "..." }, ...]`

**文書取得 API**

- 役割: 指定された文書の HTML と メタデータを返す
- エンドポイント: `GET /api/document?path=<encoded rootDir-relative path>`
- 形式: JSON, レスポンス例: `{ "identifier": "...", "title": "...", "html": "<h1>...</h1>", "metadata": {...} }`
- 識別子方式: `rootDir` からの正規化相対パス
- クライアント要件: `path` は `encodeURIComponent(path)` して送信する
- サーバー要件: デコード後に正規化し、`rootDir` 外参照、空文字、`..` 逸脱を拒否する
- エラー契約: 不正な `path` は `400 INVALID_REQUEST`、存在しない文書は `404 DOCUMENT_NOT_FOUND`

**ブラウザ自動更新**

- 役割: ファイル変更を検知してブラウザへ配信
- 実装方式: 既存 SSE（Server-Sent Events）ロジックを Hono 境界へ移行して維持

#### UI 層（React）

- **DocumentTree**: ツリーコンポーネント
- **DocumentViewer**: 本文表示コンポーネント
- **ApiClient**: HTTP API 呼び出し

#### 静的生成層（既存CLIデフォルト生成パス）

- Phase 1 の静的生成ロジック（`doc-repo [scopePath]` のデフォルト実行）を維持し、新しい React 層に影響しない

## Success Criteria

### Measurable Outcomes

- **SC-001**: React UI で既存の主要な serve 体験を維持できる（左ツリー、本文表示、ファイル選択、画像表示）
- **SC-002**: Markdown変更反映時間について、同一マシン・同一fixture・同一計測手順で baseline と新実装を各1回ウォームアップ後に各5回計測し、中央値を比較する。新実装の悪化率が20%未満であることを原則合格条件とする。20%以上悪化した場合は、原因、利用者影響、019で改善を実施しない理由、許容判断を記録し、明示的承認がある場合のみ合格とする。
- **SC-003**: 文書一覧API、文書取得API、画面切替完了時間を項目別に、同一マシン・同一fixture・同一計測手順で baseline と新実装を各1回ウォームアップ後に各5回計測し、中央値を比較する。各項目で悪化率20%未満を原則合格条件とする。20%以上悪化項目は、原因、利用者影響、019で改善を実施しない理由、許容判断を記録し、明示的承認がある場合のみ合格とする。
- **SC-004**: 移行前に固定・追加した serve・watch・静的生成（`doc-repo [scopePath]`）の回帰テストがすべて通り、移行後も同じ期待結果を満たす
- **SC-005**: 大量ファイルfixtureにおける主要操作を項目別に、同一マシン・同一計測手順で baseline と新実装を各1回ウォームアップ後に各5回計測し、中央値を比較する。各項目で悪化率20%未満を原則合格条件とする。20%以上悪化項目は、原因、利用者影響、019で改善を実施しない理由、許容判断を記録し、明示的承認がある場合のみ合格とする。性能改善自体は019のスコープ外とする。
- **SC-006**: React コンポーネント層が core に依存しない（デカップリング）
- **SC-007**: 静的生成コマンド（`doc-repo [scopePath]`）は既存の主要な出力契約とオフライン閲覧方法を維持する

### Performance Measurement Record Requirements

- 計測結果には次を必須記録とする: `baseline commit`, `new implementation commit`, `machine/environment`, `fixture`, `measurement target`, `warmup result`, `individual results`, `median`, `difference`, `decision`
- 悪化率20%以上の項目は追加で次を必須記録とする: `user impact`, `reason not fixed in 019`, `approval`

## Assumptions

- **ユーザーベース**: 既存の Phase 1・Phase 2 ユーザーで、serve・watch 体験の維持が必須
- **スコープ**: 編集 UI（WYSIWYG エディタ）は含まない。保存機能も含まない。
- **既存アーキテクチャ**: core/scanner, core/parser, core/site が既に存在し、新しい層から呼び出せる状態を前提
- **Node.js 環境**: Node.js >=20 で統一
- **フロントエンド技術**: React + TypeScript を採用し、具体的なバージョンは plan で決定する
- **HTTP サーバー**: Hono フレームワークを採用
- **ブラウザ サポート**: 既存方針に基づく主要モダンブラウザを対象とする
- **ファイル変更検知**: 既存の watch 実装を原則再利用し、置き換えの要否は plan で判断する
- **API 設計**: REST + JSON を前提。GraphQL は非目標。
- **認証・認可**: 今回は単一デバイス・ローカル開発環境を想定。認証は不要。
- **キャッシング**: HTTP キャッシュは機能レベルでは不要。性能が問題になれば後で追加。
- **エラーハンドリング**: 既存のエラーハンドリング方針に習う
- **ログ・監視**: 既存の Logger を活用
- **テスト戦略**: 既存の unit・integration テストパターンに従う

---

## Spec Status

**Draft** - Ready for planning phase (`/speckit.plan`)

### Next Steps

1. 技術検証：React + Hono への移行範囲、既存 Vanilla JS UI の扱い、静的出力とローカルサーバー出力の境界を research で整理
2. React、Hono、application、core、静的生成の責務と依存方向を `project/overview/application-architecture.md` に整理する
3. 実装計画生成
4. タスク分割
5. WYSIWYG エディタ候補の Spike（010 で実施）
