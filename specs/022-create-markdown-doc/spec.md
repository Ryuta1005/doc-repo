# Feature Specification: 新規Markdown文書作成

**Feature Branch**: `022-create-markdown-doc`  
**Created**: 2026-06-21  
**Status**: Draft  
**Input**: User description: "project/planning/backlog/021*文書を作成削除できる/022*利用者は新しいMarkdown文書を作成できる.md"

## Clarifications

### Session 2026-06-21

- Q: 新規作成時の初期本文テンプレートはどれにするか？ → A: A（初期本文は完全な空本文）
- Q: 新規作成画面で相対サブパス入力を許可するか？ → A: A（ファイル名のみ入力可、`/` を含む入力は不可）
- Q: サイドバー表示は拡張子を表示するか？ → A: A（内部ファイル名は `.md` を保持し、サイドバー表示では拡張子なし）

### Session 2026-06-21 (Revision)

- Q: 新規作成時のファイル名入力はモーダルで行うか？ → A: B（編集画面の本文直前にインライン入力する）
- Q: `+` 押下直後にファイル実体を作成するか？ → A: B（遷移時は作成しない。保存時に初めて作成する）

## User Scenarios & Testing _(mandatory)_

### User Story 1 - ワークスペース内で文書を新規作成する (Priority: P1)

利用者はサイドバーの文書ツリーでファイルまたはフォルダにマウスホバーすると表示される `+` 操作から、新しい Markdown 文書作成を開始できる。`+` 押下後は即時に編集画面へ遷移し、編集画面内のファイル名入力欄と本文編集を使って保存時に新規文書を作成できる。

**Why this priority**: 文書を増やせないと編集ワークスペース単体で運用が完結しないため、最優先の価値である。

**Independent Test**: 利用者がサイドバーで任意ノードへホバーし、表示された `+` を押して編集画面へ遷移し、保存前に実体ファイルが存在しないこと、保存後に文書作成・ツリー更新・新規文書選択まで完了することを確認できれば独立して価値を検証できる。

**Acceptance Scenarios**:

1. **Given** 利用者が編集ワークスペースを開いている, **When** サイドバー上のファイルまたはフォルダにホバーする, **Then** ファイル名は左寄せ、`+` ボタンは右寄せで行の両端に表示される。
2. **Given** 利用者がホバー表示された `+` ボタンをクリックする, **When** 作成フローを開始する, **Then** 新規作成専用モーダルではなく編集画面へ遷移し、ツールバーと本文入力欄の間にファイル名入力欄が表示される。
3. **Given** 利用者が `+` 押下直後の編集画面にいる, **When** まだ保存していない, **Then** 新規ファイル実体は作成されない。
4. **Given** 利用者が拡張子なしのファイル名で保存を実行する, **When** 保存処理が成功する, **Then** システムは自動的に `.md` を補完して新規文書を作成し、文書ツリーには拡張子なし名称で反映し、その文書を選択状態にする。
5. **Given** 利用者が既存の Markdown 文書を含む文書ツリーを表示している, **When** サイドバーを確認する, **Then** 新規作成文書だけでなく既存文書も拡張子なし表示で統一される。

---

### User Story 2 - 不正な作成要求を安全に拒否する (Priority: P2)

利用者は作成できないパスや条件に対して、上書きや不正アクセスを起こさず、失敗理由を確認できる。

**Why this priority**: 誤操作や悪意のある入力で既存ファイルや rootDir 外に影響を与えないことが、運用上の安全性に直結するため。

**Independent Test**: `..` を含むパス、include/exclude 条件外、既存同名ファイルへの作成要求を個別に実施し、すべて安全に拒否され理由が提示されることを確認できる。あわせてクリック元ノードに応じた作成先解決が一貫することを確認できる。

**Acceptance Scenarios**:

