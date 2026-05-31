# Delivery modes: SPA · SSR · PWA (one source, three outputs)

A v21 app can ship as a client-only SPA, a server-rendered app (SSR/SSG), and an installable
PWA **from a single codebase**. These are orthogonal: SSR is a *build/serve* concern, PWA is a
*client runtime* concern, SPA is the baseline. The audit's "DELIVERY MODES" block reports which of
the three are wired. This file is the lookup for adopting each correctly and for the v21 features
worth turning on once they are.

## The dual-mode build pattern (SPA and SSR from one source)

The `@angular/build:application` builder makes SSR a **configuration toggle**, not a code fork:

```jsonc
// angular.json — one project, SSR added only in the "ssr" configuration
"configurations": {
  "production": { /* no ssr key → browser-only build → dist/<app>/browser */ },
  "ssr": { "ssr": { "entry": "server.ts" }, "server": "src/main.server.ts" }
}
```

- `ng build --configuration production` → `dist/<app>/browser/` → serve statically (nginx). The SPA.
- `ng build --configuration production,ssr` → also emits `dist/<app>/server/server.mjs` → run with
  Node. The SSR app. (When SSR is on, the browser entry HTML is `index.csr.html`, not `index.html` —
  a Node server reading the document file must look for `index.csr.html` first.)

Two Dockerfiles, one source: an nginx image copying `dist/<app>/browser`, and a node image running
`dist/<app>/server/server.mjs`. This is the supported way to keep SPA and SSR in lockstep — do not
duplicate the app to get two modes.

**SSR-safe code is the prerequisite for the SSR mode to not crash.** Any module that touches
`window`/`document`/`localStorage` at import time (Leaflet, Swiper, chart libs, PDF viewers) throws
`ReferenceError: window is not defined` during server render. Guard browser-only work with
`isPlatformBrowser(inject(PLATFORM_ID))` or `afterNextRender()`, and lazy-load (`@defer` or dynamic
`import()`) libraries that can't run on the server. A first-import globals shim is a last resort, not
the strategy.

## The server engine: CommonEngine vs AngularNodeAppEngine

- **`CommonEngine` from `@angular/ssr/node`** — the explicit engine: you call
  `commonEngine.render({ bootstrap, documentFilePath, url, publicPath, providers })` yourself. Still
  fully supported in v21. Good when you need custom logic around render (per-URL SSR cache, base-href
  rewriting, auth-aware bypass). NgModule apps (`bootstrap: AppServerModule`) use this.
- **`AngularNodeAppEngine` + `createNodeRequestHandler`** (newer, standalone-oriented) — the
  framework owns routing/render; you write a thin handler:

  ```typescript
  // server.ts
  import { AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse } from '@angular/ssr/node';
  import express from 'express';
  const app = express();
  const angularApp = new AngularNodeAppEngine();
  app.use('*', (req, res, next) =>
    angularApp.handle(req).then((r) => (r ? writeResponseToNodeResponse(r, res) : next())).catch(next));
  export const reqHandler = createNodeRequestHandler(app);
  ```

  Pairs with **per-route render modes** in `app.routes.server.ts` (stable in v20):

  ```typescript
  import { RenderMode, ServerRoute } from '@angular/ssr';
  export const serverRoutes: ServerRoute[] = [
    { path: 'about', renderMode: RenderMode.Prerender }, // SSG
    { path: 'profile', renderMode: RenderMode.Server },  // dynamic SSR
    { path: '**', renderMode: RenderMode.Server },
  ];
  ```

Migrating CommonEngine → AngularNodeAppEngine is an **enhancement, not a fix** — keep CommonEngine if
its custom render hooks are load-bearing. It is most worthwhile alongside a standalone bootstrap +
`outputMode: "server"` and route-level render modes.

## Hydration (mandatory whenever SSR is on)

SSR **without** `provideClientHydration()` is *destructive*: the client throws away the
server-rendered DOM and re-renders from scratch — flicker, layout shift, wasted CPU, worse LCP than
plain SPA. If the audit shows an SSR build but `provideClientHydration` = 0, that is a real defect,
not a missing nicety. Wire it (NgModule: in `app.module` providers; standalone: in `app.config`):

```typescript
provideClientHydration(
  withEventReplay(),          // replay clicks/inputs made before JS hydrated (stable v19)
  withIncrementalHydration(), // hydrate on interaction/viewport via @defer (stable v20)
)
```

- **`withEventReplay()`** — captures user events during the pre-hydration gap and replays them after.
  Cheap win for any SSR app.
- **`withIncrementalHydration()`** — requires SSR + full hydration; lets `@defer` blocks stay dormant
  (server HTML shown, JS not loaded) until a trigger: `@defer (hydrate on interaction) { … }`,
  `hydrate on viewport`, `hydrate on idle`. Enabling it auto-enables event replay, so
  `withEventReplay()` becomes redundant. This is the single biggest SSR TTI win in v20/21 — the
  page is interactive-where-needed without shipping all component JS upfront. Needs `@defer` blocks
  to act on.

## PWA (client runtime — independent of SPA vs SSR)

Angular's first-party PWA is `@angular/service-worker` + `ngsw-config.json` + a web manifest. Add it
with `ng add @angular/pwa` (installs the dep, registers the SW, adds `manifest.webmanifest` + theme
color + icons, scaffolds `ngsw-config.json`). Standalone registration:

```typescript
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000', // don't fight initial load
})
```

`ngsw-config.json` controls precache vs runtime cache. Typical shape: `assetGroups` with
`installMode: "prefetch"` for the app shell (index, JS/CSS) and `"lazy"` for fonts/images;
`dataGroups` with `freshness` (API, network-first + timeout) or `performance` (semi-static, cache-first
with maxAge) strategies. All paths start with `/`, relative to `dist/<app>/browser`.

### PWA + SSR: the caveats that actually bite

- The service worker caches **`/`** which under SSR is server-rendered HTML. After first load the SW
  may serve cached HTML and bypass SSR — fine for caching, but means SSR freshness and SW freshness
  must be reasoned about together (use `dataGroups` freshness for dynamic content).
- `ng add @angular/pwa` wires the SW into the **browser** build. Confirm the SW assets land in
  `dist/<app>/browser` so both the nginx (SPA) image and the node (SSR) image serve them.
- Keep `provideServiceWorker(..., { enabled: !isDevMode() })` so dev SSR isn't poisoned by a stale SW.
- A manifest `start_url`/`scope` must match the deployed base-href (e.g. an app served under `/site/`
  needs `scope: "/site/"`, `start_url: "/site/"`), or install/offline silently misbehaves.

## Other v21 features worth turning on (match to the app, don't checklist)

- **`@defer` everywhere heavy** — below-the-fold, charts, maps, editors. Pure win for initial bundle;
  also the substrate incremental hydration needs.
- **`NgOptimizedImage`** (`ngSrc` + `width`/`height`/`priority`) on LCP/above-the-fold images — large
  Core Web Vitals win, not auto-migrated.
- **Signals + `OnPush`** — the prerequisite for any future zoneless move; adopt incrementally.
- **`@let`** for template-local derived values; **functional guards/interceptors** (already idiomatic).
- **`httpResource()` / `resource()`** — signal-based async. Experimental through v21 (API shifts each
  minor) — greenfield only, not wholesale rewrites.
- **Zoneless** — only after `OnPush` + signals coverage; a staged project, see manual-workstreams B1.
