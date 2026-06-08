# Feature Specification: 変更監視と自動更新

**Feature Branch**: `006-markdown-watch`  
**Created**: 2026-06-08  
**Status**: Draft  
**Input**: User description: "生成者はMarkdownの変更を監視してサイトを自動更新できる。なぜなら毎回コマンドを再実行せずに最新の内容をブラウザで確認したいから。"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 保存した変更を自動反映する (Priority: P1)

生成者として、`doc-repo serve` 実行中に Markdown を保存したら自動で再生成され、ブラウザで最新内容をすぐ確認したい。

**Why this priority**: この機能の中心価値は、手動で再実行しなくても最新状態を見続けられることだから。

**Independent Test**: `doc-repo serve` 実行中に既存の `.md` を変更して保存し、再生成が走って表示内容が更新されることを単独で確認できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo serve` が起動中で Markdown が表示されている状態, **When** 既存の `.md` ファイルを編集して保存する, **Then** 自動で再生成され、ブラウザの表示内容が最新の文書に更新される
2. **Given** 更新対象の Markdown が複数ある状態, **When** いずれか 1 件を保存する, **Then** 変更が検知されて再生成が開始される
3. **Given** 再生成が完了した状態, **When** 閲覧者が画面を再読み込みしなくても待機する, **Then** 最新の内容が画面に反映されたまま確認できる

---

### User Story 2 - 追加や削除も追従する (Priority: P2)

生成者として、Markdown の新規追加や削除も自動更新の対象にしたい。

**Why this priority**: 日常的な文書管理では編集だけでなく追加・削除も発生するため、継続利用のしやすさに直結するから。

**Independent Test**: 既存の監視中に `.md` を追加・削除し、再生成結果に反映されることを個別に確認できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo serve` が起動中で新しい `.md` が存在しない状態, **When** 新規の `.md` ファイルを作成して保存する, **Then** 変更が検知され、再生成後のサイトに新しい文書が現れる
2. **Given** `doc-repo serve` が起動中で既存の `.md` が表示対象になっている状態, **When** その `.md` ファイルを削除する, **Then** 変更が検知され、再生成後のサイトからその文書が消える
3. **Given** 更新前後で対象ファイル構成が変わる状態, **When** 自動更新が完了する, **Then** 一覧表示と本文表示が同じ最新状態を示す

---

### User Story 3 - 変更の進行状況を把握する (Priority: P3)

生成者として、監視から再生成、更新完了までの進行状況を標準出力で把握したい。

**Why this priority**: 自動更新は裏で動くため、何が起きているか分かることがトラブル対応と安心感に必要だから。

**Independent Test**: 監視中にファイル変更を起こし、標準出力に状態変化が順番に表示されることを確認できる。

**Acceptance Scenarios**:

1. **Given** `doc-repo serve` が監視中の状態, **When** Markdown を保存する, **Then** 変更検知と再生成開始が標準出力に表示される
2. **Given** 再生成が完了した状態, **When** 更新が反映される, **Then** 完了状態が標準出力に表示される
3. **Given** 変更が短時間に連続する状態, **When** 監視処理が動作する, **Then** 進行状況が利用者に分かる形式で表示される

### Edge Cases

- 監視対象の `.md` を連続して保存した場合、最後の変更から 300ms 後に 1 回再生成される（取りこぼしなし）
- 新規ファイルの追加直後に削除した場合でも、サイトの状態が破綻しない
- 再生成中に別の変更を検知した場合、現在の再生成完了後に最新状態でもう 1 回再生成される。同時実行は行わない
- `.md` 以外の保存では、不要な再生成が発生しない
- 再生成が失敗した場合、SSE `reload` イベントを送信せずブラウザは現在表示を維持する。失敗理由は標準出力に表示する
- `file://` で静的生成物を直接開いた場合、SSE 接続を試行せず閲覧機能を維持する

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: システムは `doc-repo serve` 実行中に chokidar を使い、解決済みの rootDir の配下を対象に Markdown の変更を監視しなければならない
- **FR-002**: システムは既存の `.md` ファイルの変更保存（`change` イベント）を検知しなければならない
- **FR-003**: システムは `.md` ファイルの新規追加（`add` イベント）を検知しなければならない
- **FR-004**: システムは `.md` ファイルの削除（`unlink` イベント）を検知しなければならない。リネームは `unlink` + `add` の組み合わせとして扱う
- **FR-005**: システムは最後の変更検知から 300ms 経過後に再生成を 1 回実行しなければならない（debounce）。再生成中に新たな変更を検知した場合は破棄せず、現在の再生成完了後に最新状態で再度 1 回再生成しなければならない。同時に複数の再生成処理は実行しない
- **FR-006**: システムは再生成が**正常完了した場合にのみ**、SSE（Server-Sent Events）の `reload` イベントをブラウザへ送信し、最新内容を反映しなければならない。再生成が失敗した場合は `reload` イベントを送信せず、ブラウザを更新しない
- **FR-007**: システムは監視、再生成、更新完了の進行状況を標準出力で分かるように表示しなければならない
- **FR-008**: システムは自動更新対象を Markdown（`*.md`）に限定し、`.doc-repo`・`.git`・`node_modules` ならびに include/exclude 設定で除外されたパスへの保存で不要な再生成を行わないようにしなければならない
- **FR-009**: システムは変更発生時に、一覧表示と本文表示が同じ最新状態を示すようにしなければならない
- **FR-010**: システムは監視処理が継続中であることを利用者が把握できる状態にしなければならない
- **FR-011**: システムは SSE 接続確立時に接続リストへ追加し、クライアント切断検知時に接続リストから削除しなければならない。自動再接続はブラウザ標準の `EventSource` に任せ、定期 ping は実装しない
- **FR-012**: システムは `SIGINT` / `SIGTERM` 受信時に、chokidar watcher → 全 SSE 接続 → HTTP サーバーの順に非同期クリーンアップを実行し、完了後に自然終了（終了コード 0）しなければならない。クリーンアップの多重実行は防止し、クリーンアップ中のエラーは標準エラー出力へ表示する
- **FR-013**: システムは `file://` プロトコルでページが開かれた場合、クライアント側で SSE 接続を開始せず、静的 HTML 閲覧を継続できなければならない

