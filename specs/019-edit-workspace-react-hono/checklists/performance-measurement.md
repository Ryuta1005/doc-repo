# 019 Performance Measurement Plan

## Baseline Target

- baseline commit: 記録対象
- new implementation commit: 記録対象
- machine/environment: 記録対象
- fixture: 記録対象

## Measurement Targets

- Markdown change reflection (SC-002)
- Document list API latency (SC-003)
- Document detail API latency (SC-003)
- Viewer switch completion latency (SC-003)
- Large fixture major operations (SC-005)

## Procedure

1. 同一マシン・同一fixture・同一コマンドで baseline/new を実施する。
2. 各ターゲットをウォームアップ 1 回実行する。
3. 各ターゲットを本計測 5 回実行する。
4. 個別値と中央値を記録する。
5. baseline 比較で差分率を算出する。
6. Phase 2 baseline に存在しない新規 API / React 操作は baseline を N/A とし、current の測定値と判定理由を記録する。
7. 悪化率 20% 以上項目は user impact / reason not fixed in 019 / approval を追記する。

## Required Fields

- baseline commit
- new implementation commit
- machine/environment
- fixture
- measurement target
- warmup result
- individual results
- median
- difference
- decision

## Additional Required Fields for >=20% Degradation

- user impact
- reason not fixed in 019
- approval
