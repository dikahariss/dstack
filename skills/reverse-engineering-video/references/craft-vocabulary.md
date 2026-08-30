# Craft vocabulary — reading a frame, not directing one

A director's reference maps intention to choice: *isolation, therefore extreme
wide*. This skill runs the other way. It reads finished footage, so what it needs
is the reverse map: *this in the frame, therefore that term*.

**An entry earns its place only when a term has a confusable neighbour and the
discriminator is not obvious.** The model already knows what a close-up is. It
does not reliably know that parallax is the only thing separating a dolly from a
zoom, and that is the kind of thing written down here. Terms with no confusable
neighbour are deliberately absent — their absence is not a gap.

Tier notation follows `shot-schema.md`: **[O]** observed, **[I]** inferred.

---

## Framing — the discriminator is where the frame cuts the body

| Term | Cut line | vs its neighbour |
|---|---|---|
| Extreme wide **[O]** | Figure under ~1/8 frame height | vs wide: the *environment* is the subject, the figure is a marker in it |
| Wide **[O]** | Whole figure, headroom and floor | vs medium wide: feet are still in frame |
| Medium wide **[O]** | Knees to head | vs medium: knees visible |
| Medium **[O]** | Waist to head | vs medium close: elbows still in frame |
| Medium close **[O]** | Chest to head | vs close: shoulders fully in frame |
| Close **[O]** | Chin to above hairline | vs extreme close: the whole face fits |
| Extreme close **[O]** | One feature fills the frame | — |

Two-shot, over-the-shoulder and POV are **compositions**, not sizes; record both.
A shot can be a medium two-shot. Ambiguous cut line — a seated figure, a tight
crop on a moving subject — take the widest moment in the shot and say so.

---

## Angle — the discriminator is the horizon, not the subject

| Term | Cue |
|---|---|
| Eye level **[O]** | Horizon crosses the subject's eyes |
| Low angle **[O]** | Horizon below the subject; the ceiling or sky enters |
| High angle **[O]** | Horizon above; the floor or ground dominates |
| Worm's eye **[O]** | Camera at or below ground plane; extreme vertical convergence |
| Bird's eye / top-down **[O]** | Optical axis within ~15° of vertical; no horizon at all |
| Dutch **[O]** | Horizon not level and nothing in the scene is tilted |

The Dutch trap: a level camera pointed at a tilted world is **not** a Dutch
angle. Check a vertical the scene guarantees — a door frame, a lamp post, a
standing figure.

---

## Movement — where frame-sampled reading goes wrong most often

**Dolly versus zoom is the single most common misread.** Both grow the subject.
Only one changes the relationship between planes.

| Term | Cue | vs its neighbour |
|---|---|---|
| Dolly in / out **[O]** | Subject grows **and** foreground-to-background parallax changes; occluded background is revealed or hidden | vs zoom: parallax changes |
| Zoom in / out **[O]** | Subject grows, planes stay locked together, background compresses | vs dolly: no parallax change |
| Push-pull (vertigo) **[O]** | Subject stays the same size while the background swells or shrinks | dolly and zoom running opposite |
| Pan **[O]** | Camera rotates on a vertical axis; near objects sweep faster than far, but nothing is *revealed from behind* another | vs truck: no parallax between planes |
| Truck / track (lateral) **[O]** | Camera translates sideways; near objects pass in front of far ones | vs pan: strong parallax |
| Tilt **[O]** | Rotation on the horizontal axis; verticals converge more as it moves | vs pedestal: convergence changes |
| Pedestal / boom **[O]** | Camera rises or falls; verticals stay parallel | vs tilt: convergence stays put |
| Orbit / arc **[O]** | Background rotates around a subject that stays roughly centred and the same size | vs pan: subject stays put, world turns |
| Tracking / following **[O]** | Subject stays the same size and position while the world moves past | — |
| Handheld **[O]** | Continuous micro-correction, irregular frequency, drift in framing | vs gimbal: gimbal glides, handheld hunts |
| Steadicam / gimbal **[O]** | Smooth translation with a slight float; no drift on the horizon | vs dolly: dolly moves in a straight line, gimbal breathes |
| Whip pan **[O]** | Motion blur streaks across the whole frame for 2–5 frames | often hides a cut — check both sides |
| Crash zoom **[O]** | Zoom completing in under ~0.4 s | vs whip pan: subject stays centred |
| Static / locked **[O]** | No frame-edge motion across the shot | vs a very slow push: compare frame 1 and frame n at the edges, not the centre |

**Static is the default reading.** Claim a movement only when two sampled frames
differ at the frame edge in a way a moving *subject* cannot explain. A subject
walking toward a locked camera grows exactly like a dolly-in on a still subject;
the edges are what separate them.

**Speed:** name it as `slow`, `medium`, `fast`, or as a fraction of frame width
per second when the sheets support it.

