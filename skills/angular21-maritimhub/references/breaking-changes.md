# Breaking Changes, Deprecations & Removals (18 → 19 → 20 → 21)

Legend: **BREAKING** = can fail build/test/runtime · **DEPRECATED** = still works, migrate it
· **REMOVED** = gone. "auto" = handled by `ng update` during the version bump.

## Table of contents
1. Angular 18 → 19
2. Angular 19 → 20
3. Angular 20 → 21
4. Compatibility matrix (Node / TypeScript / RxJS)

---

## 1. Angular 18 → 19 (Nov 2024)

**Environment:** TypeScript 5.5+ (5.4 dropped). Node `^18.19.1 || ^20.11.1 || ^22.0.0`.

- **`standalone: true` becomes the default.** auto-migration adds `standalone: false` to every
  NgModule-declared class.
- New compiler diagnostic **`unusedStandaloneImports`** — can surface as build warnings/errors.
- Optional `strictStandalone` flag to forbid non-standalone classes.
- **`effect()` timing changed (BREAKING behavior):** component effects now run *during* change
  detection, just before their owning component is checked, not *after* as a microtask. Effects
  reading DOM layout (e.g. `.offsetWidth`) from a view-query result can throw — use
  `afterRenderEffect` instead. `allowSignalWrites` became unnecessary (deprecated).
- `APP_INITIALIZER` / `ENVIRONMENT_INITIALIZER` / `PLATFORM_INITIALIZER` **deprecated** →
  `provideAppInitializer` / `provideEnvironmentInitializer` / `providePlatformInitializer` (auto).
- `ExperimentalPendingTasks` → `PendingTasks`, stabilized (auto).
- **Signals stabilized (safe to adopt):** `input()`, `output()`, `model()`, `viewChild()`,
  `viewChildren()`, `contentChild()`, `contentChildren()`, `takeUntilDestroyed()`,
  `outputFromObservable()`, `outputToObservable()`, `@let`. Dev-preview: `linkedSignal()`,
  `resource()`, `rxResource()`; `effect`/`toSignal`/`toObservable` still dev preview.
- **Router/SSR:** `ROUTER_OUTLET_DATA`; **Event Replay stable** (`withEventReplay()`);
  incremental hydration dev preview; hybrid rendering / per-route render mode dev preview
  (`app.routes.server.ts`) — can throw a build error for parameterized prerendered routes
  missing `getPrerenderParams`.

---

## 2. Angular 19 → 20 (May 2025) — the hard environment cliff

**Environment (BREAKING):** **TypeScript 5.8 required**; **Node 18 dropped**
(`^20.19.0 || ^22.12.0 || ^24.0.0`); new **Baseline** browser support (custom `browserslist`
with old targets warns).

**Removals (BREAKING):**
- View Engine remnants gone — **Ivy only**.
- `TestBed.get()` removed → `TestBed.inject()` (auto).
- `InjectFlags` enum removed → options object (auto).
- **`ng-reflect-*` no longer emitted in dev** — breaks E2E/test selectors. Temporary
  `provideNgReflectAttributes()`, better: move to `data-test-id`.
- `effect()` `forceRoot` and `toSignal()` `rejectErrors` removed.

**Deprecations:**
- **`*ngIf` / `*ngFor` / `*ngSwitch` officially deprecated** (likely removed v22) — control-flow
  migration offered during `ng update`.
- **`@angular/platform-browser-dynamic` deprecated** → `@angular/platform-browser`. **No
  schematic — manual import change.**
- `@angular/platform-server/testing` deprecated.
- HammerJS integration deprecated (still present in v21).
- `DOCUMENT` moved `@angular/common` → `@angular/core` (auto).
- `fixture.autoDetectChanges(false)` deprecated (throws in zoneless tests);
  `TestBed.flushEffects()` → `TestBed.tick()`.

**Signals stabilized:** `effect()`, `toSignal()`, `toObservable()`, `afterRenderEffect()`,
`afterNextRender()`, `linkedSignal()`, `PendingTasks`. **`afterRender()` renamed
`afterEveryRender()` — no alias, no migration, rename by hand.** `resource()`/`httpResource()`
stayed experimental with API changes (`query`→`params`, rx `loader`→`stream`, `httpResource`
`map`→`parse`). **Zoneless → developer preview**:
`provideExperimentalZonelessChangeDetection` → `provideZonelessChangeDetection`;
`--experimental-zoneless` → `--zoneless`.

**Compiler/templates (new errors possible):** host-binding type checking
(`typeCheckHostBindings`, opt-in here); diagnostics `missingStructuralDirective` (NG8116),
`uninvokedTrackFunction` (NG8115), `unparenthesizedNullishCoalescing` (NG8114); new template
ops (`**`, tagged template literals, `void`, `in`, `typeof`).

