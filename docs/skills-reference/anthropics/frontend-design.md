# Frontend Design

> **Sumber:** [`skills/frontend-design/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Frontend yang dihasilkan via prompt biasa cenderung jatuh ke "AI slop": purple gradient
di atas latar putih, font Inter, rounded corners uniform, layout center-aligned, palette
yang cocok untuk semua tapi tidak berkarakter untuk topik tertentu. Skill ini memaksa
Claude memilih **arah aestetik yang berani** lebih dulu (brutal minimal, maksimalist chaos,
retro-futuristic, organic, luxury, dst.) dan eksekusi dengan presisi — bukan menumpuk
fitur visual yang generik.

Nilai uniknya: aturan eksplisit *NEVER use* untuk font/pattern yang sudah jenuh, plus
penekanan pada satu hal yang **unforgettable** per artefak. Tone instructional bukan
prescriptive — Claude tetap punya ruang kreatif, tapi dengan guardrail anti-konvergensi.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User minta build web component, page, artifact, poster, atau aplikasi.
- Contoh: website, landing page, dashboard, React component, layout HTML/CSS.
- User minta styling/beautify UI web yang sudah ada.

## Cara menggunakannya

Sebelum coding:

1. **Design thinking** — pahami konteks:
   - **Purpose**: masalah apa yang dipecahkan UI ini? Siapa user-nya?
   - **Tone**: pilih satu *extreme*. Bukan "modern dan clean" (terlalu vague), tapi
     spesifik: brutalist minimal? Editorial magazine? Industrial utilitarian?
   - **Constraints**: framework, performance, aksesibilitas.
   - **Differentiation**: apa satu hal yang akan diingat orang setelah lihat?

2. **Eksekusi** — implementasi working code (HTML/CSS/JS, React, Vue) yang:
   - Production-grade dan functional.
   - Visually striking dan memorable.
   - Cohesive dengan point-of-view aestetik yang jelas.
   - Refined di setiap detail.

### Pillars yang harus diperhatikan

- **Typography** — pilih font yang punya karakter. **Hindari** Arial, Inter, Roboto,
  system font. Pair distinctive display font dengan refined body font. Jangan default
  ke Space Grotesk (sudah jenuh).
- **Color & Theme** — pakai CSS variables. Satu warna dominant, 1-2 supporting, satu
  sharp accent. **Hindari** palette equally-weighted yang timid.
- **Motion** — animasi untuk effect & micro-interaction. CSS-only untuk HTML, Motion
  library untuk React. Fokus high-impact moments — satu page load yang well-orchestrated
  > scattered micro-interaction.
- **Spatial Composition** — unexpected layouts, asymmetry, overlap, diagonal flow,
  grid-breaking. Generous negative space ATAU controlled density.
- **Backgrounds & Visual Details** — gradient mesh, noise texture, geometric pattern,
  layered transparencies, dramatic shadow, decorative border, custom cursor, grain
  overlay. JANGAN default ke solid colors.

### Anti-patterns

**JANGAN**:

- Pakai font generic AI-generated (Inter, Roboto, Arial, system font).
- Purple gradient di atas putih (cliché).
- Layout dan komponen yang predictable.
- Cookie-cutter design yang tidak berkarakter untuk topik.
- Konvergen ke pilihan umum lintas generasi (Space Grotesk dipakai berulang).

**LAKUKAN**:

- Variasi antara light & dark theme.
- Match kompleksitas implementasi dengan visi — maksimalist = elaborate code, minimalist
  = restraint + precision.
- Eksekusi visi dengan baik (elegansi datang dari eksekusi, bukan dari intensitas).

## Contoh / Studi kasus

User: *"Buatkan landing page untuk roastery kopi independen."*

Tone yang dipilih: **editorial magazine** (bukan default tech startup).

- Typography: display font *Söhne Breit* untuk hero, body *Source Serif* untuk artikel.
- Color: dominant deep coffee brown `#3A2618`, supporting cream `#F5EBD7`, sharp accent
  burnt orange `#D2691E`.
- Layout: hero asymmetric — judul kiri besar, foto biji kopi setengah-bleed kanan,
  diagonal divider.
- Motion: satu staggered reveal saat load (judul → subtitle → CTA → photo fade).
- Background: noise texture halus di hero, transition ke seamless cream untuk section
  story; section "process" pakai grid-breaking timeline horizontal.
- Differentiation: cursor custom berbentuk biji kopi, scroll-triggered scale pada
  product image.

Hasil: tidak terlihat seperti "AI generated SaaS landing". Terasa seperti studio kopi
benar-benar pesan ke desainer.

## Kesimpulan

Skill ini adalah disiplin design taste untuk frontend — memaksa Claude memilih arah
aestetik berani lebih dulu, lalu eksekusi dengan presisi production-grade. Ekspetasinya:
output bukan "tech artifact" yang seragam, melainkan UI yang punya point-of-view dan
satu detail unforgettable. Diniatkan untuk lawan kecenderungan default ke AI slop.
Output: kode HTML/CSS/JS atau React yang ready to ship, dengan typography & color &
motion yang dipikirkan untuk konteks spesifik — bukan template universal.