1. **Given** 利用者が作成先に rootDir 外を示すパスを入力する, **When** 作成を確定する, **Then** 作成は拒否され、拒否理由が表示される。
2. **Given** 利用者が既存同名ファイルのパスで作成を試みる, **When** 作成を確定する, **Then** 既存ファイルは上書きされず、重複エラーが表示される。
3. **Given** 利用者がフォルダノードの `+` から作成を開始する, **When** 作成先が解決される, **Then** 新規文書はそのフォルダ直下に作成される。
4. **Given** 利用者がファイルノードの `+` から作成を開始する, **When** 作成先が解決される, **Then** 新規文書はそのファイルと同じ階層（親フォルダ直下）に作成される。
5. **Given** 利用者が任意のファイル名本文を入力する, **When** 作成を確定する, **Then** 入力値の末尾に `.md` が自動付与される。
6. **Given** 利用者が `/` を含む相対サブパスを入力する, **When** 作成を確定する, **Then** 入力は拒否され、ファイル名のみ入力可能であることが表示される。
7. **Given** 利用者が `example` を入力して作成する, **When** 文書ツリーが更新される, **Then** 内部ファイルは `example.md` として保存され、サイドバー表示は `example` となる。

---

### User Story 3 - 未保存変更ガードを保ったまま作成する (Priority: P3)

利用者は編集中文書に未保存変更がある状態でも、既存の未保存変更確認フローを壊さずに新規作成操作を進められる。

**Why this priority**: 既存の保存安全性を維持したまま機能追加することで、利用者のデータ損失リスクを増やさないため。

**Independent Test**: 既存文書を未保存状態にし、新規作成操作を実行して未保存変更確認フローが従来通り動作するかを確認できる。

**Acceptance Scenarios**:

1. **Given** 利用者に未保存変更がある, **When** 新規文書作成操作を開始する, **Then** 既存の未保存変更確認フローが実行され、確認結果に応じて作成継続または中止される。

### Edge Cases

- 作成先パスの入力が空文字、空白のみ、または先頭末尾に空白を含む場合でも、意図しないファイルは作成されない。
- 本 feature はファイル名のみ入力を受け付けるため、`./` や重複スラッシュ等のパス正規化ケースは入力対象外であり、区切り文字を含む入力は拒否される。
- include と exclude が競合するパスでは、作成可否ルールが一貫して適用される。
- 作成操作中に対象ディレクトリが外部要因で削除または権限変更された場合、作成は失敗し理由が表示される。
- ルート直下ノードで `+` を押した場合でも、rootDir 外に解決されない。
- 同一ノードを連続ホバーしても `+` ボタンが重複表示されない。
- ホバー解除後は `+` ボタンが非表示に戻り、誤クリックを誘発しない。
- 新規作成遷移直後のファイル名入力欄は下線のみ表示され、空欄時にグレーのプレースホルダー「ページタイトル」を表示する。
- 利用者が `example.md` と入力した場合、入力値をファイル名本文として扱い `example.md.md` として作成される。
- 利用者が `example.txt` のようにドットを含む名前を入力した場合、ドット以降もファイル名本文として扱われ `example.txt.md` として作成される。
- 利用者が `child/example` のような `/` を含む入力を行った場合は拒否される。
- 同一階層に `example.md` が存在する状態で `example` を入力した場合、同一ファイルとして重複判定される。

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a creation `+` button on the right side of a sidebar node only while a file or folder node is hovered.
- **FR-002**: System MUST allow users to start new document creation by clicking the hovered node's `+` button.
- **FR-003**: System MUST transition users to the editor screen after `+` button click, and MUST NOT open a dedicated creation modal.
- **FR-004**: System MUST derive the creation base location from the clicked node context.
- **FR-005**: System MUST create the new document directly under the clicked folder when the clicked node is a folder.
- **FR-006**: System MUST create the new document in the clicked file's parent folder (same level as the clicked file) when the clicked node is a file.
- **FR-007**: System MUST require users to provide only a filename for the new document within the derived base location, using an inline filename field between the editor toolbar and body input.
- **FR-008**: System MUST always append `.md` to the filename text entered by users.
- **FR-009**: System MUST treat an entered `.md` suffix as filename text and still append the storage `.md` suffix.
- **FR-010**: System MUST allow filename text that contains dots such as `doc.ja` or `example.txt` and persist it by appending `.md`.
- **FR-011**: System MUST reject filename inputs containing path separators such as `/` and `\\`.
- **FR-012**: System MUST allow creation only when the resolved target is a `.md` file under rootDir.
- **FR-013**: System MUST reject path traversal attempts (including `..`-based traversal) and any target outside rootDir.
- **FR-014**: System MUST allow creation only for paths that are included by include rules and not excluded by exclude rules.
- **FR-015**: System MUST fail creation without overwriting when a file with the same path already exists.
- **FR-016**: System MUST present a user-understandable failure reason when creation is rejected.
- **FR-017**: System MUST refresh the document tree after successful creation and make the created document selectable.
- **FR-018**: System MUST create the initial document body as empty content.
- **FR-019**: System MUST preserve existing unsaved-change confirmation behavior when users perform create actions during an unsaved state.
- **FR-020**: System MUST persist created document filenames with a `.md` extension in the underlying file system.
- **FR-021**: System MUST display all Markdown document names in the sidebar without the `.md` extension (both existing and newly created documents), while preserving `.md` in internal filenames.
- **FR-022**: System MUST defer physical file creation until users press save in the editor after entering a filename.
- **FR-023**: System MUST render the inline filename field as underline-only style, and MUST show gray placeholder text `ページタイトル` when empty.
- **FR-024**: System MUST align sidebar row label to the left and `+` button to the right so they appear at opposite ends on hover.

