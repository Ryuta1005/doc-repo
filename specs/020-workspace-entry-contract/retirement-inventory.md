# Static Generation Retirement Inventory (Task 020)

## Remove in 020

- CLI static entry path
  - `src/cli/index.ts`: default command (`[scopePath]`, `--open`) and `generateSite` direct call
  - `src/cli/index.test.ts`: static-entry related test cases
- Static rendering pipeline
  - `src/core/site/generateSite.ts`
  - `src/core/site/buildSiteBundle.ts`
  - `src/core/site/renderPages.ts`
  - `src/core/site/copyAssets.ts`
  - `src/core/site/atomicPublish.ts`
  - Related `*.test.ts` under `src/core/site/`
- Template assets
  - `templates/page.html`
  - `templates/styles.css`
  - `templates/app.js`
  - `package.json` `files` entry `templates`
- Static-generation-centric E2E tests
  - `tests/viewer-dom.e2e.test.ts`
  - `tests/image-serving.e2e.test.ts` (static generation assertions)

## Keep in 020

- Serve orchestration and boundary
  - `src/core/serve/runServe.ts`
  - `src/presentation/http/**`
  - `src/viewer/**`
- Markdown scan/parser and shared model
  - `src/core/scanner/**`
  - `src/core/parser/**`
  - `src/shared/**`
- Config/init and serve option resolution
  - `src/core/init/**`
  - `src/cli/serve/**`

## Follow-up edits required during deletion

- Replace static-entry CLI with serve-first contract in `src/cli/index.ts`
- Reclassify tests into:
  - deleted with static pipeline
  - retained as serve/API/workspace regression
- Update docs and package metadata to remove static-site promises
