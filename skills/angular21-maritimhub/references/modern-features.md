# Modern Feature Adoption — old pattern → new pattern

Lookup for the conversions a schematic can't fully do or that are conceptual rather than
mechanical. Adopt deliberately; match each to the project (see the judgment guidelines in
SKILL.md).

## Standalone + bootstrapApplication
Every component/directive/pipe `standalone` (default v19+); no `AppModule`. Providers move to
`bootstrapApplication(App, { providers: [provideRouter(routes), provideHttpClient()] })`. Enforce
with `"strictStandalone": true`. Move initializers to `provideAppInitializer`. Delete leftover
feature NgModules by hand after the schematic.

## Signals
- `signal()` / `computed()` / `effect()` (stable v20). Use signals for **simple, local, synchronous
  UI state** — loading/disabled flags, selected tab, panel open/closed — and `computed()` for view
  values derived from them. **Not** for HTTP results or multi-step async; those stay in RxJS (see
  "Signals for simple state; RxJS for async" in SKILL.md). This is also the mindset that later makes
  a zoneless move possible.
- **Signal inputs:** `name = input<string>()` / `input.required<T>()`, with `transform` (e.g.
  `booleanAttribute`) and `alias`. Reads become calls: `this.name()`.
- **`model()`** for two-way binding: `value = model<string>()` powers `[(value)]`.
- **Signal queries:** `viewChild()/viewChildren()/contentChild()/contentChildren()`.
- **`linkedSignal()`** (stable v20) replaces the "effect that writes another signal" anti-pattern
  (writable state derived from other signals).
- **`resource()` / `rxResource()` / `httpResource()`** — signal-based async with `value/status/
  error/isLoading` and auto-reload. **Experimental through v21 (API changes each minor)** — use for
  isolated new reads, never to replace a working `HttpClient`-returns-`Observable<T>` service layer.
- **`output()`** (stable v19) — `readonly done = output<T>()`; emit with `.emit()`. Signal-like but
  not itself a signal.

## Control flow + @defer + @let
- `@if (cond) { } @else { }`, `@for (item of items; track item.id) { } @empty { }`,
  `@switch (x) { @case (…) {} @default {} }`. **`track` is mandatory and must be invoked.**
- `@defer (on viewport; prefetch on idle) { } @placeholder { } @loading { } @error { }`
  (v21 adds `on viewport({ trigger, rootMargin })`). `@defer` also powers incremental hydration
  via `hydrate on <trigger>`.
- `@let total = price() * qty();` for template-local derived values.

## inject()
`private http = inject(HttpClient);` · `private x = inject(X, { optional: true });`. Pairs with
`DestroyRef` + `takeUntilDestroyed()` for subscription teardown. Watch subclass `super()` chains.

## Functional guards / resolvers / interceptors
Class-based guard/resolver *interfaces* were deprecated in v15.2.
- Guard: `export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn();`
- Resolver: `export const dataResolver: ResolveFn<Data> = () => inject(Api).load();`
- Wrap an existing class with `mapToCanActivate([Guard])` / `mapToResolve(Resolver)` if you can't
  rewrite it yet.
- Interceptors: `provideHttpClient(withInterceptors([authInterceptorFn]))` (`HttpInterceptorFn`);
  legacy class interceptors need `withInterceptorsFromDi()`. Migrate `HttpClientModule` →
  `provideHttpClient()`. (On v21 `HttpClient` is provided in root by default — drop
  `provideHttpClient()` unless customizing.)

## Render & lifecycle hooks
`afterNextRender()` (once after next render), `afterEveryRender()` (renamed from `afterRender` in
v20), `afterRenderEffect()`. Use these instead of reading DOM in an `effect()` (effect timing
changed in v19). `DestroyRef` + `takeUntilDestroyed()` for teardown.

## NgOptimizedImage
Import `NgOptimizedImage`; `<img ngSrc="…" width height priority>`. Not auto-migrated — apply to
LCP/above-the-fold images.

## SSR / hydration
`provideClientHydration(withEventReplay(), withIncrementalHydration())`; incremental hydration via
`@defer (…; hydrate on interaction)`; per-route render modes in `app.routes.server.ts`
(`RenderMode.Prerender|Server|Client`, `getPrerenderParams`).
