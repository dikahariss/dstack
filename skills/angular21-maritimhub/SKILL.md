---
name: angular21-maritimhub
description: "Modernize an Angular codebase that has already been version-bumped from 18 to 21 (or any step along that path) so that NO modern-feature migration is missed. Use this whenever someone mentions upgrading, migrating, or modernizing Angular across v18/v19/v20/v21 — including standalone components, the new control flow (at-if/at-for/at-switch), signals (input/output/model/viewChild), inject(), zoneless change detection, removing NgModules, functional guards/interceptors, the Vitest move, Material 3 theming, or 'ng update passed but I think I am missing the new patterns.' Trigger even when the user only names ONE of these (e.g. 'convert my components to standalone' or 'should I go zoneless?'), since the right move is almost always to audit the whole codebase first and sequence the work. Also trigger for post-upgrade verification, deprecated-API audits, or 'ng test broke after I upgraded to Angular 20.'"
allowed-tools: Read Edit Bash Grep Glob
metadata:
  dstack:
    version: 0.2.0
    type: hybrid
    context_budget_tokens: 4500
  license: Apache-2.0
---

# Angular 21 Modernization

## What this skill is for

`ng update` bumps versions and runs a handful of automatic migrations, but it does **not**
adopt the modern patterns that the upgrade exists to enable. A green build hides a pile of
opt-in work: NgModules → standalone, `*ngIf/*ngFor` → `@if/@for`, constructor DI →
`inject()`, decorators → signal `input()/output()/viewChild()`, optional Zone.js removal,
Material 3 theming, the Vitest move, and several hand-only refactors that have **no
schematic at all**. This skill drives that remaining work to completion without missing
anything and without breaking a working app.

## How the work is split (read this first)

The skill deliberately separates two kinds of work, because they fail in different ways:

- **Deterministic (~30%, the scripts).** Computing facts and running schematics is
  mechanical and should be identical every time. Two scripts own this:
  - `scripts/audit.sh` — reports the environment/dependency state and a grep inventory of
    every legacy/deprecated API with counts and file locations. It makes **no judgments**.
  - `scripts/run_migration.sh` — runs **one** official schematic behind a build (and test)
    gate, then commits, so each step is isolated and revertible.
- **Semantic (~70%, you).** Everything that needs judgment: reading the audit and deciding
  what matters and in what order, fixing the fallout schematics leave behind, performing the
  hand-only refactors, judging zoneless/Vitest/Material-3 readiness, and knowing when to
  stop. The scripts hand you facts and a safe execution harness; the quality of the result
  is your reasoning on top of them.

Do not try to re-implement the scripts' mechanical scanning by hand, and do not let the
scripts make decisions they shouldn't. Keep the boundary.

## Workflow

### Step 0 — Orient

Confirm where the project actually is on the version path before doing anything. Run:

```bash
bash scripts/audit.sh /path/to/project
```

(Default path is the current directory. Add `--json` for a machine-readable version if you
want to gate logic on the numbers.) Then **read the report top to bottom** and form a plan.

### Step 1 — Triage the audit (semantic)

The report gives you three blocks: environment, build/change-detection wiring, and the
deprecated-API inventory. Reason about them in this priority:

1. **Correctness blockers first.** Version mismatch across `@angular/*` packages, a Node/TS
   version below what v21 requires, or a missing `provideZoneChangeDetection()` on an app
   that still uses Zone.js — these can produce subtle runtime/test breakage even with a
   green build. Resolve these before any modernization. See `references/breaking-changes.md`
   and `references/manual-workstreams.md`.
2. **Schematic-automatable items next.** Anything tagged `[schematic: …]` in the inventory
   is mechanical — sequence it in Step 2.
