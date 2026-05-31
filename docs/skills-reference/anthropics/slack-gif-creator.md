# Slack GIF Creator

> **Sumber:** [`skills/slack-gif-creator/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/slack-gif-creator/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Buat animated GIF untuk Slack via prompt biasa biasanya berakhir dengan file yang terlalu
besar, dimensi salah, terlalu banyak warna, atau frame yang choppy. Slack punya
constraint spesifik (128x128 untuk emoji, 480x480 untuk message, 48-128 colors, FPS
10-30, durasi <3 detik untuk emoji). Skill ini ngasih utilities (`GIFBuilder`, validator,
easing functions, frame helper) plus konvensi animasi (shake, pulse, bounce, spin, fade,
slide, zoom, particle burst) yang sudah optimal untuk Slack.

Nilai uniknya: filosofi "knowledge + utilities" — skill **tidak** kasih template rigid
atau pre-made graphics, tapi bikin Claude bisa kombinasi PIL primitives dengan disiplin
yang benar (thick line ≥2px, easing function untuk motion natural, color contrast tinggi,
optimasi file size cuma kalau diminta).

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User minta animated GIF untuk Slack.
- Contoh: "make me a GIF of X doing Y for Slack".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buatkan GIF animasi bola api berputar untuk emoji Slack."
- "Bikin Slack GIF yang pulse — logo kami bouncing."
- "Saya butuh animated GIF untuk Slack, ukuran emoji, efek fade-in."
- Kata kunci kanonik (EN): `animated GIF for Slack`, `make me a GIF`,
  `Slack emoji GIF`.

Contoh task lengkap:

> "Buatkan GIF emoji Slack 128x128 — bintang kuning yang berputar
> sambil blink (fade in/out), pakai easing agar motion natural.
> Simpan ke `star_blink.gif`, validasi sudah Slack-ready."

Yang terjadi: skill menulis script Python pakai `GIFBuilder` +
`core.easing.interpolate` untuk spin + fade, meng-generate frames
via PIL `ImageDraw.polygon`, save dengan `num_colors=48,
optimize_for_emoji=True`, lalu run `validate_gif` untuk konfirmasi
file lolos constraint Slack (dimensi, FPS, durasi, color count).

## Cara menggunakannya

### Core workflow

```python
from core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=10)

for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    # ... draw your animation
    builder.add_frame(frame)

builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

### Slack requirements

| Dimensi | Use case |
|---|---|
| 128x128 | Emoji GIF (recommended) |
| 480x480 | Message GIF |

- FPS: 10-30 (lower = smaller file size).
- Colors: 48-128 (fewer = smaller).
- Duration: <3 detik untuk emoji.

### Drawing graphics

- **User upload image**: tanya niat user — direct use ("animate this", "split into frames")
  atau inspirasi ("make something like this"). Load via `PIL.Image.open()`.
- **Drawing from scratch**: pakai PIL `ImageDraw` primitives — `ellipse`, `polygon`,
  `line`, `rectangle`. **JANGAN** pakai emoji font (tidak reliable cross-platform) atau
  asumsi ada pre-packaged graphics di skill ini.

### Making graphics look good (penting)

- **Thick line** — `width=2` minimal untuk outline & line. Width=1 keliatan choppy.
- **Visual depth** — gradient background (`create_gradient_background`), layer multiple
  shape (star dengan smaller star di dalam).
- **Interesting shapes** — circle plus highlight/ring/pattern, star dengan glow
  (larger semi-transparent di belakang), kombinasi multi-shape.
- **Color** — vibrant complementary, contrast tinggi (dark outline on light shape, vice
  versa), composition overall.
- **Complex shapes** (hati, snowflake) — kombinasi polygon + ellipse, hitung point untuk
  simetri, tambah detail (heart highlight curve, snowflake branch).

### Utilities

- `core.gif_builder.GIFBuilder` — assembler + optimizer.
- `core.validators.validate_gif`, `is_slack_ready` — cek apakah file memenuhi requirement.
- `core.easing.interpolate(start, end, t, easing=...)` — smooth motion. Easing
  tersedia: `linear`, `ease_in`, `ease_out`, `ease_in_out`, `bounce_out`, `elastic_out`,
  `back_out`.
- `core.frame_composer` — helper: `create_blank_frame`, `create_gradient_background`,
  `draw_circle`, `draw_text`, `draw_star`.

### Animation concepts (cara berpikir)

- **Shake/Vibrate** — `math.sin()` ke posisi x/y dengan frame index.
- **Pulse/Heartbeat** — scale dengan `math.sin(t * freq * 2 * pi)`, range 0.8-1.2.
- **Bounce** — `interpolate(..., easing='ease_in')` untuk fall, `'bounce_out'` untuk land.
- **Spin** — `image.rotate(angle, resample=Image.BICUBIC)`.
- **Fade** — RGBA alpha channel atau `Image.blend()`.
- **Slide** — start outside frame, easing `ease_out` (atau `back_out` untuk overshoot).
- **Zoom** — scale + crop center.
- **Explode/Particle burst** — particles dengan random angle/velocity, update tiap frame
  + gravity + fade.

Kombinasikan concepts (bounce + rotate, pulse + slide).

### Optimasi file size (hanya kalau diminta)

1. Lower FPS (10 not 20).
2. Fewer colors (`num_colors=48`).
3. Smaller dimension.
4. `remove_duplicates=True`.
5. `optimize_for_emoji=True`.

Resource pendukung (folder `core/`):

- `core/gif_builder.py`, `core/validators.py`, `core/easing.py`, `core/frame_composer.py`.

Dependencies: `pip install pillow imageio numpy`.

## Contoh / Studi kasus

User: *"Bikin GIF emoji untuk Slack — bola basket bounce."*

```python
from core.gif_builder import GIFBuilder
from core.easing import interpolate
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=15)
num_frames = 20

for i in range(num_frames):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)

    t = i / (num_frames - 1)
    # fall + bounce
    if t < 0.6:
        y = interpolate(20, 90, t / 0.6, easing='ease_in')
    else:
        y = interpolate(90, 30, (t - 0.6) / 0.4, easing='bounce_out')

    # basketball
    draw.ellipse([54, y, 74, y+20], fill=(230, 110, 30), outline=(120, 50, 0), width=3)
    # seam line
    draw.line([(64, y), (64, y+20)], fill=(120, 50, 0), width=2)

    builder.add_frame(frame)

builder.save('basket_bounce.gif', num_colors=48, optimize_for_emoji=True)
```

Hasil: GIF 128x128 yang valid untuk Slack emoji.

## Kesimpulan

Skill ini adalah toolkit untuk membuat animated GIF Slack-optimal — utilities
(`GIFBuilder`, validator, easing) plus pengetahuan animasi (8 concept dasar yang bisa
dikombinasi) plus disiplin "graphics look good" (thick line, visual depth, color
contrast). Diniatkan untuk flexible craft, bukan template rigid. Output: file `.gif`
yang valid untuk Slack emoji (128x128) atau message (480x480), siap di-upload. Bukan
untuk video editing umum atau GIF di luar konteks Slack.
