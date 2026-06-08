---
description: Generate optional manual test analysis and test cases for the current feature without blocking the main Speckit flow.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: Create or update manual test documents under `specs/<feature>/manual-tests/` for human-executable verification.

Important: This is an optional helper workflow. It must not be treated as a required step before `/speckit.tasks` or `/speckit.implement`.

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root once.
   - Parse `FEATURE_DIR` and `FEATURE_SPEC` from JSON.
   - If parsing fails, stop and ask the user to run `/speckit.specify` first.

2. Load artifacts from `FEATURE_DIR`:
   - Required: `spec.md`
   - Optional if present: `plan.md`, `tasks.md`, `quickstart.md`, `contracts/`

3. Ensure output directory exists:
   - `FEATURE_DIR/manual-tests/`

4. Create or update these files:
   - `FEATURE_DIR/manual-tests/test-analize.md`
   - `FEATURE_DIR/manual-tests/test-case.md`

5. Content rules:
   - Derive coverage from requirements, acceptance criteria, and success criteria.
   - Keep traceability to FR/SC items where possible.
   - Prefer realistic, end-to-end, human-observable checks.
   - Keep analysis/design (`test-analize.md`) separate from executable procedures (`test-case.md`).
   - Keep scope inside the target feature; do not add unrelated stories.
   - Use clear Japanese prose.
   - Commands must be executable as written.

6. Suggested sections:
   - `test-analize.md`: Purpose, Scope, Out of scope, Test viewpoints, Test type design, Traceability matrix, Entry conditions, Exit conditions, Risks and mitigations, Logging policy.
   - `test-case.md`: Pre-checks, Environment information, Pass/Fail criteria, Case list, Step-by-step procedures, Expected results, Result logging fields, Overall judgment.

7. Report:
   - Output paths of updated files.
   - State whether each file was created or updated.
   - Summarize traceability coverage and any remaining gaps.

## Behavior Rules

- Do not block or warn that tasks/implementation cannot continue without this workflow.
- If optional artifacts (`plan.md`, `tasks.md`, `quickstart.md`, `contracts/`) are missing, proceed with available context.
- If `spec.md` is missing, stop and ask the user to generate a feature spec first.
