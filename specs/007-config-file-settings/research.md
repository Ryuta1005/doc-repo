# Research: 設定ファイルによる動作設定

## Decision 1: 設定解決は `serve` 専用関数から共通 resolver へ寄せる

- Decision: `findConfigPath`、JSON 読み込み、`rootDir` / `include` / `exclude` / `port` の検証を通常生成と `serve` が共有する設定解決ロジックにまとめる。
- Rationale: 既存実装は `resolveServeOptions.ts` に閉じており、`generateSite` が別経路で `detectRoot` を呼ぶため挙動が分岐している。共通 resolver に寄せることで Story 007 の中心要件である「同一設定解決結果の共有」を保証しやすい。
- Alternatives considered:
  - 通常生成側だけに設定読み込みを追加: 重複実装になり、Story 005/006 の挙動と将来差分が出やすい。
  - `serve` 側にだけ変換レイヤーを追加: 通常生成が置き去りになり要件未達。

## Decision 2: `rootDir` は設定ファイル相対で解決し、設定なし時だけ `.git` フォールバックする

- Decision: `rootDir` 指定時は設定ファイルの配置ディレクトリ基準で解決する。設定ファイルがあり `rootDir` が省略された場合はそのディレクトリ自体を `rootDir` とする。設定ファイルがない場合のみ `.git` 探索、さらに見つからなければ `cwd` を使う。
- Rationale: ユーザーの mental model を単純に保ちつつ、既存 `detectRoot` の後方互換も維持できる。
- Alternatives considered:
  - 常に `.git` 優先: 設定ファイルありでも意図した収集起点を上書きしてしまう。
  - `cwd` 基準で相対 `rootDir` を解決: サブディレクトリ実行時の挙動が不安定になる。

## Decision 3: `include` と `exclude` は fast-glob 契約に寄せ、watch でも同一解釈を使う

- Decision: `include` 未指定は `**/*.md`、`include: []` は対象ゼロ、`exclude` は既定除外へ追加し、`exclude` 優先で評価する。
- Decision: `include` 未指定および `include: []` はいずれも `**/*.md` を対象とし、`exclude` は既定除外へ追加し、`exclude` 優先で評価する。
- Rationale: 実装・動作確認の結果、`include: []` を「対象ゼロ」にする実用的な用途がなく、空配列の誤記入で全ファイルが収集されなくなるリスクの方が大きいと判断した。利用者が収集対象ゼロにしたい場合は、存在しないパターン（例 `["__never__"]`）を指定する。
- Alternatives considered:
  - `include: []` を対象ゼロとして扱う: 空配列の誤記入で収集がゼロになるリスクがある。動作確認の結果、不採用に変更した（2026-06-10）。
  - 利用者 `exclude` で既定除外を置換する: `.doc-repo` や `.git` を誤って再収集する危険がある。

## Decision 4: 出力先は `rootDir/.doc-repo` に固定する

- Decision: Story 007 の範囲では outputDir は設定可能にせず、常に解決済み `rootDir` 配下の `.doc-repo` を使う。
- Rationale: spec の Clarification と一致し、設定対象を増やしすぎずに実装を閉じられる。通常生成と `serve` の両方で出力先が一意になる。
- Alternatives considered:
  - 設定ファイル配置ディレクトリ基準の出力: 現 spec と不一致。
  - outputDir を追加設定化: Story 007 のスコープ外で、別 Story 相当の設計判断になる。

## Decision 5: バリデーションはフィールド名つきの利用者向け失敗として統一する

- Decision: JSON 構文エラー、`rootDir` 不在/非ディレクトリ、`include`/`exclude` 型不正、`port` 範囲外は、対象フィールドと理由を示す終了コード 1 の失敗へ統一する。
- Rationale: 設定ファイル導入時の主要 UX は「直しやすい失敗」であり、既存 `createServeError` と `toUserGuidance` の流れを拡張するのが自然。
- Alternatives considered:
  - 生の例外メッセージを表示: フィールド特定が弱く、CLI UX が悪化する。
  - 不正値を黙ってデフォルトへフォールバック: 設定ミスを発見しづらく危険。
