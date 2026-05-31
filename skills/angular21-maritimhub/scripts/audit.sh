#!/usr/bin/env bash
#
# audit.sh — Deterministic post-upgrade audit for Angular 18 -> 21 modernization.
#
# This is the "mechanical 30%": it makes NO judgments. It only reports facts that
# are always computed the same way — environment versions, dependency alignment,
# build configuration, and a grep-based inventory of deprecated/legacy API usage.
# Claude reads this report and applies judgment (the "semantic 70%"): which findings
# matter, in what order, and how to fix the ones with no schematic.
#
# Usage:
#   bash audit.sh [PROJECT_DIR]        # human-readable report (default: current dir)
#   bash audit.sh [PROJECT_DIR] --json # machine-readable JSON (for programmatic gates)
#
# Requirements: bash, node (always present in an Angular project), and grep.
# Uses ripgrep (rg) automatically if available (faster); falls back to grep -r.

set -uo pipefail

PROJECT_DIR="."
JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    *) PROJECT_DIR="$arg" ;;
  esac
done

cd "$PROJECT_DIR" 2>/dev/null || { echo "ERROR: cannot cd into '$PROJECT_DIR'"; exit 1; }

if [ ! -f package.json ]; then
  echo "ERROR: no package.json found in '$(pwd)'. Point this at the Angular project root."
  exit 1
fi

