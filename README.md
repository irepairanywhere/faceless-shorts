# faceless-shorts

Faceless kinetic-typography Shorts/Reels (the "InsiderForce" look): off-white dot-grid canvas,
words popping in one by one in sync with an AI voiceover, oversized key words, icons/screenshots
dropping in with shadows, slow camera push-ins, orange starburst decor, low music bed, watermark.

## One command
    python3 scripts/make_short.py projects/<slug>            # -> projects/<slug>/final.mp4
    python3 scripts/make_short.py projects/<slug> --preview  # half-res, fast
    python3 scripts/make_short.py projects/<slug> --no-render && (cd remotion && npx remotion studio src/index.ts)

## Make a new video
1. Copy `projects/9router/` to `projects/<slug>/`, drop any screenshots into `projects/<slug>/images/`.
2. Edit `beats.json`: each beat = `vo` (what the voice says) + `lines` (what appears on screen).
   - `{"text": "...", "size": "sm|md|lg|xl", "box": true, "color": "#8E8E8E"}` — wrap words in `*...*` to make them big+bold.
     On-screen words are matched in order to the spoken words, so each word pops when it is said.
   - `{"icon": "github|gemini|kimi|glm|bookmark|claude|claude_confused|starburst", "w": 200, "rotate": -12}`
   - `{"image": "file.png", "w": 900, "tilt": -3, "blur": 3}`  (from projects/<slug>/images/)
   - `{"card": "claude|repo", "w": 760, "title": "...", "subtitle": "..."}`
   - `{"diagram": "bridge|tree", "nodes": ["gemini","kimi","glm"], "left": "claude"}`
   - `{"terminal": ["$ command (typed out)", "✓ green result line", "plain line"], "w": 900, "title": "claude"}` — dark terminal window, lines appear 0.5s apart
   - `{"chat": "message text", "who": "you|ai", "w": 860}` — chat bubble (dark for you, white for Claude)
   - `{"phone": "screen.png", "w": 460}` — phone mockup around a screenshot
   - `{"badge": "1"}` or `{"badge": "icon:github", "size": 170}` — dark circle with a number or logo
   - image extras: `"reveal": true` (blur-to-sharp, default), `"pan": [90, -90]` (camera slides across an oversized shot; use w 1200 + a 1280×560 crop)
   - text extras: `"emphColor": "#E5744C"` colors the *emphasized* words; `"silent": true` = on-screen only (not in the VO), words stagger in after the previous line and consume no spoken words — REQUIRED for any label/box that isn't said out loud, otherwise the matcher derails
   - `{"gap": 40}`; timing overrides for non-text lines: `"at": 0.5` (beat-relative s) or `"after": "GitHub"` (a spoken word)
   - beat options: `layout: center|top`, `grid: true|false`, `deco: true` (starbursts), `camera: {zoom:[1,1.08], pan:[x,y]}`, `transition: zoom|whip|cut` (entry move; alternate whip/zoom for variety)
3. Top-level: `voice_id` (ElevenLabs), `speed` (0.7–1.2), `watermark`, `music: {prompt, volume}` (ElevenLabs Music; delete to skip),
   `theme` (paper | midnight | bold | film | terminal) and `anim` (pop | typewriter | rise | fill). Beats can override `anim`, and set
   `bg: {"stock": "pexels query", "overlay": 0.55}` (film look; fetched from Pexels, 1080×1920 looped) or `bg: {"color": "#hex"}`.
   Element `{"clip": "pexels query", "w": 760}` drops a stock video card inline. `transition: wipe` = full-frame color sweep (bold default).

### Themes
| theme | look | default anim / transition | decor |
|---|---|---|---|
| paper | off-white, Inter, orange starbursts, dot grid | pop / zoom | starbursts when `deco: true` |
| midnight | RLM brand dark #0B0B11, gradient emphasized words, Inter Tight | rise / whip | drifting gradient orbs |
| bold | yellow/black alternating beats, Anton uppercase, hard wipes | rise / wipe | none (the wipes are the decor) |
| film | Pexels video background, dark gradient overlay, Bebas Neue uppercase, grain + vignette | rise / cut | grain |
| terminal | black, Menlo, green cursor, scanlines | typewriter / cut | scanlines |