### Key Entities _(include if feature involves data)_

- **WatchSession**: 1 回の `doc-repo serve` 実行中に継続する監視の単位。監視中の状態、最終更新時刻、通知可能な進行状況を持つ。
- **WatchEvent**: ファイル変更の検知結果。主な属性は種類（追加・更新・削除）と対象パス。
- **RefreshCycle**: 変更検知から再生成と反映完了までの 1 回の更新処理。開始状態、完了状態、失敗状態を持つ。
- **WatchStatusMessage**: 標準出力へ示す利用者向けの状態表示。検知、再生成中、更新完了などの進行状況を表す。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `doc-repo serve` 実行中に Markdown を保存してから、最新内容が確認できるまでの待ち時間を 5 秒以内にできる
- **SC-002**: 変更検知対象の `.md` 追加・更新・削除の各操作が、少なくとも 1 回ずつ正しく再生成につながる
- **SC-003**: 監視中の状態変化が、利用者が見て理解できる順序で毎回標準出力に表示される
- **SC-004**: 通常の文書編集 10 回中 10 回で、再実行なしに最新内容を確認できる
- **SC-005**: `.md` 以外の保存で不要な再生成が発生しない

## Clarifications

### Session 2026-06-09

- Q: ブラウザ自動更新の実装方式は何を使うか？再生成失敗時の挙動は？ → A: SSE（Server-Sent Events）を使用。再生成が正常完了した場合のみ `reload` イベントを送信し、失敗時はブラウザ更新しない
- Q: 連続保存時のデバウンス戦略は？再生成中に変更が来た場合の処理は？ → A: debounce（最後の変更から 300ms 後に 1 回再生成）。再生成中の変更は破棄せず、完了後に最新状態でもう 1 回再生成。同時実行なし
- Q: ファイル監視ライブラリと監視対象・除外ルールは？ → A: chokidar を使用。対象は解決済み rootDir 配下の `*.md`。`.doc-repo` / `.git` / `node_modules` および include/exclude 設定に従ったパスを除外。リネームは `unlink` + `add` の組み合わせとして扱う
- Q: SSE 接続が切れた場合のリトライ挙動とサーバー側の管理方針は？ → A: 自動再接続はブラウザ標準の `EventSource` に任せる。サーバーは接続確立時にリストへ追加し、切断検知時にリストから削除する。定期 ping は現時点では実装せず、接続維持に問題が確認された場合に追加検討する
- Q: Ctrl+C 時のシャットダウン処理方針は？ → A: `SIGINT`/`SIGTERM` で chokidar watcher → 全 SSE 接続 → HTTP サーバーの順に非同期クリーンアップ。多重実行防止。クリーンアップ完了後に自然終了（終了コード 0）。クリーンアップ中のエラーは stderr へ表示

## Assumptions

- 生成者はローカル環境で `doc-repo serve` を継続実行できる
- 利用者はブラウザを開いたまま文書を確認する利用形態を想定する
- この機能はローカル閲覧の利便性向上が対象であり、外部共有や認証は対象外とする
- 変更監視の詳細な対象範囲は、既存のドキュメント生成結果ではなく入力 Markdown を基準にする
- 設定ファイルによる対象範囲の最終的な制御は Story 007 で扱う

## Implementation Traceability

### FR Mapping

- FR-001/002/003/004: `src/core/serve/startMarkdownWatcher.ts`, `src/core/serve/watchTargetFilter.ts`
- FR-005: `src/core/serve/refreshCoordinator.ts`
- FR-006: `src/core/serve/refreshCoordinator.ts`, `src/core/serve/sseConnectionRegistry.ts`, `templates/app.js`
- FR-007/010: `src/core/serve/watchStatusReporter.ts`, `src/core/serve/runServe.ts`, `src/cli/formatResultMessage.ts`
- FR-008: `src/core/serve/watchTargetFilter.ts`, `src/cli/serve/resolveServeOptions.ts`
- FR-009: `src/core/serve/runServe.ts` (regenerate via `generateSite` on watch events)
- FR-011: `src/core/serve/startStaticServer.ts`, `src/core/serve/sseConnectionRegistry.ts`
- FR-012: `src/core/serve/runServe.ts`
- FR-013: `templates/app.js`

### SC Mapping

- SC-001: debounce + pending control in `src/core/serve/refreshCoordinator.ts`
- SC-002: add/change/unlink detection in `src/core/serve/startMarkdownWatcher.ts`
- SC-003: watch status logging in `src/core/serve/watchStatusReporter.ts`
- SC-004: continuous regenerate/reload flow in `src/core/serve/runServe.ts` + `templates/app.js`
- SC-005: non-markdown and excluded-path filtering in `src/core/serve/watchTargetFilter.ts`
