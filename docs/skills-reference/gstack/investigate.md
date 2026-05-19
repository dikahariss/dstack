# Investigate — Systematic Debugging

> **Sumber:** [`investigate/SKILL.md`](https://github.com/garrytan/gstack/blob/main/investigate/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Bug fix tanpa root cause = whack-a-mole. Tiap "fix cepat" yang tidak address penyebab struktural bikin bug berikutnya lebih sulit ditemukan, karena symptom yang sebelumnya dipakai sebagai sinyal sekarang ditutupi. `/investigate` punya **Iron Law**: **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**. Skill ini memaksa flow systematic — symptom collection → code reading → reproduce → hypothesis → pattern check → hypothesis testing → minimal fix → regression test → verification — dengan 3-strike rule (3 hypothesis gagal = STOP dan reassess arsitektur).

Skill juga lock scope via `/freeze` post-hypothesis supaya fix tidak creep ke file unrelated. Setiap investigasi dicapture sebagai learning dengan file references — investigasi masa depan di area yang sama otomatis surface prior fix.

## Kapan menggunakannya

- Voice trigger routing: "bug", "error", "debug", "investigate", "tidak jalan".
- Setiap bug yang tidak obvious dari error message.
- Performance regression yang root cause-nya tidak jelas.
- Test failure yang muncul intermittent.
- Setelah symptom muncul berulang kali — ada possibility arsitektur smell.
- Tidak untuk typo / syntax error yang langsung jelas — itu langsung fix.

## Cara menggunakannya

1. **Phase 1: Root Cause Investigation**
   - Collect symptoms (error, stack trace, repro steps). Ask ONE question at a time via AskUserQuestion kalau context kurang.
   - Read code: trace path dari symptom mundur ke causes via Grep + Read.
   - Check recent changes: `git log --oneline -20 -- <affected-files>`. Regression = root cause ada di diff.
   - Reproduce deterministically.
   - Check investigation history (Prior Learnings via `gstack-learnings-search`). Recurring bugs di area sama = arsitektur smell.
2. **Prior Learnings** — search learnings cross-project (kalau enabled) atau project-scoped. Display "Prior learning applied: [key] (confidence N/10, from [date])" kalau match.
3. Output **"Root cause hypothesis: ..."** — specific, testable claim.
4. **Refresh learnings** keyed ke hypothesis spesifik (ONE noun keyword, alphanumeric only — sample bagus: `auth-cookie`, `session-expiry`; sample buruk: `auth.ts:47`).
5. **Scope Lock** — kalau `/freeze` available, identify narrowest containing directory, lock edits ke sana via `freeze-dir.txt`. Skip kalau scope genuinely unclear.
6. **Phase 2: Pattern Analysis** — cocokkan dengan known patterns:
   | Pattern | Signature | Where to look |
   |---------|-----------|---------------|
   | Race condition | Intermittent, timing | Concurrent shared state |
   | Null propagation | NoMethodError | Missing guards |
   | State corruption | Inconsistent data | Transactions, callbacks |
   | Integration failure | Timeout | External API calls |
   | Config drift | Local OK, prod fails | Env vars, flags, DB |
   | Stale cache | Old data, fix on clear | Redis, CDN, browser |
   Plus check TODOS.md + `git log` untuk prior fixes di area sama. **External pattern search via WebSearch** (sanitize first — strip hostname, IP, path, SQL, customer data).
7. **Phase 3: Hypothesis Testing**:
   - Confirm dengan temporary log/assertion di suspected root cause. Run reproduction.
   - Kalau hypothesis salah: WebSearch sanitized error, balik Phase 1, gather more evidence. Jangan tebak.
   - **3-strike rule**: 3 hypothesis gagal → STOP, AskUserQuestion (continue / escalate / add logging + wait).
   - Red flags: "quick fix for now", proposing fix tanpa trace data flow, tiap fix reveal new problem di tempat lain (wrong layer).
8. **Phase 4: Implementation** — fix root cause not symptom. Minimal diff, fewest files. Write regression test (fail without fix, pass with fix). Run full test suite. Kalau >5 files: AskUserQuestion blast radius.
9. **Phase 5: Verification & Report** — fresh reproduction, paste test output. Structured debug report:
   ```
   DEBUG REPORT
   Symptom:         [observed]
   Root cause:      [actually wrong]
   Fix:             [file:line]
   Evidence:        [test output]
   Regression test: [file:line]
   Related:         [TODOS, prior bugs]
   Status:          DONE | DONE_WITH_CONCERNS | BLOCKED
   ```
10. **Capture Learnings** — log via `gstack-learnings-log` dengan `type: "investigation"`, files affected. Future investigations di file sama akan surface ini.

## Contoh / Studi kasus

Haris dapat report: "User sometimes redirected to /login meskipun logged in". Intermittent.
- Phase 1: collect symptom (user agent, browser), reproduce belum bisa.
- Code reading: trace `/me` endpoint → session validation di `auth-middleware.ts:42`.
- git log: 2 minggu lalu ada commit "refactor session check" yang naikkan perfomance tapi mungkin race condition.
- Prior learnings search "session" → no match.
- Hypothesis: race condition — request kedua ke session-refresh tumpang tindih dengan validation request pertama, session di-rotate sebelum first request selesai.
- Scope lock ke `src/auth/`.
- Phase 2 pattern: matches "race condition" + "stale cache".
- Phase 3 hypothesis test: add log timestamp di session-rotate dan validation. Reproduce dengan 2 parallel curl → confirmed: window 50ms di mana rotate happen mid-validation.
- Phase 4 fix: add mutex per-user-id di session manager. Regression test: 100 parallel requests, no 401. 12 lines change, 1 file.
- Phase 5 verify: bug gone, full test suite pass.
- Capture learning: `{"type":"investigation","key":"session-rotation-race","files":["src/auth/middleware.ts","src/auth/session-store.ts"],"confidence":9}`.

## Kesimpulan

`/investigate` adalah disiplin debugging yang dipaksa oleh skill: Iron Law (root cause first), 3-strike rule (jangan keras kepala), scope lock (jangan creep), regression test wajib (proof fix bekerja), learnings capture (compound knowledge). Cocok untuk bug yang tidak trivial. Hindari untuk masalah obvious — overhead-nya tidak worth untuk 1-liner typo.
