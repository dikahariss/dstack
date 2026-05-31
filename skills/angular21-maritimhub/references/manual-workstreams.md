# Manual Refactors & Large Workstreams (no schematic — judgment required)

These are the items most often missed because `ng update` and the schematics never touch them.
Split into (A) quick hand-only fixes and (B) three large optional workstreams to scope separately.

---

## A. Quick hand-only fixes

- **`afterRender` → `afterEveryRender`** (renamed v20, no alias, no migration). Find-and-replace,
  then verify each call still wants "every render" vs `afterNextRender` (once).
- **`@angular/platform-browser-dynamic` → `@angular/platform-browser`** (deprecated v20, **no
  schematic**). Update imports; remove `platformBrowserDynamic()` bootstrap if you've moved to
  `bootstrapApplication`. Drop the dependency.
- **`ApplicationConfig` import** — removed from `@angular/platform-browser` in v21. Import from
  `@angular/core`.
- **Removed v21 APIs** — `NgModuleFactory` (use `NgModule`), `moduleId` in `@Component` (delete),
  `interpolation` option (only `{{ }}`), `UpgradeAdapter` (use `upgrade/static`),
  `ngModuleFactory` input of `NgComponentOutlet`.
- **`DOCUMENT`** now imports from `@angular/core` (auto in v20, but verify stragglers).
- **`InjectFlags` → options object**; **`TestBed.get` → `TestBed.inject`**; **`TestBed.flushEffects`
  → `TestBed.tick`** (auto in v20, but check hand-written variants).
- **`ng-reflect-*` selectors** (removed v20) — migrate E2E/test selectors to `data-test-id`. As a
  temporary bridge, `provideNgReflectAttributes()`.
- **`allowSignalWrites`** — remove the option (unnecessary since v19).
- **`typeCheckHostBindings`** (on by default in v21) surfaces latent errors in `host` /
  `@HostBinding` / `@HostListener` — fix the types, or opt out with `"typeCheckHostBindings": false`
  while you do.
- **`provideZoneChangeDetection()`** — confirm it exists on an app that still uses Zone.js
  (the v21 `ng update` migration adds it; the audit flags its absence).
- **Class-based guards/resolvers** — a class named `FooGuard`/`FooResolver` with a `canActivate()` /
  `resolve()` method (even without `implements CanActivate`) is the legacy style. Convert to a
  functional `CanActivateFn`/`ResolveFn` with `inject()`, or wrap temporarily with
  `mapToCanActivate([FooGuard])`. The audit catches these via `export class …Guard`.

---

## B. Large optional workstreams

Each deserves its own branch, scope, and sign-off — don't fold them into the schematic pass.

### B1. Zoneless change detection
Stable v20.2; default for new v21 apps. **Your existing app keeps Zone.js until you opt out.**
Zoneless is a project, not a flag: without `OnPush` + signals / `AsyncPipe` / `markForCheck`,
components silently stop updating. Staged path:

1. Convert components to **`OnPush`** — this surfaces everywhere the app relies on Zone.js.
2. Probe zoneless in **dev only**: `…(isDevMode() ? [provideZonelessChangeDetection()] : [])`.
3. Flip tests to `provideZonelessChangeDetection()` + `await fixture.whenStable()`; avoid
   `detectChanges()` (especially repeated calls).
4. Replace `provideZoneChangeDetection({ eventCoalescing: true })` with
   `provideZonelessChangeDetection()`.
5. Remove `zone.js` / `zone.js/testing` from `angular.json` polyfills (build **and** test),
   `import 'zone.js'` from `polyfills.ts`, and `zone.js/node` from server polyfills (forgetting the
   last one gives SSR `Zone is not defined`). Then `npm uninstall zone.js`.

Replace `NgZone.onMicrotaskEmpty/onStable/onUnstable` (they never emit when zoneless; `isStable`
is always true) with `afterNextRender`/`afterEveryRender`/`MutationObserver`. Reverting = restore
`import 'zone.js'` + drop the provider. The Angular MCP `onpush_zoneless_migration` tool produces a
project-specific plan if available (`ng mcp`).

### B2. Karma/Jasmine → Vitest
Karma deprecated (2023) but still supported; **Vitest is the v21 default** (`@angular/build:
unit-test`). Protractor is EOL — move E2E to Playwright/Cypress (`ng e2e` offers Playwright).