**Build/CLI/SSR (BREAKING for tooling):** **new projects use `@angular/build` instead of
`@angular-devkit/build-angular`** (auto-migrates `angular.json`) — this is the **#1 cause of
`ng test` breaking after v20** (the Karma plugin gets dropped). Build builder →
`@angular/build:application` (output path is now an object). 2025 style guide / new file naming
(`user.ts`/`User`) with an auto-migration that keeps old naming. Solution-style `tsconfig`,
`module: "preserve"`. Vitest via `@angular/build:unit-test` (experimental here). SSR:
`provideServerRendering(withRoutes(...))` consolidation into `@angular/ssr` (auto); Express v5.

---

## 3. Angular 20 → 21 (Nov 2025) — the latest

**Environment (BREAKING):** **TypeScript `>=5.9.0 <6.0.0`** (5.8 and below dropped). **Node range
unchanged** `^20.19.0 || ^22.12.0 || ^24.0.0`. RxJS `^6.5.3 || ^7.4.0`.

**Removals (BREAKING, from the official 21.0.0 notes):**
- **`NgModuleFactory` removed.**
- **`moduleId` removed** from `@Component`.
- **`interpolation` component option removed** — only `{{ }}` supported.
- **`ApplicationConfig` export removed from `@angular/platform-browser`** — import from
  `@angular/core`.
- **`UpgradeAdapter` removed** from `@angular/upgrade` (use `upgrade/static`).
- **`ngModuleFactory` input of `NgComponentOutlet` removed**; `ngComponentOutletContent` retyped
  to `Node[][] | undefined`.
- `ignoreChangesOutsideZone` removed; compiler now errors on `emitDeclarationOnly`; zone.js drops
  IE / non-Chromium Edge.

**Zoneless (BREAKING for some apps):** new apps zoneless by default. **Existing apps: Angular no
longer provides a Zone.js scheduler by default — you must have `provideZoneChangeDetection()`,
which an automated migration adds during `ng update`.** Verify it is present (the audit checks
this). TestBed now rethrows errors (`rethrowApplicationErrors: false` to revert).

**SSR bootstrapping (BREAKING):** `bootstrapApplication(App, config, context: BootstrapContext)`;
schematic updates `main.server.ts`; `getPlatform()` returns `null`, `destroyPlatform()` no-op on
server.

**Other breaking items:** **`typeCheckHostBindings` on by default** (latent host-binding type
errors surface; opt out with `"typeCheckHostBindings": false`); router `lastSuccessfulNavigation`
is now a **signal** (invoke it); navigations may take extra microtasks (await in tests);
`FormArrayDirective` may conflict with an existing `formArray`; TestBed uses a fake
`PlatformLocation` (revert with `MockPlatformLocation`).

**Deprecations:** `HttpResponseBase.statusText`; experimental `web-test-runner`/`jest` builders
(removed v22); **`@angular/animations`** (since v20.2, removal targeted v23).

**New defaults/features:** **`HttpClient` provided in root by default** (drop
`provideHttpClient()` unless customizing); **Vitest is the default test runner**;
`SimpleChanges<T>` generic; `@angular/aria` (dev preview); Signal Forms (experimental);
Angular MCP server (`ng mcp`). v21.2 adds template arrow functions.

---

## 4. Compatibility matrix (official — angular.dev/reference/versions)

| Angular | Node.js | TypeScript | RxJS |
|---|---|---|---|
| **21.0.x** | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.9.0 <6.0.0` | `^6.5.3 \|\| ^7.4.0` |
| **20.2 / 20.3** | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.8.0 <6.0.0` | `^6.5.3 \|\| ^7.4.0` |
| **20.0 / 20.1** | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.8.0 <5.9.0` | `^6.5.3 \|\| ^7.4.0` |
| **19.2** | `^18.19.1 \|\| ^20.11.1 \|\| ^22.0.0` | `>=5.5.0 <5.9.0` | `^6.5.3 \|\| ^7.4.0` |
| **19.0 / 19.1** | `^18.19.1 \|\| ^20.11.1 \|\| ^22.0.0` | `>=5.5.0 <5.8.0` | `^6.5.3 \|\| ^7.4.0` |
| **18.x (ref)** | `^18.19.1 \|\| ^20.11.1 \|\| ^22.0.0` | `>=5.4.0 <5.6.0` | `^6.5.3 \|\| ^7.4.0` |

**Takeaways:** the hard environment cliff is **19→20** (Node 18 dropped, TS→5.8). **20→21** keeps
the Node range but needs **TS ≥5.9**. **RxJS never forces a change** across this whole path.
Angular certifies only even-numbered LTS Node releases. Zone.js (`0.15.x`) can stay until you go
zoneless.
