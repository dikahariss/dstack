# QA

> **Sumber:** [`skills/deprecated/qa/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/deprecated/qa/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** deprecated

## Mengapa skill ini penting

QA adalah aktivitas yang paling sering "kalah cepat" dengan ingatan: pengguna melihat bug, menceritakannya verbal, lalu hilang sebelum jadi tiket. Skill ini mengubah obrolan QA menjadi siklus terstruktur yang menghasilkan GitHub issue durable — yang masih bermakna setelah refactor besar — dengan minimal friction untuk user. Agent mendengar masalah, sedikit klarifikasi, lalu langsung filing tanpa minta review.

Skill ini di-deprecate karena alurnya tumpang tindih dengan `engineering/triage` (yang menggabungkan create + classify + breakdown ke dalam state machine yang lebih lengkap) dan `engineering/to-issues` (yang khusus memecah plan menjadi vertical slices). Namun template issue dan disiplin "no file paths, use domain language" yang ada di sini tetap menjadi panduan terbaik untuk bug report durable.

## Kapan menggunakannya

- User bilang "ayo QA sambil saya pakai", "ini buggy", "let's file issues for these".
- Sesi QA interaktif di mana user reporting bug ke agent secara conversational.
- Frontmatter description menyebut "files GitHub issues" dan "QA session".

## Cara menggunakannya

1. **Listen and lightly clarify**: dengarkan deskripsi user. Maksimum 2–3 pertanyaan klarifikasi (expected vs actual, repro steps, konsistensi).
2. **Explore codebase di background**: jalankan sub-agent untuk memahami area terkait, cek `UBIQUITOUS_LANGUAGE.md`. Konteks ini untuk menulis issue lebih baik, *bukan* untuk dimasukkan ke issue (no file paths!).
3. **Assess scope**: single issue atau breakdown? Pecah jika ada multiple independent areas atau separable concerns.
4. **File via `gh issue create`**: jangan minta review user, langsung file dan share URL.
5. Pakai template "What happened / What I expected / Steps to reproduce / Additional context" untuk single issue, atau template breakdown dengan dependency order untuk multi-issue.
6. **Continue**: lanjut sampai user bilang selesai. Setiap issue independen.

## Contoh / Studi kasus

User berkata: "Form login kadang reset semua field setelah validasi gagal, dan setelah login berhasil redirect kadang masuk ke /dashboard kadang ke /home." Agent menanyakan: apakah konsisten? Browser apa? User jawab Chrome, sekitar 50%. Agent mengeksplorasi codebase di background, menemukan bahwa ini sebenarnya dua bug terpisah (state form di-reset oleh re-render React, dan redirect logic membaca stale session). Agent memecah jadi dua issue: (1) "Login form clears all fields after validation error", (2) "Post-login redirect destination is inconsistent". Issue ditulis dengan bahasa domain user, tanpa menyebut nama komponen atau line number. URL kedua issue di-share, lalu agent bertanya "Next issue, or are we done?"

## Kesimpulan

QA sebagai alur diskrit tergantikan oleh kombinasi `triage` (state machine) dan `to-issues` (decomposition). Bila perlu sekadar mengubah ngobrol menjadi tiket cepat tanpa ceremony, polanya — file dulu, minta review nol, domain language, no file paths — tetap layak ditiru di sesi singkat.