---

## Optics — inferred, all of it

| Term | Cue | Tier |
|---|---|---|
| Wide lens | Straight lines bow near frame edges; near objects loom; deep apparent distance between planes | **[I]** |
| Normal lens | Perspective matches unaided vision; no obvious compression or bowing | **[I]** |
| Long lens | Planes stacked and compressed; background much larger relative to subject than distance suggests | **[I]** |
| Macro | Depth of field measured in millimetres on an object smaller than a hand | **[I]** |
| Anamorphic | Oval bokeh, horizontal blue-ish flare streaks, 2.39:1 with slight edge stretching | **[I]** |
| Shallow depth of field | Background dissolved; the focus falloff is *gradual* | **[I]** |
| Deep depth of field | Foreground and background both resolvable | **[I]** |
| Tilt-shift / fake miniature | Blur band runs straight across the frame regardless of depth | vs shallow DOF: blur ignores what is actually far away **[I]** |

Never write a focal length as a number without "reads as" or "approximately". A
frame does not carry its EXIF.

---

## Light — direction and quality are observable; temperature is not

**Direction** — find the shadow, then work backwards.

| Term | Cue |
|---|---|
| Front / on-axis **[O]** | Shadows fall directly behind the subject; flat modelling |
| Side / cross **[O]** | One side lit, the other in shadow, terminator running down the face |
| Back / rim **[O]** | Bright edge on the subject's outline, front in shadow |
| Top **[O]** | Shadow in eye sockets and under the nose and chin |
| Under **[O]** | Shadows cast upward |
| Motivated practical **[O]** | A visible in-frame source — lamp, screen, window, fire — matching the direction |

**Quality** — read the shadow edge, not the brightness.

| Term | Cue |
|---|---|
| Hard **[O]** | Shadow edge sharp enough to trace; high contrast within the shadow |
| Soft **[O]** | Shadow edge graduates over a wide band; shadows retain detail |

**Temperature** is **[I]** always: white balance is a decision made in camera and
again in the grade, so "warm" and "cool" describe the image, never the lamp.
Bands to use: *candle-warm*, *tungsten-warm*, *neutral*, *daylight-cool*,
*shade-blue*. Write a Kelvin figure only with "reads as".

---

## Grade — the palette is measured, the name is a reading

`palette_hex` comes from the frames and is **[O]**. Everything below is **[I]**.

| Term | Cue |
|---|---|
| Teal and orange | Skin pushed warm, shadows and background pushed cyan |
| Bleach bypass | Desaturated with crushed blacks and raised contrast; silver look |
| Lifted blacks / matte | The darkest pixel in the frame is visibly grey |
| Log / flat | Low contrast, low saturation, nothing near black or white — usually ungraded, not a look |
| Day-for-night | Blue cast with daylight shadow direction and full-sun contrast |
| Monochrome | No hue variance; check for a tone (sepia, cyanotype) before writing "black and white" |
| High-key | Bright, low contrast, few shadows — **not** the same as overexposed |
| Low-key | Most of the frame in shadow with small bright areas — **not** the same as underexposed |

The exposure trap: high-key and low-key are lighting *ratios*, over- and
under-exposure are *errors*. Check whether highlights are clipped and shadows
crushed before calling it either.

---

## Motion and speed

| Term | Cue |
|---|---|
| Real time **[O]** | Motion blur consistent with the visible speed |
| Slow motion **[O]** | Motion sharp and detailed at a speed that would normally blur; smooth movement of fast objects |
| Speed ramp **[O]** | Rate visibly changes inside the shot |
| Time-lapse **[O]** | Clouds, crowds or shadows moving at impossible rates; strobing on repeated motion |
| Step / stutter **[O]** | Motion advancing in discrete jumps with no interpolation |
| Frozen / bullet-time **[O]** | Subject motionless while the camera moves around it |

Distinguishing slow motion from a slowly-moving subject: look at *secondary*
motion — hair, cloth, water, dust. Real slow motion slows those too.

---

## Transitions

| Term | Cue |
|---|---|
| Cut **[O]** | One frame to the next, no blend |
| Match cut **[O]** | A cut where a shape, motion or composition carries across |
| Smash cut **[O]** | A cut between extreme opposites — loud to silent, still to violent |
| Dissolve **[O]** | Both images visible at once for several frames |
| Fade to / from black **[O]** | One image and black, never two images |
| Wipe **[O]** | A moving boundary crosses the frame |
| Whip-pan transition **[O]** | Blur on both sides of the cut, matched direction |
| Morph / seamless **[O]** | A moving object masks the join; look for the frame where geometry is impossible |

A dissolve at the sampling rates used here can be missed entirely: a 12-frame
dissolve at 4 fps lands between samples. When `cut_confidence` is low and the
frames on either side share a palette, record `transition_out=unknown` rather
than defaulting to `cut`.
