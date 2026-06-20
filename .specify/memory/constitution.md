# doc-repo Constitution

## Core Principles

### I. Markdown Source of Truth

- プロダクトは Markdown ファイルを唯一の Source of Truth として扱う。
- 生成物や UI 状態は Markdown を置き換えてはならない。

### II. Repository Structure Respect

- Git リポジトリ内の既存ファイル構造を尊重する。
- 既存のディレクトリ設計や命名規約を、明示的な合意なしに破壊してはならない。

### III. Safe File Boundary

- rootDir 外への書き込みを禁止する。
- path traversal（`..` を含む外部脱出）を禁止する。

### IV. No Implicit Overwrite

- ユーザーの既存ファイルを暗黙に上書きしてはならない。
- 上書き相当の操作は、明示的な確認または明示仕様がある場合のみ許可される。

### V. File Operation Test Coverage

- 主要なファイル操作（作成・保存・削除・移動・検証）には、ユニットテストまたは統合テストを用意する。
- 仕様に追加された新しい主要操作は、対応するテストを必須とする。

### VI. UX Consistency

- UI 変更は既存のサイドバー/エディタ体験と整合させる。
- 既存フローを変更する場合は、既存ユーザーの操作期待を崩さない移行方針を明示する。

## Additional Constraints

- MVP では最小価値の達成を優先し、不要な機能拡張を避ける。
- CLI/application/core/presentation/viewer の責務分離を維持する。

## Workflow & Quality Gates

- spec, plan, tasks の整合チェックを実装前に実施する。
- Constitution 違反を含む状態で実装に進んではならない。
- manual-tests の実測欄（判定/実行結果/補足）は人間が記録し、AI は事前入力しない。

## Governance

- Constitution は他ドキュメントより優先される。
- 変更は PR または明示合意で行い、影響を受ける spec/plan/tasks を同時に更新する。
- 各 feature の plan は Constitution Check で準拠状況を明示する。

**Version**: 1.0.0 | **Ratified**: 2026-06-21 | **Last Amended**: 2026-06-21
