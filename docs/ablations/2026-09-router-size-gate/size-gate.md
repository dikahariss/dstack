**Size the task before any chain.** Before the first skill, state one line:
`Size: small — <evidence>`, `Size: multi-step — <evidence>`, or
`Size: question — no change`. Small means all three hold: the change stays in
one module, the user already stated the result, and it fits one session. A
small change runs `/test-driven-development` → `/verifying-before-done` and
nothing else; a mechanical edit (rename, typo, reformat) runs only
`/verifying-before-done`. A question runs no skill. A row that names a risk
the task carries — a destructive command, a running app with acceptance
criteria, a bug whose cause is unknown — still fires whatever the size. Each
link of a chain below is a row that must match on its own; no link is owed
because the previous skill ran.
