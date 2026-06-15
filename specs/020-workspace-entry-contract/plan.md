# Plan: 020 静的生成中心契約の入口再定義（軽量版）

## 目的

- 正規入口を `doc-repo serve` に統一する
- 静的生成の直接入口（`doc-repo [scopePath]`）を廃止方針として文書契約に反映する
- 010 が `serve` + React + Hono 前提で開始できる状態を作る

## スコープ

- 含む:
  - README / README.ja / overview / backlog / spec の契約整合
  - 廃止方針の決定メモ作成
  - 既存テストと旧 templates の削除
  - 静的生成経路（CLI 入口 / core/site 実装）の削除
- 含まない:
  - 010 の実装着手
  - 編集 UI や保存 API の機能追加

## 実施ステップ

1. 入口契約の明文化

- README 系で `serve` を唯一の正規入口として説明する
- 静的生成導線を推奨導線から除外する

2. 020 ドキュメント整合

- backlog 020 本文に即時廃止方針を反映
- spec/research の方針表現を揃える

3. 影響範囲の棚卸し

- 既存テストを「削除対象 / 暫定維持」に分類する
- `templates/` の扱いを「残置理由・削除条件」付きで決める

4. 完了判定

- 受け入れ条件をチェックし、満たしたら 020 を Done に更新する

## 実施結果（2026-06-14）

- `doc-repo [scopePath]` / `--open` の CLI 契約を削除
- `src/core/site/` と `templates/` を削除
- 静的生成中心の E2E/回帰テストを削除し、serve 契約テストへ再編
- backlog 020 を Done に更新

## 成果物

- `specs/020-workspace-entry-contract/spec.md`
- `specs/020-workspace-entry-contract/research.md`
- `README.md`
- `README.ja.md`
- `project/planning/backlog/009_編集保存の最小体験を成立させる/020_静的生成中心の契約をドキュメントワークスペース入口へ整理する.md`
- `project/planning/backlog/index.md`

## Done 条件（軽量）

- 正規入口が `serve` で統一され、主要導線文書で矛盾がない
- 静的生成の直接入口が廃止方針として明記されている
- 既存テストと旧 templates の扱い方針が未決定でない
- 020 のステータスを `Done` に更新できる根拠が揃っている