- **First, fix the v20 `ng test` breakage:** the builder switch to `@angular/build` drops the Karma
  plugin. Either reinstall the Karma builder or move to Vitest. (This is why `ng test` "suddenly
  broke" after the version bump.)
- Switch the test builder, then `ng generate refactor-jasmine-vitest` (`--add-imports`,
  `--file-suffix`, `--include`, `--browser-mode`). Replace `jasmine` types with `vitest/globals` in
  `tsconfig.spec.json`. Install `vitest` + `jsdom` (or `@vitest/browser` + Playwright/WebdriverIO).
- **`fakeAsync`/`tick` must be rewritten** — they rely on Zone.js-patched Jasmine and have no Vitest
  equivalent. Rewrite to `await fixture.whenStable()`; the migration leaves TODOs. Avoid multiple
  `detectChanges()` calls.

### B3. Material 3 theming
Update Material/CDK in lockstep with core: `ng update @angular/material@<v> @angular/cdk@<v>`. The
big manual work is at the **v18→v19 Material 3 switch** (real SCSS rework, not cosmetic):

- `mat.define-theme()` + `$theme` → `@include mat.theme(...)`.
- `--sys-*` → `--mat-sys-*`; renamed `*-overrides` properties; rework `mat.get-theme-color()`.
- v20 renamed component tokens (e.g. `--mdc-outlined-card-container-shape` →
  `--mat-card-outlined-container-shape`) and button directives. The `ng update` CSS-variable
  migration has **known gaps — audit your theme SCSS by hand** after running it.
- **`@angular/aria`** (v21 dev preview) — headless accessible primitives (`npm i @angular/aria`),
  for unstyled components where you control the markup.

### B4. Manual subscription teardown → `takeUntilDestroyed`
The `destroy$ = new Subject<void>()` + `takeUntil(this.destroy$)` + `ngOnDestroy() { destroy$.next();
destroy$.complete(); }` pattern (and bare `.unsubscribe()`) is the pre-signals teardown idiom — **no
schematic.** Replace with `takeUntilDestroyed()`: in a field initializer it needs no argument;
elsewhere pass `inject(DestroyRef)`. Where the value is only consumed in the template, prefer the
`async` pipe or `toSignal()` and drop the manual subscription. Sequence this **after** the `inject`
migration so `DestroyRef` resolves cleanly, and work module-by-module — on a large app this is
thousands of call sites, not one pass. The audit's "Manual RxJS teardown" count is the worklist; the
ADOPTION block's `takeUntilDestroyed()` count is your progress.

---

## C. `@angular/animations` → native CSS
The package + `provideAnimations()` / `provideAnimationsAsync()` / `BrowserAnimationsModule` are
**deprecated (v20.2), removal targeted v23** (~60 KB, CPU-bound). New approach:

- CSS classes: `animate.enter="slide-in"` / `animate.leave="fade-out"`; `@starting-style` for enter.
- JS hook: `(animate.leave)="onLeave($event)"` then `$event.animationComplete()` (GSAP / WAAPI).

**Gotcha:** ng-zorro-antd, PrimeNG, ngx-charts and similar still require `provideAnimations()` /
`BrowserAnimationsModule` and throw `NG05105`
if you remove it. **Keep it until those libraries migrate.** This is the canonical "don't modernize
for its own sake" case.

---

## D. Ecosystem compatibility notes
- **ng-zorro-antd** — keep its major in lockstep with Angular (`ng update ng-zorro-antd@<v>`). It
  **depends on `@angular/animations`** (`BrowserAnimationsModule` / `provideAnimations()`): removing
  animations throws `NG05105`, so keep them until ng-zorro drops the dependency. Components pull in
  `Nz*Module`s (frequently via a `shared/imports` barrel) — when going standalone, import the
  `Nz*Module`/standalone entry per component and let `cleanup-unused-imports` prune the barrel
  (review its edits; barrels defeat static usage analysis). Its i18n is wired via `NZ_I18N`.
- **Material/CDK** — lockstep with the core major (`@angular/material@21 @angular/cdk@21`).
- **NgRx** — 1:1 with the Angular major. Update together: `ng update @ngrx/store @ngrx/effects
  @ngrx/signals @ngrx/component @ngrx/entity @ngrx/router-store @ngrx/schematics
  @ngrx/eslint-plugin`. **Regression 19→20:** `signalState`/`withState` now requires explicit init
  of optional props (`optionalProp: undefined`). SignalStore (`withProps`, `signalMethod`,
  `rxMethod`, Events plugin) is the recommended local-state path.
- **RxJS** — no change required across the whole 18→21 path; stay 7.4+ (7.8.x typical).
- **Any lib not yet published for the target major** throws peer-dep errors — check first; use
  `--force` only after a deliberate review.