### Speakable numbers (rule)
The TTS reads "$1,800" and "$3.11" badly. Write currency and awkward figures in words in `vo` ("under two thousand dollars", "just over three dollars each", "over seventeen thousand") and show the digits on screen as a `silent` line with `"after": "<spoken word>"` so it lands on the right word. Plain counts (535, 174) are fine as digits.

### Variety log (never repeat theme + opening back-to-back)
Rules from Ahmed (2026-09-06): no starbursts in the first two beats and at most one starburst beat per video (enforced in KineticShort); open on the subject, not decoration. SFX: same file never within 0.8s, capped per video (ding 2 / tick 3 / shutter 3 / others 4), terminals tick twice max.
| video | theme | opening hook | anim |
|---|---|---|---|
| 9router / made-by-text / video-use / 5-mcp | paper | text + starbursts | pop |
| proof-ad | bold | cold-open "$51,000" slam, wipes | rise |
| intake-ad | film | ringing-phone stock video + "1 IN 3" | rise |
| geo-ad | midnight | chat thread (question → ChatGPT answer) + count-up | rise + fill |
| google-preferred | paper | badge/logo reveal (Google badge drops in, sentence follows) + hand-drawn circle | pop |

Voice + word timings come from ElevenLabs `/with-timestamps` (cached by text hash — edit the VO and it re-synthesizes).
Rendering is Remotion (React) in `remotion/`; the look lives in `remotion/src/theme.ts` and `remotion/src/components/`.
Requires: node 18+, ffmpeg, python3 + requests, ELEVENLABS_API_KEY (env, ./.env, or ~/Developer/video-use/.env).

## Changelog (every batch should add one upgrade)
- 2026-09-06 v1 — 9Router recreation: kinetic text, boxes, icons, cards, bridge/tree diagrams, starbursts, dot grid, music, loudnorm.
- 2026-09-06 v2 — terminal window (typewriter), chat bubbles, phone mockup, logo badges, blur-to-sharp screenshot reveal + camera pan across oversized shots, whip transitions, accent-colored emphasis, starburst drop shadows, number-word matching (forty = 40). Videos: made-by-text, video-use-skill.

- 2026-09-06 v3 (motion + sound) — stronger spring overshoot on every pop, emphasized words punch in from 35% with an accent-color flash and an underline sweep (lg/xl lines), automatic count-up for *emphasized* numbers ≥ 100 (0.7s), lines slide in from alternating sides, elements rotate in, camera drift + 1.08 push-in default, whip = 140px + blur, dot grid drifts, starbursts spin + pulse with shadows. Sound design: ElevenLabs SFX (`remotion/public/sfx/`: whoosh on transitions, pop on emphasized words/elements, tick per terminal line), set `"no_sfx": true` in beats.json to disable. Matcher: 14-word window for a line's first word. `chat` gets `label`; icons `phone`, `phone_missed`, `phone_dark`. Videos: geo-ad, intake-ad, proof-ad.

- 2026-09-06 v4 (variety) — theme system (paper/midnight/bold/film/terminal), word animations (pop/typewriter/rise/fill), wipe transitions, Pexels stock backgrounds + inline clips (`scripts/fetch_stock.py`, key in `.env`), chat labels, silent lines with `after`, 20-word matcher window for a line's first word, 50-second cap.

