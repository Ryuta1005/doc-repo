# Issue Workflow

このリポジトリを Jira 的に運用するための最小ワークフロー。

## 決定事項サマリ

このセクションを、運用ルールの一次情報として扱う。

- チケット採番は Epic/Story/Task/Spike で共通連番にする（001, 002, 003...）
- 同じ番号を複数種別で使わない
- Epic は `docs/project/backlog/NNN_エピック名/` のフォルダで管理する
- Story/Task/Spike は `docs/project/backlog/NNN_チケット名.md` で管理する
- Story/Task/Spike は必ずいずれかの Epic にひも付ける
- Story タイトルは原則 `XXX(想定ユーザー)はXXXできる。なぜならXXXXしたいから。` 形式を使う
- backlog の Task は技術タスク（リファクタリング、技術検証、基盤整備など）に限定する
- 機能実装タスクは Speckit のフローで管理し、backlog では起票しない
- backlog 一覧の導線は `docs/project/backlog/index.md` を単一ソースとする
- Story の受け入れ条件は `docs/project/story-map.md` を正とする
- 実装ブランチは原則チケット番号を先頭に付ける（例: `002-one-command-generate`）

## ステータス定義

- Todo: 未着手
- In Progress: 実装中
- Review: レビュー待ち
- Done: 完了
- Blocked: 外部要因で停止

## チケット設計

- Epic: 価値の大きなまとまり
- Story: ユーザー価値単位
- Task: 技術タスク単位（機能実装を直接表さない作業）
- Spike: 調査

## 命名規則

- 全チケットで共通連番を使う（001, 002, 003...）
- Epic は `NNN_エピック名/` のフォルダで管理する
- Story/Task/Spike は `NNN_チケット名.md` で管理する
- 同じ番号を複数種別で使わない（例: 001のStoryと001のTaskは共存しない）
- Story タイトルは原則 `XXX(想定ユーザー)はXXXできる。なぜならXXXXしたいから。` の形式を使う

## Spec 対応ルール

- 1つの Spec は Story を中心に管理する
- 機能実装タスクは Speckit のフローで管理し、backlog では起票しない
- backlog の Task はリファクタリング、技術検証、基盤整備などに限定する
- Spec 完了条件は、対応 Story の受け入れ条件が満たされること
- HTTP API / CLI / file output など外部から利用される境界を変更する Spec は、内部関数の単体テストだけで完了扱いにしない。利用者と同じ入口（HTTP request、CLI process、生成ファイル）から契約を確認する integration test を完了条件に含める
- API の 400/404/500 などのエラー契約は、validator/mapper 単体ではなく実 response の status code、headers、payload まで確認する

## 進行ルール

1. backlog/index.md にチケットを登録し、連番を採番する
2. Epic の場合は `backlog/NNN_エピック名/` を作成する
3. Story/Task/Spike の場合は `backlog/NNN_チケット名.md` を作成する
4. story-map.md に行動導線と対応を追加
5. 依存関係を更新
6. Story/Task/Spike を必ず Epic にひも付ける
7. 実装開始時に In Progress へ移動
8. 受け入れ確認後に Done へ移動
9. Speckit で仕様を起票する際は、対象チケット番号をブランチ番号に一致させる
