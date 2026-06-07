# Research: ワンコマンド生成

## Decision 1: CLI 実装は TypeScript + Node.js LTS を採用する

- Decision: npm CLI を TypeScript で実装し、Node.js LTS を実行基盤とする。
- Rationale: 既存の技術方針（TypeScript 前提、npm CLI 中心）と一致し、将来の拡張（serve/watch）でも資産再利用しやすい。
- Alternatives considered:
  - JavaScript のみ: 初速は速いが型安全性と保守性が下がる。
  - Go/Rust: 単体バイナリ配布は有利だが、npm CLI 方針から外れる。

## Decision 2: 対象ルートは Git ルート優先、失敗時はカレントへフォールバック

- Decision: 実行時は上位探索で Git ルートを優先し、見つからない場合はカレントディレクトリを対象にする。
- Rationale: ワンコマンド体験を壊さず、Git 管理外の軽量ドキュメントディレクトリでも利用可能。
- Alternatives considered:
  - Git ルート必須: 厳格だが初回利用の失敗率が上がる。
  - 明示指定必須: 柔軟だが MVP の簡便性を損なう。

## Decision 3: 出力は一時ディレクトリ生成後に `.doc-repo` へアトミック置換

- Decision: 生成物は一時ディレクトリで完成させてから `.doc-repo` を置換する。
- Rationale: 中途失敗時に壊れた成果物を公開しないという要件を最も確実に満たせる。
- Alternatives considered:
  - 直接書き込み: 途中失敗で部分生成物が残るリスクが高い。
  - 失敗時削除: 既存成果物を失うリスクがある。

## Decision 4: Markdown 0件は「警告付き成功」とする

- Decision: 対象 Markdown が 0 件でも空サイトを生成し、警告を必須表示する。
- Rationale: 実行の完了性を維持しつつ、利用者に状態を明示できる。
- Alternatives considered:
  - 失敗扱い: 問題の切り分けは容易だが、MVP の体験が厳格すぎる。
  - 無言成功: 利用者が気づきにくく運用上の誤認を招く。

## Decision 5: 終了コードは成功 0、失敗 非0、警告付き成功も 0

- Decision: CLI の終了コードは一般的慣例に従い、警告付き成功も 0 とする。
- Rationale: CI やシェル連携で判定が単純になり、スクリプト互換性が高い。
- Alternatives considered:
  - 警告時に専用コード: 表現力は上がるが利用者の判定負担が増える。
  - 常に 0: 自動化で失敗を検知できない。

## Decision 6: 主要ライブラリ構成

- Decision: commander（CLI）, fast-glob（探索）, markdown-it（変換）, fs-extra（出力操作）を採用する。
- Rationale: いずれも Node/TypeScript CLI で実績があり、MVP の機能要件を過不足なく満たせる。
- Alternatives considered:
  - 自前実装: 依存は減るがバグリスクと実装コストが高い。
  - 別系統ライブラリ: 可能だが現時点で優位性が小さい。
