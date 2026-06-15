# Phase 2 Baseline Regression Plan (Task 019)

## Purpose

Fix the baseline user experience before refactoring to React + Hono.

## Regression Targets

- `doc-repo serve` startup
- Left tree rendering
- Document selection and body rendering
- Relative image/static asset rendering
- Markdown change reflection
- File add/unlink reflection
- Browser auto-reload behavior
- Static generation via `doc-repo [scopePath]`
- Offline viewing of generated output

## Execution Notes

- Record baseline/new implementation commit hashes with each run.
- Keep fixture, machine, and command options identical.
- Prefer event-based completion checks over fixed sleep.