3. **`[MANUAL]` items last (but don't forget them).** These have no schematic and are the
   things most often missed. See `references/manual-workstreams.md`.

State your plan to the user as an ordered list before you start changing code. If the audit
shows a count of 0 across all schematic items, the codebase may already be modernized —
verify against `references/modern-features.md` rather than assuming.

### Step 2 — Run schematics in dependency order (deterministic harness, semantic fallout)

Run them **one at a time**, never batched, because debugging one isolated change is easy and
untangling five is not. Use the harness for each step:

```bash
bash scripts/run_migration.sh <migration-name> [args]
```

The canonical order, why it's ordered this way, and the per-migration limitations are in
**`references/migrations.md`** — read it before running. The short version:

```
standalone (run 3x: convert → remove-modules → bootstrap)
control-flow → cleanup-unused-imports → inject
signal-queries-migration → output-migration → signal-input-migration
route-lazy-loading → self-closing-tag
ngclass-to-class-migration / ngstyle-to-style-migration
common-to-standalone → router-testing-module-migration
```

When `run_migration.sh` exits non-zero, that is your cue to step in. The script tells you
which gate failed (schematic, build, or test). Common, expected fallout — `inject()`
breaking `super()` chains, signal-input references needing `()` calls, schematics not
touching spec files cleanly because tests aren't AoT — is documented per-migration in
`references/migrations.md`. Fix it by hand, build green, then commit and continue.

Operational notes for the harness: it requires a git repo and a clean tree (each green step
is auto-committed, so a bad migration is one `git revert` away). Preview any step without
writing with `DRY_RUN=1 bash scripts/run_migration.sh <name>`. The build gate always runs;
the **test gate is opt-in** (`RUN_TEST=1`) because a misconfigured `ng test` can hang — only
enable it once you know the suite runs headless and exits. A migration reporting "0
occurrences" in the audit can be skipped entirely.

### Step 3 — Hand-only refactors and large workstreams (fully semantic)

These never had a schematic, or are too project-specific for one. Work through
`references/manual-workstreams.md`, which covers: the `afterRender` → `afterEveryRender`
rename, `@angular/platform-browser-dynamic` → `@angular/platform-browser`, `ApplicationConfig`
import move, removed v21 APIs (`NgModuleFactory`, `moduleId`, `interpolation`), functional
guards/interceptors, `@angular/animations` → native CSS, and the three big optional
workstreams — **zoneless change detection**, **Karma/Jasmine → Vitest**, and **Material 3
theming** — each of which should be scoped and executed as its own effort, not rushed.

For the broader catalogue of old-pattern → new-pattern conversions (signals, `@defer`,
`@let`, `NgOptimizedImage`, SSR/hydration, `resource()`), use
`references/modern-features.md` as the lookup.

### Step 4 — Verify (deterministic re-check + semantic sign-off)

Re-run `scripts/audit.sh` and confirm the counts you intended to drive to zero are actually
zero. Then run the project's own gates the user already trusts — `ng build`, `ng test`, lint,
and E2E — and reason about anything that changed. The audit proves the _inventory_ is clean;
only the build/test/lint run proves _behavior_ is intact. Both are required.

## Judgment guidelines (the part that makes the result good, not just done)

- **Don't modernize for its own sake.** `inject()` and standalone are nearly always wins.
  But leave `provideAnimations()` in place if ng-zorro/PrimeNG/ngx-charts still need it, keep some
  routes eager on purpose, and don't migrate working reactive forms to experimental Signal
  Forms. Match the change to the project, not to a checklist.
- **Respect "experimental."** `resource()/httpResource()` and Signal Forms still change
  shape between minors as of v21. Recommend them for greenfield code, not wholesale
  rewrites of working code.
- **Zoneless is a project, not a flag.** Without `OnPush` + signals/`AsyncPipe`/
  `markForCheck`, flipping the provider makes components silently stop updating. Treat it as
  Step 3 work with its own staged plan, and only if the user wants it.
- **Third-party lag is the usual blocker.** Before bumping anything, check that Material/CDK,
  ng-zorro-antd, NgRx, and other libs publish for the target major; mismatched majors and lib peer-dep
  errors cause more pain than Angular's own changes.
- **Explain trade-offs, don't just apply diffs.** When a migration is conservative (signal
  inputs skip setters and control-flow-narrowed inputs) or risky (lazy-loading everything),
  surface the choice to the user instead of silently picking.

## Reference files

- `references/breaking-changes.md` — per-version (18→19, 19→20, 20→21) breaking changes,
  deprecations, removals, and the official Node/TypeScript/RxJS compatibility matrix.
- `references/migrations.md` — the official schematic catalogue: exact commands, ordered
  rationale, what each transforms, and the known limitations/fallout of each.
- `references/modern-features.md` — old-pattern → new-pattern lookup for every modern
  feature (standalone, signals, control flow, `@defer`, `inject()`, functional providers,
  SSR/hydration, `NgOptimizedImage`).
- `references/manual-workstreams.md` — the hand-only refactors (no schematic) plus the
  large optional workstreams: zoneless, Vitest, and Material 3 theming.
- `references/pwa-ssr-spa.md` — shipping one source as SPA + SSR + PWA: the dual-mode build,
  CommonEngine vs AngularNodeAppEngine, mandatory hydration (event replay, incremental), and the
  service-worker/manifest setup with its SSR caveats. The audit's DELIVERY MODES block maps to this.