### Key Entities _(include if feature involves data)_

- **DocumentCreationRequest**: 新規文書作成時に利用者が指定する入力。主な属性は targetPath、requestedName、requestedAt。
- **CreationAnchorContext**: `+` ボタンを押したノード情報。主な属性は nodeType（file/folder）、nodePath、resolvedBasePath。
- **DocumentCreationPolicy**: 作成可否判定のルール集合。主な属性は rootDir 制約、許可拡張子制約、include 条件、exclude 条件、重複許可可否。
- **DocumentCreationResult**: 作成実行結果。主な属性は status（success/rejected）、reasonCode、createdDocumentPath。
- **DocumentTreeDisplayItem**: サイドバー表示用の文書項目。主な属性は internalFilename（`.md` 付き）、displayName（拡張子なし）。
- **NewDocumentTemplate**: 新規文書の初期本文定義。主な属性は templateType、templateContent。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 初見利用者の 95% 以上が、説明なしでサイドバーのホバー `+` 操作から新規作成フローを開始できる。
- **SC-002**: 代表的な利用者シナリオにおいて、利用者の 90% 以上が 60 秒以内に新規文書作成を完了できる。
- **SC-003**: 無効入力（rootDir 外、パストラバーサル、`.md` 以外、対象外パス、重複）の作成要求は 100% 拒否される。
- **SC-004**: 既存同名ファイルに対する新規作成試行で、既存ファイルの内容改変が 0 件である。
- **SC-005**: 新規作成成功時、文書ツリーへの反映と作成文書の選択が 2 秒以内に完了する。
- **SC-006**: 拡張子省略入力による作成成功ケースで、100% の作成結果が `.md` 拡張子付きファイルとして保存される。
- **SC-007**: 新規作成成功ケースで、サイドバー上の表示名が 100% 拡張子なしとなる。

## Assumptions

- 対象利用者は rootDir 配下に対して作成権限を持つ。
- 本 feature の対象は単一文書の新規作成であり、同時複数作成やフォルダ作成は対象外とする。
- ファイルノード起点の「直下」は、ファイルシステム上の制約に合わせて「対象ファイルの親フォルダ直下（同階層）」として扱う。
- 新規作成時の初期本文は常に空本文とする。
- 新規作成画面の入力欄はファイル名のみを受け付け、相対サブパス入力は受け付けない。
- 新規作成モーダルは採用せず、編集画面の共通コンポーネントで新規作成導線を成立させる。
- サイドバーの文書名表示は拡張子なしを正とし、内部ファイル名は `.md` を保持する。
- include/exclude 設定は既存機能で有効化済みであり、本 feature はその判定結果を利用する。