- 2026-09-06 v5 (pace + sound + hybrid) — voice default 1.1 and automatic dead-air trimming (`tighten`: gaps > 0.42s cut to 0.26s, word times shifted, original kept as voice_raw.mp3); faster pops/entries; SFX library of 8 (whoosh, swish, thud, pop, tick, ding, notify, shutter) mapped by element type, one hit per 0.22s, same sound never twice within 0.45s, `sfx_level` per project; stock footage under ANY theme (`bg.stock` flips text to white, adds grain, keeps the theme's fonts); `hook_variants` + `--hook <name>` render alternate openings into `variants/<name>/` for A/B tests.
- **v6 (2026-09-06) — Remotion skills pack.** Installed `remotion-dev/skills` and rebuilt the scene layer on it: `TransitionSeries` with real presentations (`slide`, `whip`=slide L/R, `fade`, `push`=pushCut, `wipe`, `zoom`=fade + in-scene push-in, `cut`) — each sequence is extended by the next beat's transition length so beats still start on their VO frame; `leak` = `@remotion/effects` light-leak overlay at the cut (full strength before a dark beat, 0.42 on paper); text `fit: true` via `@remotion/layout-utils` fitText (two-pass); `annot: underline|circle|highlight|box|bracket` via `@remotion/rough-notation` (one continuous stroke when the whole line is emphasized); stock/clip video on `@remotion/media` `<Video>` with `bg.start`/`bg.rate`; WebGL2 enabled in `remotion.config.ts` (`angle`). Helpers: `src/components/Fx.tsx`. First video: `projects/google-preferred` (39.7s).
- **v7 (2026-09-06) — libraries.** `icon` now falls back to any **Lucide** icon by kebab name (`{"icon": "mouse-pointer-click", "w": 150, "color": "#fff", "bg": "#E5744C"}`; 1,500+ names at lucide.dev), icons pop with a **motion-blur Trail**; new `lottie` element (`{"lottie": "file.json", "w": 520, "loop": true, "speed": 1}`, files in `remotion/public/lottie/` — drop free LottieFiles JSONs there); new `code` element = syntax-highlighted code window via code-hike lighter (`{"code": [lines], "lang": "html|ts|bash|json|python…", "title": "footer.html", "theme": "github-dark|dracula|one-dark-pro|nord…", "typing": true}`), prefer it over `terminal` for real code; camera drift is now `@remotion/noise` (organic, not sine); SFX rotate through pools (original + CC0 **Kenney** variants in `remotion/public/sfx/kenney/`, from `kapishdima/soundcn`) with per-family caps. Packages: @remotion/lottie, motion-blur, shapes, paths, noise, lucide-react, @code-hike/lighter, codehike. Reference clones: `~/Developer/template-code-hike`, `~/Developer/soundcn`. Smoke test: `projects/_smoke`.

## Hook bank (open differently every time)
| hook | how | best theme |
|---|---|---|
| Cold-open number | silent xl digits at 0.05s, count-up + ding, sentence follows | bold, midnight |
| Footage + one word | `bg.stock` + a single xl word over it ("1 IN 3") | film, any theme |
| Chat thread | two `chat` bubbles (question → answer) then the stat | midnight |
| Typewriter prompt | terminal theme, first line typed with cursor | terminal |
| Color slam | bold theme, solid color beat, xl word + thud, wipe to footage | bold |
| Problem statement | 2-beat variant: pain (footage) → proof (solid) | any |
| Screenshot reveal | blurred `image` sharpening while the hook line lands | paper, midnight |
| Card drop | `card`/`phone` element first, text second | paper |
| Badge / logo reveal | the product's own badge or logo `image` at 0.05s, the claim lands under it, `annot: circle` on the key word | paper, midnight |

## Transition bank
`slide` (from bottom, whoosh) · `whip` (slide from left/right alternating, whoosh) · `fade` · `push` (pushCut with white flash, thud) · `wipe` (directional wipe, thud) · `zoom` (fade + in-scene push-in, swish) · `leak` (light-leak overlay on the cut, swish — use before a DARK beat; on paper it is only a warm flash) · `cut` (silent). Mix at least three per video; never the same one twice in a row.

## Testing hooks (A/B)
1. Put alternatives in `hook_variants: {"name": beat | [beats]}` (a list replaces the first N beats).
2. `make_short.py projects/<slug> --hook name` renders `projects/<slug>/variants/name/final.mp4` (images/stock shared via symlink).
3. Post both, same caption, 24h apart or as two ad creatives; log in `results.csv` below.

## Results log (`results.csv` — fill after posting)
`date,slug,variant,platform,theme,hook,anim,transition,views_24h,views_72h,avg_watch_pct,comments,saves,leads` — the skill reads this to bias the next batch toward what held attention.
1. `ffmpeg -ss <t>` exact frames at ~60% of every beat → nothing clipped at the bottom (watermark zone starts at y=1650), no overflow.
2. Scribe transcript of final.mp4 vs timeline word times → deltas within ±0.15s.
3. `ebur128` → about -14 LUFS, peak ≤ -1 dBTP.
