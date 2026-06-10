# Feature Specification: serve時の相対画像表示不具合修正

**Feature Branch**: `014-fix-serve-image-assets`  
**Created**: 2026-06-11  
**Status**: Draft  
**Input**: User description: "project/planning/backlog/004\_日常利用しやすいツールにする/014_ISSUE_serve時にREADME画像が表示されない.md"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Markdownの相対画像をserveで表示する (Priority: P1)

ドキュメント閲覧者が `doc-repo serve` で生成サイトを開いたとき、Markdown に記載されたリポジトリ相対の画像が、`file://` で直接開いた場合と同じように表示される。ユーザーはローカルサーバー利用時にもスクリーンショットや説明画像を欠落なく確認できる。

**Why this priority**: Markdown 内の画像表示はドキュメント閲覧の基本機能であり、`serve` の基本体験に直接影響するため。

**Independent Test**: 相対画像参照（例: `![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)`）を含む Markdown があるリポジトリで `doc-repo serve` 相当の生成と静的配信を行い、(1) 生成HTML内の `img src` が `.doc-repo` 配下 URL を指すこと、(2) その URL が指す実ファイルが存在すること、(3) 配信時に HTTP 200 で取得できることを独立に確認する。

**Acceptance Scenarios**:

1. **Given** Markdown に `./docs/assets/screenshot-sample.png` の画像参照がある、**When** `doc-repo serve` で生成サイトを表示する、**Then** 対象ページ上で画像が表示される。
2. **Given** 同じ生成結果、**When** 対象ページの HTML を `file://` で直接開く、**Then** 対象ページ上で同じ画像が表示される。
3. **Given** Markdown の相対画像が `docs/assets/` 配下の実在ファイルを参照している、**When** サイト生成が完了する、**Then** 生成HTML の `img src` は `.doc-repo` 配下のコピー先 URL を指す。
4. **Given** 生成HTML の `img src` が `.doc-repo` 配下 URL を指している、**When** 生成物を確認する、**Then** 対応する画像ファイルが `.doc-repo` 配下に実在する。

---

### Edge Cases

- 外部URL画像（`https://...`、`http://...`、`//...`）はコピーせず、そのまま維持する
- ハッシュ参照（`#...`）はコピー対象にしない
- リポジトリルート外へ抜ける相対パス（`../...`）はコピー対象にしない
- 実在 Markdown ページへのリンクは従来どおり `.html` へのページリンクとして解決する
- 通常リンクで参照される PDF / CSV / ZIP などの添付ファイルは本チケットの対象外とする

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Markdown 内の相対画像参照は、生成後の `.doc-repo` 配下に閉じたURLへ変換されなければならない
- **FR-002**: 変換された相対画像参照の元ファイルがリポジトリ内に存在する場合、生成処理はそのファイルを `.doc-repo` 配下へコピーしなければならない
- **FR-003**: `file://` と `serve` のどちらで開いても、同じ生成HTMLが同じ画像を表示できなければならない
- **FR-004**: `serve` の静的配信ルートは `.doc-repo` 配下に限定したまま維持しなければならない
- **FR-005**: 外部URL画像、ハッシュ参照、通常リンクで参照される非Markdownファイルは画像コピー対象にしてはならない
- **FR-006**: 既存のページ間リンク、テンプレート資産（`styles.css`、`app.js`）、SSE更新の挙動を壊してはならない

### Key Entities

- **参照画像（Referenced Image）**: Markdown の画像記法 `![...](...)` から参照される、リポジトリ配下の画像ファイル。例: `docs/assets/screenshot-sample.png`
- **生成画像パス（Generated Image Path）**: `.doc-repo` 配下にコピーされた参照画像のパス。例: `.doc-repo/assets/docs/assets/screenshot-sample.png`
- **サイト内資産URL（Site Asset URL）**: HTML ページから生成資産パスを指す相対URL。例: `assets/docs/assets/screenshot-sample.png`

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 生成HTML の `img src` が `.doc-repo/assets/...` のサイト内 URL へ変換される
- **SC-002**: SC-001 で参照される画像ファイルが `.doc-repo/assets/...` 配下に実在する
- **SC-003**: Markdown から参照された `./docs/assets/screenshot-sample.png` が `doc-repo serve` 経由で HTTP 200 として取得できる
- **SC-004**: 同じ生成HTMLを `file://` で開いても同じ画像が表示される
- **SC-005**: `serve` は `.doc-repo` 外のファイルを直接配信しない
- **SC-006**: 既存の generate / serve / watcher 関連テストが通る

## Assumptions

- このチケットでは資産収集対象を Markdown の画像記法 `![...](...)` から直接参照されるリポジトリ内画像ファイルに限定する
- 通常リンクで参照される PDF / CSV / ZIP / 画像ファイルなどの添付リンク対応は別チケットで扱う
- CSS 内の `url(...)` や HTML 生タグ内の独自属性の解析は対象外とする
- 参照画像のコピー先は衝突を避けるため、リポジトリ相対パスを `assets/` 配下に維持する
- 存在しない参照画像は既存挙動との互換を優先し、生成失敗にはしない
