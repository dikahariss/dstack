# Anthropics Skills — Referensi Bahasa Indonesia

Dokumentasi referensi 17 skill resmi Anthropic dari repositori
[`anthropics-skills`](https://github.com/anthropics/skills). Tiap halaman ringkas isi
SKILL.md ke dalam: kenapa skill ini penting, kapan dipakai, contoh prompt, cara pakai, studi kasus, dan
kesimpulan padat.

## Daftar skill

| Skill | Deskripsi singkat |
|---|---|
| [algorithmic-art](algorithmic-art.md) | Generative art p5.js dengan filosofi algoritmik dulu, baru kode — HTML interaktif self-contained dengan seeded randomness. |
| [brand-guidelines](brand-guidelines.md) | Identitas brand Anthropic terkompresi (palette + font pairing) untuk styling artefak agar match look-and-feel resmi. |
| [canvas-design](canvas-design.md) | Poster/karya seni visual via filsafat desain → kanvas PDF/PNG 1-halaman museum-quality dengan font custom. |
| [claude-api](claude-api.md) | Panduan Anthropic SDK terkini (Opus 4.7, prompt caching, adaptive thinking, Managed Agents) per bahasa pemrograman. |
| [doc-coauthoring](doc-coauthoring.md) | Workflow tiga tahap untuk co-authoring dokumen — context gathering, refinement, reader testing via sub-agent. |
| [docx](docx.md) | Buat/edit/baca file Word `.docx` via docx-js + script unpack/pack/validate, dengan jebakan docx-js eksplisit. |
| [frontend-design](frontend-design.md) | Disiplin design taste untuk frontend — pilih arah aestetik berani, eksekusi production-grade, anti AI slop. |
| [internal-comms](internal-comms.md) | Router komunikasi internal — load panduan format per-jenis (3P update, newsletter, FAQ, incident report). |
| [mcp-builder](mcp-builder.md) | Blueprint pembangunan MCP server berkualitas — empat fase research → implementation → review → 10 eval questions. |
| [pdf](pdf.md) | Peta tugas-ke-tool untuk operasi PDF (merge, split, extract text/table, watermark, OCR, fill form). |
| [pptx](pptx.md) | Pembuatan/edit slide PowerPoint dengan design taste (10 palette + font pairing) + QA empiris via subagent. |
| [skill-creator](skill-creator.md) | Meta-skill untuk membuat/iterate skill lain — eval-driven (with-skill vs baseline + grader + viewer + description optimizer). |
| [slack-gif-creator](slack-gif-creator.md) | Toolkit animated GIF Slack-optimal (128x128 emoji / 480x480 message) dengan utilities GIFBuilder/validator/easing. |
| [theme-factory](theme-factory.md) | 10 tema preset (palette + font) plus custom-theme fallback untuk styling konsisten lintas artefak. |
| [webapp-testing](webapp-testing.md) | Testing frontend lokal pakai Playwright — helper `with_server.py` + pattern reconnaissance-then-action. |
| [web-artifacts-builder](web-artifacts-builder.md) | Bangun elaborate React+TS+Tailwind+shadcn artifact, di-bundle Parcel ke single HTML untuk claude.ai. |
| [xlsx](xlsx.md) | Disiplin spreadsheet — formula-first, zero formula error, color coding industri-standard untuk model finansial. |

## Catatan

- Skill di repo Anthropic ditulis dalam Bahasa Inggris; dokumentasi ini adalah ringkasan
  Bahasa Indonesia yang setia pada isi SKILL.md asli (sumber dilink di tiap halaman).
- Beberapa skill mengandung sub-folder berat (`claude-api`, `skill-creator`, `mcp-builder`)
  — ringkasan di sini hanya meraih garis besar; baca SKILL.md asli untuk detail bahasa
  atau script tertentu.
- Skill ini dirilis Anthropic untuk dipakai dengan Claude Code / claude.ai dan tidak
  punya dependency ke dstack — referensi ini sekadar membantu pengguna Indonesia
  memahami dan memilih skill yang sesuai kebutuhan.
