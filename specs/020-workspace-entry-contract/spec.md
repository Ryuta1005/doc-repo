# Feature Specification: 静的生成中心契約の入口再定義

**Feature Branch**: `[020-workspace-entry-contract]`
**Created**: 2026-06-14
**Status**: Done
**Input**: User description: "project/planning/backlog/009*編集保存の最小体験を成立させる/020*静的生成中心の契約をドキュメントワークスペース入口へ整理する.md"

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

### User Story 1 - 正規入口の明確化 (Priority: P1)

利用者として、ドキュメントワークスペースを起動する正規入口を迷わず選びたい。なぜなら閲覧と編集の前提となる操作を最短で開始したいから。

**Why this priority**: 編集・保存体験に着手する前提として、入口の認識ズレを解消しないと以降の機能価値が伝わらないため。

**Independent Test**: 初回利用者向け説明から起動手順を辿り、正規入口へ到達できることを確認すれば単独で価値検証できる。

**Acceptance Scenarios**:

1. **Given** 初回利用者がプロダクト説明を読む状態, **When** 起動方法を確認する, **Then** 正規入口がドキュメントワークスペース起動であると一意に理解できる
2. **Given** 初回利用者が CLI の説明を読む状態, **When** 実行コマンドを選択する, **Then** ワークスペース起動の経路が最初に提示される

---

### User Story 2 - 契約境界の統一 (Priority: P2)

開発者として、ワークスペース提供契約を同一の入口条件で定義したい。なぜなら設定、CLI、配信前提の解釈差をなくし、後続の編集保存設計を安定させたいから。

**Why this priority**: 仕様境界が分裂すると API・UI・運用説明が再び食い違い、実装とテストの手戻りが増えるため。

**Independent Test**: 主要ドキュメントと CLI 契約の記述を比較し、入口契約と配信前提が一貫しているかをレビューすれば独立に検証できる。

**Acceptance Scenarios**:

1. **Given** 設定と CLI 仕様を参照する状態, **When** 配信前提を確認する, **Then** 同一ポート・同一オリジンの単一契約として説明されている
2. **Given** API/表示/更新通知の利用前提を確認する状態, **When** 契約境界を読む, **Then** 単一入口契約に従う利用条件が示されている

---

### User Story 3 - 廃止方針の即時確定 (Priority: P3)

既存利用者として、静的生成機能が廃止されたことを明確に知りたい。なぜなら今後の利用経路を迷わず正規入口へ切り替えたいから。

**Why this priority**: 正規入口の確立を優先しつつ、旧導線の誤利用を防ぐために明示が必要なため。

**Independent Test**: 静的生成機能の廃止決定と旧導線の扱いが文書化されているか確認すれば独立に検証できる。

**Acceptance Scenarios**:

1. **Given** 既存利用者が静的生成の説明を確認する状態, **When** 機能の位置づけを読む, **Then** 静的生成は廃止済みで正規入口が `serve` であると理解できる
2. **Given** テスト担当者が回帰テスト群を確認する状態, **When** テスト分類を参照する, **Then** 廃止対象のテストと継続対象のテストを区別できる

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- 廃止済み機能の導線が README や CLI 説明に残る場合、廃止方針に反するため修正対象として優先的に解消する
- 正規入口と旧導線の説明が同一文書内で矛盾する場合、正規入口を優先し、旧導線記述を削除または廃止注記へ置換する
- 旧テンプレート UI を暫定で残す場合、廃止後の扱い（削除期限または利用禁止範囲）が不明だと誤運用が起きるため、期限付き条件を明示する

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: プロダクト説明は、doc-repo の中心価値を「ブラウザベースのドキュメントワークスペース」として表現しなければならない
- **FR-002**: 正規入口はワークスペース起動経路として定義し、利用者が静的生成経路を正規入口と誤認しないよう記述しなければならない
- **FR-003**: CLI 契約は、配信・API・更新通知・静的アセット提供が単一の入口契約で提供される前提を示さなければならない
- **FR-004**: 設定仕様は、ポート指定を分割前提で説明せず、単一入口契約と矛盾しない形で定義しなければならない
- **FR-005**: `doc-repo [scopePath]` と `--open` の CLI 契約は 020 で削除しなければならない
- **FR-006**: 静的生成機能の方針は「即時廃止」として仕様または調査成果に明記しなければならない
- **FR-007**: 旧テンプレート UI（`templates/page.html`, `templates/styles.css`, `templates/app.js`）と静的生成専用コードは 020 で削除しなければならない
- **FR-008**: 静的生成関連テストは「削除対象」または「移行完了までの暫定維持」に分類し、分類基準を明示しなければならない
- **FR-009**: 編集・保存機能の後続仕様は、静的生成前提ではなくワークスペース前提で着手できる状態を満たさなければならない
- **FR-010**: README、プロダクト概要、ロードマップ、アーキテクチャ、バックログの主要導線は、正規入口の表現が相互に矛盾しない状態を維持しなければならない

### Key Entities _(include if feature involves data)_

- **入口契約 (Entry Contract)**: 利用者が最初に到達すべき起動経路を表す契約。属性は入口種別、利用目的、優先度、参照ドキュメント
- **廃止方針 (Retirement Policy)**: 静的生成機能の廃止判断と移行条件を表す方針。属性は廃止時点、適用範囲、残置物、削除条件
- **導線ドキュメント面 (Documentation Surface)**: 契約を公開する文書群。属性は文書種別、対象読者、契約記述、更新責任
- **テスト分類 (Test Classification)**: テストの意図を表す分類。属性は分類種別、対象機能、合否観点、回帰責務

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 初回利用者レビューで、対象者の 80% 以上が 5 分以内に正規入口を特定できる
- **SC-002**: 入口契約に関する主要文書レビューで、矛盾指摘件数が 0 件で完了する
- **SC-003**: 静的生成機能の方針が「即時廃止」に確定し、未決定項目が残らない
- **SC-004**: 静的生成関連テストの 100% が「削除対象」または「暫定維持」に分類される
- **SC-005**: 後続の編集・保存仕様検討開始時に、入口契約の解釈差によるブロッカーが発生しない

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- 本タスクは機能追加ではなく、入口契約の再定義と整合化を主目的とする
- 編集 UI や保存 API の詳細仕様決定は本スコープ外とし、後続 Story/Spec で扱う
- 既存利用者向けには旧導線の継続提供ではなく、正規入口への移行案内を提供する
- 契約整合の対象は、利用者が参照する主要導線ドキュメントと CLI 契約説明に限定する
- 019 の基盤方針を前提に、010 の設計開始を妨げる静的生成前提の記述を除去する
