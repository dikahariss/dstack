# Syncing skills to Claude.ai (web)

`bun run build` renders skills to `./.claude/skills/`. Claude.ai (web) is a
separate install target, and the only one the repo cannot reach: an uploaded
skill is a **copy**, not a link, and nothing on claude.ai re-reads this
repository. Every change that should land in the web account is uploaded
deliberately.

Verified against claude.ai on 2026-08-16 with the 33-skill catalog. There is no
API behind the UI to automate against — `/api/organizations/{uuid}/skills`
returns 404 — so the browser is the only path.

## What claude.ai accepts

- `.zip`, `.skill`, or `.md`. A `.zip` must contain `SKILL.md`.
- Bundled `references/`, `scripts/`, and `assets/` survive intact. The skill
  detail panel reports a file count; it matches `find <id> -type f | wc -l`.
- Upload runs a security scan, advertised as 1–2 minutes. The 33-skill catalog
  cleared it with no visible delay.
- An uploaded skill is enabled by default and shows `by You`.

## 1. Render and package

One zip per skill folder. The zip must contain the skill *directory*, not its
loose contents.

```bash
bun run build                                    # render to ./.claude/skills/

OUT=/tmp/dstack-skill-zips                       # anywhere outside the repo
rm -rf "$OUT" && mkdir -p "$OUT"
cd .claude/skills
for d in */; do zip -qr "$OUT/${d%/}.zip" "${d%/}"; done
```

The whole catalog packs to well under 1 MB, so size is never the constraint —
the collision rules in step 3 are.

## 2. Decide what to upload

Only changed skills need a trip. Take the list from git, not from memory:

```bash
git diff --name-only <last-synced-sha>..HEAD -- skills/ | cut -d/ -f2 | sort -u
```

Claude.ai cannot be asked which version it holds, so record the SHA you synced
from in the sync commit message. Nothing else tracks it.

## 3. Upload

Open **sidebar → Customize → Skills**. (`claude.ai/settings/capabilities`
redirects into the same modal; setting the URL hash directly does not open it.)

### New skills — batch them

**Add → Upload a skill**, then hand it every zip at once. Batches of 8 are
verified; the input is `multiple` and was not tested higher. A clean batch ends
with a `Uploaded N skills` toast.

### Changed skills — one at a time

A name collision raises a per-file confirmation — *Replace "<name>" skill?
… will replace the existing one, which can't be restored* — and **stops the
rest of the batch**. A three-file batch whose first entry collided produced
`Upload stopped — 2 skills were not uploaded`; confirming replaced that one
skill and the other two were silently dropped, not queued.

So batching is for first installs. Updates go one skill per upload, by either
path — both replace in place, neither duplicates:

| Path | Steps |
|---|---|
| From the list | **Add → Upload a skill** → one zip → confirm **Upload and replace** |
| From the skill | open the skill → **⋮ → Replace** → one zip |

The warning that the replaced version "can't be restored" is acceptable here
and only here: the repo is the source of truth and `bun run build` reproduces
the same bytes. It is not a licence to replace a skill that only exists on the
web (one written through *Add → Create with Claude* or *Write skill
instructions*) — download that first.

## 4. Verify, do not assume

The upload toast reports what was *accepted*, not what is *installed*. After a
sync, reload the page and check:

1. The row count under `by You` equals the number of skills you expect, and no
   name appears twice.
2. For any skill that carries bundled files, the detail panel's `N files`
   matches `find <id> -type f | wc -l` in `.claude/skills/`.
3. The skill's toggle is on.

A skill that silently arrived as `SKILL.md` alone will still look installed in
the list. The file count is what catches it.

## Notes for an agent driving the browser

The failure mode here is a native file picker: it is an OS window, the agent
cannot see or dismiss it, and it freezes the browser session.

- **`⋮ → Replace` calls `input.click()` directly** and opens that picker. Patch
  `HTMLInputElement.prototype.click` to capture file inputs instead of clicking
  them *before* opening the menu, and restore the prototype afterward.
- **`Add → Upload a skill` is safe.** It renders a dropzone modal whose hidden
  input (`accept=".zip,.skill,.md"`) is already in the DOM. Never click the
  dropzone — locate the input and drive it with the file-upload tool.
- Element refs from `find` / `read_page` go stale after each re-render. Re-find
  the input for every upload.
- Read state from the DOM, not from screenshots — a throttled tab returns stale
  frames, and one screenshot call timed out outright during this run.

## What this does not cover

Skills authored on claude.ai itself, `Browse`-installed skills from Anthropic,
and the per-skill `Download` export. Those live only in the web account; this
procedure is one-way, repo → web.
