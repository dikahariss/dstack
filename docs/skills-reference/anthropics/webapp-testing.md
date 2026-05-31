# Webapp Testing

> **Sumber:** [`skills/webapp-testing/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Verifikasi frontend lokal via prompt biasa sering gagal di hal mendasar: Claude
inspeksi DOM sebelum app selesai load, asumsi selector dari source code (tapi DOM
ter-render beda), atau lupa lifecycle server. Skill ini memberi disiplin
**reconnaissance-then-action** plus helper script `with_server.py` yang handle lifecycle
server (multi-server pun) supaya Claude tidak terjebak orchestration berkali-kali.

Nilai uniknya: filosofi "use scripts as black boxes" — tidak load source script ke
context (mereka besar). Cukup `--help` dulu untuk lihat usage, baru invoke. Plus
decision tree eksplisit untuk static HTML vs dynamic webapp.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mau test/interact dengan webapp lokal.
- Verifikasi frontend functionality, debug UI behavior, capture screenshot, view browser
  log.
- Pakai Playwright untuk automation.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Verifikasi form checkout di app React lokal saya pakai
  Playwright."
- "Test apakah halaman dashboard muncul error di console."
- "Capture screenshot halaman login setelah submit, cek redirect
  ke `/home`."
- Kata kunci kanonik (EN): `test local webapp`, `Playwright`,
  `verify frontend`, `browser screenshot`, `browser logs`.

Contoh task lengkap:

> "App Next.js saya jalan di port 3000 — verifikasi flow
> registrasi: isi field `name`, `email`, `password`, klik
> tombol Register, pastikan muncul halaman `/dashboard` dan
> tidak ada console error."

Yang terjadi: skill menjalankan `python scripts/with_server.py
--help` dulu (black box), menulis script Playwright yang navigate
ke `localhost:3000`, tunggu `networkidle`, screenshot untuk
reconnaissance, isi form via selector yang ditemukan, submit,
assert URL redirect, capture console log untuk verifikasi
zero error — semua tanpa membaca source `with_server.py`.

## Cara menggunakannya

### Decision tree

```
User task → Static HTML?
    ├─ Ya → Read HTML langsung untuk identify selector
    │        ├─ Sukses → Tulis Playwright script pakai selector
    │        └─ Gagal/incomplete → Treat as dynamic (bawah)
    │
    └─ Tidak (dynamic webapp) → Server jalan?
        ├─ Tidak → `python scripts/with_server.py --help`
        │          Pakai helper + simplified Playwright script
        │
        └─ Ya → Reconnaissance-then-action:
            1. Navigate + wait for networkidle
            2. Screenshot atau inspect DOM
            3. Identify selectors dari rendered state
            4. Execute actions dengan selector yang ditemukan
```

### Helper script (black box)

**Selalu run `--help` dulu**. Jangan baca source — script besar, pollute context window.

Single server:

```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

Multi server (backend + frontend):

```bash
python scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python your_automation.py
```

Server lifecycle (start, wait for port ready, kill on exit) ditangani helper. Script
automation cukup berisi logic Playwright:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)  # selalu headless
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # CRITICAL untuk dynamic app
    # ... automation logic
    browser.close()
```

### Reconnaissance-then-action pattern

1. **Inspect rendered DOM**:
   ```python
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   content = page.content()
   page.locator('button').all()
   ```
2. **Identify selector** dari hasil inspection.
3. **Execute action** dengan selector yang ditemukan.

### Common pitfall

- **JANGAN** inspect DOM sebelum `wait_for_load_state('networkidle')` di app dynamic.
- **DO** pakai descriptive selector: `text=`, `role=`, CSS, atau ID.
- **DO** tambah wait yang tepat: `page.wait_for_selector()` atau `page.wait_for_timeout()`.
- **DO** selalu close browser saat selesai.

### Best practices

- Pakai bundled script sebagai **black box** — `--help` untuk usage, jangan baca source.
- Pakai `sync_playwright()` untuk script sync.
- Selalu launch chromium headless.
- Browser close di akhir.

Resource pendukung:

- `scripts/with_server.py` — server lifecycle manager (single & multi server).
- `examples/` — pattern umum:
  - `element_discovery.py` — discover button/link/input.
  - `static_html_automation.py` — pakai `file://` URL untuk local HTML.
  - `console_logging.py` — capture console log selama automation.

## Contoh / Studi kasus

User: *"Verify form login di app React saya — masukkan email/password, submit, cek
welcome page muncul."*

1. Claude run `python scripts/with_server.py --help` (tidak baca source).
2. Tulis `test_login.py`:
   ```python
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p:
       browser = p.chromium.launch(headless=True)
       page = browser.new_page()
       page.goto('http://localhost:5173/login')
       page.wait_for_load_state('networkidle')
       page.screenshot(path='/tmp/login.png', full_page=True)  # reconnaissance
       page.fill('input[type=email]', 'test@example.com')
       page.fill('input[type=password]', 'password123')
       page.click('button[type=submit]')
       page.wait_for_url('**/welcome', timeout=5000)
       assert 'Welcome' in page.content()
       browser.close()
   ```
3. Run: `python scripts/with_server.py --server "npm run dev" --port 5173 -- python test_login.py`.
4. Helper start dev server, wait port 5173 ready, jalankan `test_login.py`, kill server.

User: *"Cek apakah console error muncul di halaman dashboard."*

Pakai pattern dari `examples/console_logging.py` — capture console log via
`page.on('console', ...)`, log ke file, assert tidak ada error.

## Kesimpulan

Skill ini adalah disiplin testing frontend lokal pakai Playwright dengan dua pilar:
helper script `with_server.py` sebagai black box untuk server lifecycle, plus pattern
reconnaissance-then-action (navigate → wait networkidle → inspect → identify selector →
execute action). Diniatkan supaya Claude tidak terjebak orchestration server berulang
atau inspect DOM prematur. Cocok untuk verifikasi UI behavior, capture screenshot,
debug interaksi — bukan untuk load testing atau end-to-end suite skala besar (pakai tool
lain). Output: hasil verifikasi (screenshot, assertion result, console log) yang
deterministic dan repeatable.
