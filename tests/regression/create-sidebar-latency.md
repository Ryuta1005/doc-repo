# Create Sidebar Latency Measurement

## Goal

Verify SC-005: from create confirmation to tree reflect + auto-select completion is p95 <= 2 seconds.

## Environment

- Date:
- Operator:
- Node.js version:
- Browser:
- Root workspace:

## Measurement Procedure

1. Hover any tree node and click +.
2. Enter a valid filename and confirm create.
3. Measure t0 at confirm click.
4. Measure t1 when the tree reflects the new node and selection is moved to the created document.
5. Record delta = t1 - t0.

## Samples (10 runs)

| Run | Anchor node | Filename | Delta (ms) | Note |
| --- | ----------- | -------- | ---------- | ---- |
| 1   |             |          |            |      |
| 2   |             |          |            |      |
| 3   |             |          |            |      |
| 4   |             |          |            |      |
| 5   |             |          |            |      |
| 6   |             |          |            |      |
| 7   |             |          |            |      |
| 8   |             |          |            |      |
| 9   |             |          |            |      |
| 10  |             |          |            |      |

## Result

- p95 (ms):
- Pass/Fail:
- Follow-up:
