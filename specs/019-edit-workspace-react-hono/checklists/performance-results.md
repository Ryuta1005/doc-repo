# 019 Performance Measurement Results

## Environment

- measured at: 2026-06-13 20:40:25 JST
- baseline commit: `0329400`
- new implementation commit: working tree on `019-edit-workspace-react-hono`
- machine/environment: macOS Darwin 25.4.0 arm64, Node.js v24.15.0
- normal fixture: generated temporary fixture with `README.md` + 30 Markdown files
- large fixture: generated temporary fixture with `README.md` + 180 Markdown files
- baseline snapshot: `/private/tmp/doc-repo-baseline.RUU2WG`
- measurement note: baseline was expanded from `git archive 0329400`; dependencies were resolved through the current workspace `node_modules` symlink to avoid reinstalling packages

## SC-002 Markdown change reflection

- measurement target: time from appending to `README.md` until `[REGEN_SUCCEEDED] regenerate succeeded` appears
- warmup result: one unrecorded append/regenerate cycle completed before measurement
- baseline individual results: 313.9ms, 313.0ms, 313.3ms, 367.6ms, 312.0ms
- baseline median: 313.3ms
- new implementation individual results: 365.1ms, 362.6ms, 336.7ms, 336.5ms, 340.3ms
- new implementation median: 340.3ms
- difference: +8.6%
- decision: PASS, below 20% degradation gate
- user impact: Not applicable
- reason not fixed in 019: Not applicable
- approval: Not required

## SC-003 Document list API latency

- measurement target: `GET /api/documents`
- warmup result: one unrecorded request completed before measurement
- baseline individual results: N/A, this HTTP API did not exist in the Phase 2 baseline
- baseline median: N/A
- new implementation individual results: 2.1ms, 1.1ms, 1.2ms, 1.1ms, 1.0ms
- new implementation median: 1.1ms
- difference: N/A
- decision: PASS, current implementation is low-latency and covered by contract/regression tests; no baseline comparison is possible for a newly introduced API
- user impact: Not applicable
- reason not fixed in 019: Not applicable
- approval: Not required

## SC-003 Document detail API latency

- measurement target: `GET /api/document?path=docs%2Fdoc-001.md`
- warmup result: one unrecorded request completed before measurement
- baseline individual results: N/A, this HTTP API did not exist in the Phase 2 baseline
- baseline median: N/A
- new implementation individual results: 1.2ms, 1.3ms, 1.2ms, 1.5ms, 1.1ms
- new implementation median: 1.2ms
- difference: N/A
- decision: PASS, current implementation is low-latency and covered by contract/regression tests; no baseline comparison is possible for a newly introduced API
- user impact: Not applicable
- reason not fixed in 019: Not applicable
- approval: Not required

## SC-003 Viewer switch completion latency

- measurement target: fetch-and-render input equivalent, measured as document detail request completion for five document selections
- warmup result: document list/detail requests completed before measurement
- baseline individual results: N/A, React viewer/API-based switching did not exist in the Phase 2 baseline
- baseline median: N/A
- new implementation individual results: 0.9ms, 0.7ms, 0.7ms, 0.7ms, 0.7ms
- new implementation median: 0.7ms
- difference: N/A
- decision: PASS, current implementation is low-latency and covered by viewer regression tests; no baseline comparison is possible for newly introduced React switching
- user impact: Not applicable
- reason not fixed in 019: Not applicable
- approval: Not required

## SC-005 Large fixture major operations

- measurement target: static generation for fixture with `README.md` + 180 Markdown files
- warmup result: one normal fixture generation completed for baseline and new implementation before measurement
- baseline individual results: 227.3ms, 228.1ms, 221.2ms, 231.1ms, 229.4ms
- baseline median: 228.1ms
- new implementation individual results: 238.7ms, 232.6ms, 232.9ms, 248.5ms, 241.6ms
- new implementation median: 238.7ms
- difference: +4.6%
- decision: PASS, below 20% degradation gate
- user impact: Not applicable
- reason not fixed in 019: Not applicable
- approval: Not required
