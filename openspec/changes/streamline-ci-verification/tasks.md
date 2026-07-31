## 1. Verification Commands

- [ ] 1.1 Add JSCPD as an exact root devDependency, switch the `jscpd` script to its local binary,
      update `package-lock.json`, and verify the resolved package with `npm ls jscpd`.
- [ ] 1.2 Add `verify:fast` with ordered `fmt:check`, `lint`, and `tsc` checks, then add `verify` as
      `verify:fast` followed by `knip` and `jscpd`.
- [ ] 1.3 Confirm both verification scripts propagate a failing child exit code and do not invoke
      Vitest, Playwright E2E, or Next.js build commands.

## 2. Pre-commit Integration

- [ ] 2.1 Refactor `lefthook.yml` to keep staged Oxfmt with `stage_fixed: true`, then invoke
      `npm run verify:fast` as the only code-quality verification job.
- [ ] 2.2 Validate the resolved Lefthook configuration and confirm Knip, JSCPD, Vitest, Playwright
      E2E, and Next.js build are absent from the pre-commit command graph.

## 3. GitLab CI Topology

- [ ] 3.1 Add one verification include with a shared Node.js 24/npm template using `npm ci`, `.npm`
      cache, and a cache key derived from `package-lock.json`.
- [ ] 3.2 Add a `codequality` job that runs `npm run verify` and a following `test` job that runs
      only `npm run test`.
- [ ] 3.3 Provision and cache the Chromium prerequisites required by the existing Vitest component
      provider without adding `playwright test`, `test:e2e`, or a Next.js server command.
- [ ] 3.4 Replace the root `build` stage/include with ordered `codequality`, `test`, and `deploy`
      stages, preserve the deploy include, and remove `.gitlab/build.yaml` plus its `.next` artifacts.
- [ ] 3.5 Audit repository and local CI includes for dependencies on the removed `typecheck`/`build`
      jobs or `.next` artifacts, and document any external GitLab project-level dependency that cannot
      be inspected locally.

## 4. Documentation

- [ ] 4.1 Document `npm run verify` and `npm run verify:fast`, their intended CI/pre-commit usage,
      and the fact that the CI test stage runs Vitest but not standalone Playwright E2E.
- [ ] 4.2 Remove or update documentation that still describes typecheck/build as the current GitLab
      CI gates without changing unrelated build and deployment instructions.

## 5. Verification

- [ ] 5.1 Format only changed manifests, YAML, Markdown, and lockfile-supported files with Oxfmt,
      then review the diff for unrelated working-tree changes.
- [ ] 5.2 Run fresh `npm run verify:fast` and `npm run verify`, resolving only failures introduced
      by this change.
- [ ] 5.3 Run fresh `npm run test` with the CI-equivalent Chromium prerequisites and confirm both
      Vitest projects execute without starting a Next.js server or Playwright E2E runner.
- [ ] 5.4 Validate the merged GitLab CI configuration with GitLab CI lint when available; otherwise
      perform a local structural check of stages, includes, jobs, cache, and forbidden commands.
- [ ] 5.5 Run `openspec validate streamline-ci-verification --type change --strict --no-interactive`
      and confirm every repository-verification scenario is covered by the implemented configuration
      or a verification command.
