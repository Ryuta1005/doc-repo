---
name: speckit.manual-tests
description: Optional Speckit workflow for creating manual test analysis and test case documents under specs/<feature>/checklists/manual-tests/ from the current feature artifacts.
---

# Speckit Manual Tests

Use this skill when a feature needs human-executable verification artifacts.

## Purpose

Generate and maintain manual test documents for a feature:

- `specs/<feature>/checklists/manual-tests/test-analize.md`
- `specs/<feature>/checklists/manual-tests/test-case.md`

This skill is optional. It does not change the main Speckit flow and should be used only when manual verification artifacts are desired.

## Input Artifacts

Read the feature's current artifacts before writing manual tests:

- `specs/<feature>/spec.md`
- `specs/<feature>/plan.md`
- `specs/<feature>/tasks.md`
- `specs/<feature>/quickstart.md`
- `specs/<feature>/contracts/`

## Output Artifacts

Create or update the following files:

- `specs/<feature>/checklists/manual-tests/test-analize.md`
- `specs/<feature>/checklists/manual-tests/test-case.md`

## Required Behavior

1. Derive manual test coverage from the feature's acceptance conditions, requirements, and success criteria.
2. Keep the manual tests traceable to the feature's FR/SC items.
3. Prefer end-to-end, human-observable verification steps.
4. Separate analysis/design from executable test steps.
5. Keep the scope within the feature's spec. Do not invent unrelated behavior.

## Recommended Structure

### `test-analize.md`

- Purpose
- Scope
- Out of scope
- Test viewpoints
- Test type design
- Traceability matrix
- Entry conditions
- Exit conditions
- Risks and mitigations
- Logging policy

### `test-case.md`

- Pre-checks
- Environment information
- Pass/Fail criteria
- Case list
- Step-by-step procedures for each case
- Expected results
- Result logging fields
- Overall judgment

## Style Guidance

- Use clear Japanese prose.
- Make commands executable as written.
- Include restoration steps for temporary changes.
- Avoid ambiguous words like "退避" without an explicit example.
- If a requirement belongs to another story, do not force it into the current feature's manual tests.

## Completion Criteria

The manual test set is complete when:

- Every important FR/SC has at least one traceable manual test.
- The human can execute the case list without guessing missing steps.
- The documents are consistent with the current spec, plan, and tasks.