# Source roots to scan. Most Angular workspaces use src/; libs/apps/ are common in Nx.
SRC_DIRS=()
for d in src projects libs apps; do [ -d "$d" ] && SRC_DIRS+=("$d"); done
[ ${#SRC_DIRS[@]} -eq 0 ] && SRC_DIRS=(".")

# --- search helper: count + up to 3 sample locations ---------------------------
HAVE_RG=0; command -v rg >/dev/null 2>&1 && HAVE_RG=1
# Inventory scans ALL source, including *.spec.ts: test-only patterns (fakeAsync,
# RouterTestingModule, ng-reflect, TestBed.get) live in specs, and excluding them
# silently under-reports — the most dangerous kind of audit failure.
scan() { # $1 = regex (extended)
  if [ "$HAVE_RG" -eq 1 ]; then
    rg -n --no-heading -e "$1" "${SRC_DIRS[@]}" \
      -g '*.ts' -g '*.html' -g '!node_modules' 2>/dev/null
  else
    grep -rnE --include='*.ts' --include='*.html' \
      --exclude-dir=node_modules -e "$1" "${SRC_DIRS[@]}" 2>/dev/null
  fi
}
count_of() { scan "$1" | wc -l | tr -d ' '; }
samples_of() { scan "$1" | head -3 | sed 's/^/        /'; }

# --- read versions from package.json via node (deterministic + robust) ---------
read_dep() { node -e "const p=require('./package.json');const v={...p.dependencies,...p.devDependencies};process.stdout.write(v['$1']||'')" 2>/dev/null; }
NODE_V=$(node -v 2>/dev/null | sed 's/^v//')
NG_CORE=$(read_dep "@angular/core")
TS_V=$(read_dep "typescript")
RXJS_V=$(read_dep "rxjs")
ZONE_V=$(read_dep "zone.js")
MAT_V=$(read_dep "@angular/material")
NGRX_V=$(read_dep "@ngrx/store")
NZORRO_V=$(read_dep "ng-zorro-antd")
SSR_V=$(read_dep "@angular/ssr")
SW_V=$(read_dep "@angular/service-worker")
NG_MAJOR=$(printf '%s' "$NG_CORE" | sed -E 's/[^0-9]*([0-9]+).*/\1/')

# All FIRST-PARTY @angular/* on the same major? Exclude packages that version
# independently of the Angular framework (AngularFire, etc.) to avoid false mismatches.
ANGULAR_ALIGN=$(node -e '
  const p=require("./package.json");const v={...p.dependencies,...p.devDependencies};
  const indep=["@angular/fire","@angular/flex-layout","@angular/material-moment-adapter","@angular/material-luxon-adapter","@angular/material-date-fns-adapter"];
  const majors={};for(const k of Object.keys(v)){if(k.startsWith("@angular/")&&!indep.includes(k)){const m=(v[k]||"").match(/(\d+)/);if(m)majors[k]=m[1];}}
  const set=[...new Set(Object.values(majors))];
  process.stdout.write(set.length<=1?"ALIGNED ("+(set[0]||"?")+")":"MISMATCH "+JSON.stringify(majors));
' 2>/dev/null)

# Builder + zone.js wiring (best-effort static checks)
BUILDER=$(grep -hoE '"@angular(-devkit/build-angular|/build):[a-z-]+"' angular.json 2>/dev/null | sort -u | tr '\n' ' ')
[ -z "$BUILDER" ] && BUILDER="(angular.json not found or builder not detected)"
ZONE_IN_POLYFILLS=$(grep -qE '"zone\.js"' angular.json 2>/dev/null && echo yes || echo no)
HAS_ZONE_CD=$(scan 'provideZoneChangeDetection' | head -1)
HAS_ZONELESS=$(scan 'provideZonelessChangeDetection' | head -1)

# --- delivery-mode wiring (SPA / SSR / PWA): facts only, no judgment -----------
# SSR: an "ssr" key in angular.json, a server entry file, and the @angular/ssr dep.
SSR_IN_ANGULAR_JSON=$(grep -qE '"ssr"[[:space:]]*:' angular.json 2>/dev/null && echo yes || echo no)
SSR_SERVER_ENTRY=$( { [ -f server.ts ] || [ -f src/server.ts ]; } && echo yes || echo no)
HYDRATION=$(scan 'provideClientHydration' | head -1)
EVENT_REPLAY=$(scan 'withEventReplay' | head -1)
INCR_HYDRATION=$(scan 'withIncrementalHydration' | head -1)
# PWA: the @angular/service-worker dep, an ngsw config, a web manifest, and SW registration.
NGSW_CONFIG=$( [ -f ngsw-config.json ] && echo yes || echo no)
MANIFEST=$(find . -maxdepth 3 \( -name 'manifest.webmanifest' -o -name 'manifest.json' \) \
  -not -path '*/node_modules/*' 2>/dev/null | head -1)
SW_REGISTER=$(scan 'provideServiceWorker|ServiceWorkerModule' | head -1)

# --- deprecated / legacy API inventory -----------------------------------------
# Each entry: "Label|regex|FIX-PATH". FIX-PATH tells Claude whether a schematic exists.
ENTRIES=(
  "Non-standalone declarations|standalone: ?false|schematic: standalone"
  "NgModule decorators|@NgModule\(|schematic: standalone (+ manual cleanup)"
  "Legacy *ngIf/*ngFor/*ngSwitch|\*ngIf|\*ngFor|\*ngSwitch|schematic: control-flow"
  "NgClass / NgStyle bindings|\[ngClass\]|\[ngStyle\]|schematic: ngclass/ngstyle-to-class"
  "CommonModule import|CommonModule|schematic: common-to-standalone"
  "Decorator @Input()|@Input\(|schematic: signal-input-migration"
  "Decorator @Output() / EventEmitter|@Output\(|new EventEmitter|schematic: output-migration"
  "Decorator @ViewChild(ren)/@ContentChild(ren)|@ViewChild\(|@ViewChildren\(|@ContentChild\(|@ContentChildren\(|schematic: signal-queries-migration"
  "Constructors — review for inject() (triage upper-bound)|constructor\(|schematic: inject"
  "Non-self-closing component tags|<[a-z][a-z0-9-]*-[a-z0-9-]*></|schematic: self-closing-tag"
  "RouterTestingModule|RouterTestingModule|schematic: router-testing-module-migration"
  "APP_INITIALIZER family|APP_INITIALIZER|ENVIRONMENT_INITIALIZER|PLATFORM_INITIALIZER|MANUAL: provideAppInitializer (ng update may have done it — verify)"
  "InjectFlags (removed v20)|InjectFlags|MANUAL: use options object"
  "TestBed.get (removed v20)|TestBed\.get\(|MANUAL: TestBed.inject"
  "TestBed.flushEffects (renamed v20)|flushEffects\(|MANUAL: TestBed.tick"
  "afterRender (renamed v20 -> afterEveryRender)|afterRender\(|MANUAL: no schematic — rename by hand"
  "allowSignalWrites (unnecessary v19+)|allowSignalWrites|MANUAL: remove option"
  "DOCUMENT from @angular/common (moved v20)|DOCUMENT.*@angular/common|MANUAL: import DOCUMENT from @angular/core"
  "platform-browser-dynamic (deprecated v20, NO schematic)|platform-browser-dynamic|platformBrowserDynamic|MANUAL: switch to @angular/platform-browser"
  "@angular/animations (deprecated v20.2)|@angular/animations|provideAnimations|BrowserAnimationsModule|MANUAL: migrate to animate.enter/leave — but keep if ng-zorro/PrimeNG/ngx-charts depend on it"
  "Animation triggers (legacy)|trigger\(|transition\(|state\(|MANUAL: native CSS / animate.* bindings"
  "HttpClientModule (legacy)|HttpClientModule|MANUAL: provideHttpClient()"
  "Class HttpInterceptor|implements HttpInterceptor|MANUAL: functional HttpInterceptorFn + withInterceptors"
  "Class guards/resolvers (deprecated)|implements CanActivate|implements CanDeactivate|implements Resolve|export class [A-Za-z0-9_]+(Guard|Resolver)\b|MANUAL: functional CanActivateFn/ResolveFn"
  "Manual RxJS teardown (takeUntil/unsubscribe)|takeUntil\(|\.unsubscribe\(\)|MANUAL: DestroyRef + takeUntilDestroyed() — no schematic"
  "NgZone stability hooks (no-op when zoneless)|onMicrotaskEmpty|onStable|onUnstable|MANUAL: afterNextRender/afterEveryRender"
  "ng-reflect-* selectors (removed v20)|ng-reflect-|MANUAL: switch tests/E2E to data-test-id"
  "ApplicationConfig from platform-browser (removed v21)|ApplicationConfig|MANUAL: import ApplicationConfig from @angular/core"
  "NgModuleFactory (removed v21)|NgModuleFactory|MANUAL: removed — use NgModule"
  "moduleId in @Component (removed v21)|moduleId|MANUAL: remove — only {{ }} interpolation supported"
  "fakeAsync/tick (breaks under zoneless/Vitest)|fakeAsync\(|tick\(|MANUAL: rewrite to await fixture.whenStable()"
)

# Informational adoption metrics — modern patterns ALREADY in use. NOT defects; these
# let Claude judge how far modernization has already progressed (e.g. control flow done
# but inject() barely adopted). Counted the same deterministic way as ENTRIES.
# Format: "Label|regex" (no fix-path).
INFO_ENTRIES=(
  "inject() calls|\binject\("
  "@if / @for control flow|@if[ (]|@for[ (]"
  "takeUntilDestroyed()|takeUntilDestroyed"
  "Functional guards/resolvers (CanActivateFn/ResolveFn)|CanActivateFn|ResolveFn"
)

# --- emit JSON ------------------------------------------------------------------
json_esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
if [ "$JSON" -eq 1 ]; then
  printf '{\n'
  printf '  "angular_core": "%s",\n' "$(json_esc "$NG_CORE")"
  printf '  "angular_major": "%s",\n' "$(json_esc "$NG_MAJOR")"
  printf '  "node": "%s",\n' "$(json_esc "$NODE_V")"
  printf '  "typescript": "%s",\n' "$(json_esc "$TS_V")"
  printf '  "rxjs": "%s",\n' "$(json_esc "$RXJS_V")"
  printf '  "zonejs": "%s",\n' "$(json_esc "$ZONE_V")"
  printf '  "material": "%s",\n' "$(json_esc "$MAT_V")"
  printf '  "ngrx_store": "%s",\n' "$(json_esc "$NGRX_V")"
  printf '  "ng_zorro": "%s",\n' "$(json_esc "$NZORRO_V")"
  printf '  "ssr": "%s",\n' "$(json_esc "$SSR_V")"
  printf '  "ssr_config": "%s",\n' "$SSR_IN_ANGULAR_JSON"
  printf '  "hydration": "%s",\n' "$([ -n "$HYDRATION" ] && echo present || echo absent)"
  printf '  "service_worker": "%s",\n' "$(json_esc "$SW_V")"
  printf '  "ngsw_config": "%s",\n' "$NGSW_CONFIG"
  printf '  "angular_alignment": "%s",\n' "$(json_esc "$ANGULAR_ALIGN")"
  printf '  "builder": "%s",\n' "$(json_esc "$(echo "$BUILDER" | sed 's/"//g' | xargs)")"
  printf '  "findings": {\n'
  first=1
  for e in "${ENTRIES[@]}"; do
    label="${e%%|*}"; rest="${e#*|}"; regex="${rest%|*}"
    c=$(count_of "$regex")
    [ "$first" -eq 0 ] && printf ',\n'; first=0
    printf '    "%s": %s' "$label" "$c"
  done
  printf '\n  },\n'
  printf '  "adoption": {\n'
  first=1
  for e in "${INFO_ENTRIES[@]}"; do
    label="${e%%|*}"; regex="${e#*|}"
    c=$(count_of "$regex")
    [ "$first" -eq 0 ] && printf ',\n'; first=0
    printf '    "%s": %s' "$label" "$c"
  done
  printf '\n  }\n}\n'
  exit 0
fi

# --- emit human-readable report -------------------------------------------------
line() { printf '%s\n' "------------------------------------------------------------"; }
echo "============================================================"
echo " ANGULAR 18 -> 21 MODERNIZATION AUDIT"
echo " project: $(pwd)"
echo " date:    $(date '+%Y-%m-%d %H:%M')"
echo "============================================================"
echo
echo "ENVIRONMENT & DEPENDENCIES"
line
printf "  %-26s %s\n" "@angular/core"        "${NG_CORE:-<not found>}"
printf "  %-26s %s\n" "all @angular/* major" "$ANGULAR_ALIGN"
printf "  %-26s %s\n" "Node (running)"        "${NODE_V:-?}   (v21 needs ^20.19 || ^22.12 || ^24)"
printf "  %-26s %s\n" "TypeScript"            "${TS_V:-?}   (v21 needs >=5.9 <6.0)"
printf "  %-26s %s\n" "RxJS"                  "${RXJS_V:-?}   (^6.5.3 || ^7.4.0 — no change needed)"
printf "  %-26s %s\n" "zone.js"               "${ZONE_V:-<none — possibly already zoneless>}"
printf "  %-26s %s\n" "@angular/material"     "${MAT_V:-<not used>}"
printf "  %-26s %s\n" "@ngrx/store"           "${NGRX_V:-<not used>}"
printf "  %-26s %s\n" "ng-zorro-antd"         "${NZORRO_V:-<not used>}"
echo
echo "BUILD & CHANGE-DETECTION WIRING"
line
printf "  %-26s %s\n" "builder(s)"            "$(echo "$BUILDER" | sed 's/"//g')"
printf "  %-26s %s\n" "zone.js in polyfills"  "$ZONE_IN_POLYFILLS"
printf "  %-26s %s\n" "provideZoneChangeDetection" "$([ -n "$HAS_ZONE_CD" ] && echo "present" || echo "NOT FOUND — required for existing Zone.js apps on v21")"
printf "  %-26s %s\n" "provideZonelessChangeDetection" "$([ -n "$HAS_ZONELESS" ] && echo "present (zoneless)" || echo "not present")"
echo
echo "DELIVERY MODES (SPA / SSR / PWA)   — see references/pwa-ssr-spa.md"
line
printf "  %-26s %s\n" "@angular/ssr"          "${SSR_V:-<not installed>}"
printf "  %-26s %s\n" "SSR config + entry"    "angular.json ssr=$SSR_IN_ANGULAR_JSON  server.ts=$SSR_SERVER_ENTRY"
printf "  %-26s %s\n" "provideClientHydration" "$([ -n "$HYDRATION" ] && echo "present" || echo "ABSENT — destructive re-render if SSR is on")"
printf "  %-26s %s\n" "  withEventReplay"       "$([ -n "$EVENT_REPLAY" ] && echo present || echo absent)"
printf "  %-26s %s\n" "  withIncrementalHydration" "$([ -n "$INCR_HYDRATION" ] && echo present || echo absent)"
printf "  %-26s %s\n" "@angular/service-worker" "${SW_V:-<not installed — no PWA>}"
printf "  %-26s %s\n" "ngsw-config.json"      "$NGSW_CONFIG"
printf "  %-26s %s\n" "web manifest"          "$([ -n "$MANIFEST" ] && echo "${MANIFEST#./}" || echo "<none>")"
printf "  %-26s %s\n" "SW registration"       "$([ -n "$SW_REGISTER" ] && echo present || echo absent)"
echo
echo "DEPRECATED / LEGACY API INVENTORY   (count  fix-path)"
echo "  [schematic: X] = automatable    [MANUAL] = needs human/AI judgment"
line
for e in "${ENTRIES[@]}"; do
  label="${e%%|*}"; rest="${e#*|}"; regex="${rest%|*}"; fix="${rest##*|}"
  c=$(count_of "$regex")
  if [ "$c" -gt 0 ]; then
    printf "  [%4s]  %-46s %s\n" "$c" "$label" "$fix"
    samples_of "$regex"
  else
    printf "  [   0]  %-46s %s\n" "$label" "(clear)"
  fi
done
echo
echo "ADOPTION / PROGRESS   (informational — modern patterns already in use, NOT defects)"
line
for e in "${INFO_ENTRIES[@]}"; do
  label="${e%%|*}"; regex="${e#*|}"
  c=$(count_of "$regex")
  printf "  [%4s]  %s\n" "$c" "$label"
done
echo
line
echo "NOTES: the scan includes *.spec.ts on purpose (fakeAsync, RouterTestingModule,"
echo "ng-reflect, TestBed.get live there). 'Constructors' is a triage upper-bound — the"
echo "inject schematic does the precise detection and skips param-less constructors."
echo "Counts are OCCURRENCES (matching lines), not files — one file can contribute many."
echo
echo "NEXT: hand this report to Claude. The counts are facts; the PRIORITY,"
echo "ORDER, and the fixes for every [MANUAL] item require judgment — see SKILL.md."
