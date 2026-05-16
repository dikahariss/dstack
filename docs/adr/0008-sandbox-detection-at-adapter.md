# ADR-0008 — Chromium sandbox detection in the adapter, not the domain

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Cheap. The detection logic is in one file in the
  browse package.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Sandbox | A restricted environment that limits what a program can do. Chromium uses sandboxes to isolate web pages from the rest of the system. |
| User namespace | A Linux kernel feature that lets a process appear to run as root inside its own namespace, without being root in the system. Chromium uses this to create its sandbox without root privileges. |
| AppArmor | A Linux security system that restricts what programs can do. Ubuntu 24.04 uses AppArmor to limit unprivileged user namespaces by default. |
| Probe | A small check that determines whether a feature works on the current system. |

## Context

A common pattern for launching Chromium under Playwright is to disable
the sandbox in environments where it cannot work:

```typescript
const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
if (process.env.CI || process.env.CONTAINER || isRoot) {
  launchArgs.push('--no-sandbox');
}
```

This code adds the `--no-sandbox` flag in three cases:

1. The environment variable `CI` is set (continuous integration build).
2. The environment variable `CONTAINER` is set (running in a container).
3. The process is running as root.

The code misses a fourth case. On Ubuntu 24.04 and later, AppArmor
restricts unprivileged user namespaces by default. The kernel setting
is:

```
$ sysctl kernel.apparmor_restrict_unprivileged_userns
kernel.apparmor_restrict_unprivileged_userns = 1
```

When this restriction is enabled, Chromium cannot create its sandbox,
even when not running as root and not in a container. A fresh Ubuntu
24.04 user runs `browse goto https://example.com` and sees the error:

```
Chromium sandboxing failed!
[FATAL: No usable sandbox! If you are running on Ubuntu 23.10+ ...]
```

The current workaround is to prefix the command with `CI=1`. That is
unintuitive (the user is not in CI) and pollutes the environment for
other tools.

## Decision

The browse adapter probes the host system at startup to decide whether
the sandbox is viable. The probe lives in
`packages/browse/src/adapters/playwright/sandbox-policy.ts`.

The probe checks these signals. If any one of them indicates the
sandbox will fail, add the `--no-sandbox` flag.

| Signal | Indication |
|---|---|
| `process.env.CI` is set | Continuous integration build |
| `process.env.CONTAINER` is set | Running in a container |
| `process.getuid() === 0` | Running as root |
| Linux + `/proc/sys/kernel/apparmor_restrict_unprivileged_userns` is `1` | AppArmor blocks user namespaces (Ubuntu 24.04+ default) |
| Linux + `unshare -U true` exits with non-zero status | User-namespace creation blocked by some mechanism (catches AppArmor, seccomp, kernel configs) |

The last signal is the most general. It catches future kernel and
distribution changes that may block user namespaces for new reasons.
Running it costs one process spawn at daemon startup. The result is
cached for the daemon's lifetime.

The decision lives in the adapter layer for three reasons:

1. The domain type `Session` does not care about Chromium internals.
2. A future non-Chromium browser (Firefox via Playwright) might have a
   different sandboxing story.
3. Platform-specific behavior belongs near platform-specific code.

## Trade-offs

**Upsides (`+`)**

- The bug is fixed in the place a reader would expect to find it.
- The probe is small. It is well-tested. It covers the actual failure
  cases.
- Users on Ubuntu 24.04 do not need to pollute their environment with
  `CI=1`.

**Downsides (`-`)**

- The probe runs once per daemon start. The cost is negligible (a few
  milliseconds).
- One edge case is not fully covered: a user who has disabled AppArmor
  but who has another restriction (such as seccomp) is covered by the
  general signal but not by the AppArmor-specific check. The general
  signal is the source of truth. The AppArmor check is a fast-path
  optimization that could be removed for simpler code.

## YAGNI guard

Do not generalize this into "a browser capability detection framework."
One function with five signals is the right shape. Add new branches
when new signals are needed.

Do not expose this as a configurable policy. The user cannot reasonably
override an operating-system-level fact.

## Reversibility

Cheap. The adapter owns this decision. Changing the signal set or the
caching behavior touches one file.

## References

- The error message observed during testing:
  `[pid=139258][err] [...] FATAL: ... No usable sandbox! ...`
- Chromium's own documentation:
  https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md
- See [ADR-0007](0007-browse-separate-process.md) for why this fix
  lives in a separate package.
