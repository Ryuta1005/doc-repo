# Serve Image Assets Test Fixture

This fixture contains test cases for relative image reference handling in serve mode.

## Test Case 1: Local Relative Image

The image below should reference a local asset:

![doc-repo screenshot placeholder](./docs/assets/screenshot-sample.png)

## Test Case 2: External URL (should not copy)

This external image should remain unchanged:

![External Image](https://example.com/external.png)

## Test Case 3: Hash Reference (should not copy)

This is a link to an anchor:

[Anchor Link](#intro)

## Test Case 4: Subdirectory Relative Image

![nested asset](../../docs/assets/screenshot-sample.png)

---

## Notes

- Relative images like `./docs/assets/screenshot-sample.png` should be served from `/assets/docs/assets/screenshot-sample.png`
- External URLs should remain unchanged
- Hash references should remain unchanged
- Out-of-bounds relative paths like `/../../../etc/passwd` should be ignored
