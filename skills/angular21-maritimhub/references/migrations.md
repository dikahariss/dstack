# Official Migration Schematics

Canonical index: **angular.dev/reference/migrations**. Every command below is
`ng generate @angular/core:<name>`. Run them through `scripts/run_migration.sh <name>` so each
is isolated behind a build/test/commit gate.

## Why the order matters

The order is a dependency chain, not a preference:

1. **Standalone first** — almost everything else assumes standalone components. Signal/inject
   migrations and lazy-route migration behave best on standalone code.
2. **Control flow before cleanup** — converting `*ngIf/*ngFor` to `@if/@for` removes the need for
   `NgIf`/`NgFor` imports, which `cleanup-unused-imports` then strips. Reversing this order leaves
   dead imports.
3. **inject() before signal migrations** — `inject()` reshapes the constructor; running it first
   means the signal migrations operate on the final DI shape.
4. **Queries → outputs → inputs** — trivial → safe → most complex. Inputs are last because they're
   the most likely to need manual fixes (template refs become `()` calls).
5. **Structural/template cleanups last** — self-closing tags, ngclass/ngstyle, common-to-standalone
   are cosmetic and safe once the structure is settled.

```
standalone            (run 3x: convert → remove-modules → bootstrap, build between each)
control-flow
cleanup-unused-imports
inject
signal-queries-migration
output-migration
signal-input-migration
route-lazy-loading
self-closing-tag
ngclass-to-class-migration  /  ngstyle-to-style-migration
common-to-standalone
router-testing-module-migration
```

Skip any migration whose audit count is 0.

## What each transforms

| Migration | Old → New |
|---|---|
| `standalone` | removes `standalone:false`, deletes NgModules, generates `bootstrapApplication()` |
| `control-flow` | `*ngIf`→`@if`, `*ngFor`→`@for (…; track …)`, `*ngSwitch`→`@switch` |
| `cleanup-unused-imports` | removes unused symbols from `imports: [...]` |
| `inject` | `constructor(private s: S)` → `private s = inject(S)` |
| `signal-queries-migration` | `@ViewChild('r') ref` → `ref = viewChild('r')` |
| `output-migration` | `@Output() x = new EventEmitter()` → `readonly x = output()` |
| `signal-input-migration` | `@Input() name?: string` → `name = input<string>()`; refs → `name()` |
| `route-lazy-loading` | `component: Home` → `loadComponent: () => import('./home').then(m => m.Home)` |
| `self-closing-tag` | `<cmp></cmp>` → `<cmp />` |
| `ngclass-to-class-migration` | `[ngClass]="{active:x}"` → `[class.active]="x"` |
| `ngstyle-to-style-migration` | `[ngStyle]` → `[style.*]` |
| `common-to-standalone` | `CommonModule` → only the directives/pipes actually used |
| `router-testing-module-migration` | `RouterTestingModule` → `RouterModule` + `provideLocationMocks()` |

**Combined signals schematic:** `ng generate @angular/core:signals` runs inputs+outputs+queries
interactively; e.g. `… --migrations=outputs --defaults`. Migrations are also available as VS Code
lightbulb refactors on individual fields.

## Per-migration limitations & expected fallout (where your judgment goes)

- **`standalone` must run three times in order**, building between each: (1) convert components,
  (2) remove unnecessary NgModules, (3) bootstrap with standalone APIs. It needs Angular ≥15.2 and
  a zero-error compile. It can't remove every feature NgModule (delete leftovers by hand) and won't
  perfectly fix spec-file imports because tests aren't AoT — expect manual test cleanup. Lazy routes
  that load an NgModule (`loadChildren: () => import('./x').then(m => m.XModule)`) are **not**
  auto-converted — after deleting the feature module, repoint `loadChildren` to the exported route
  array (or `loadComponent`) by hand.
- **`control-flow`** — `track` is mandatory and must be invoked; the migration picks `$index` or an
  identity by default. Review `track` choices for `@for` over object lists (prefer a stable id).
- **`cleanup-unused-imports`** can OOM on large projects — run per-folder with `--path`, or raise
  `--max-old-space-size`. Doesn't work on library configs. Re-export **barrel files** (e.g.
  `shared/imports/index.ts` bundling `CommonModule` + UI modules) defeat its static usage analysis —
  review what it keeps or drops in barrels by hand.
- **`inject`** — options: `--migrate-abstract-classes`, `--backwards-compatible-constructors`,
  `--non-nullable-types`. Watch `super(inject(X))` chains in subclasses and tests that `new` a
  component directly (they lose their injection context).
- **`signal-input-migration`** is conservative: it skips setter inputs and inputs narrowed inside
  `@if`. Re-run with `--insert-todos`, then `--best-effort-mode`, expecting hand-fixes. Every
  template/TS reference to the input becomes a call: `name` → `name()`.
- **`output-migration`** skips outputs used with `.pipe()`; rewrites `.next()`→`.emit()` and drops
  `.complete()`.
- **`route-lazy-loading`** only migrates **standalone + eagerly-loaded** routes and will lazy-load
  *everything* by default — pass `--path src/app/<feature>` to be selective and keep
  above-the-fold routes eager on purpose.

**Universal limitations:** schematics need a cleanly-compiling project and files covered by a
`tsconfig`; they use static analysis (custom DI/API wrappers go unrecognized); spec files aren't
AoT so injected imports may be imperfect; output may not match your formatter — run Prettier/
ESLint `--fix` after (v21 schematics auto-format changed files).
