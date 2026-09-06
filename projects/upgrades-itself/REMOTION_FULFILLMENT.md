# Comment "REMOTION" — fulfillment

Send this when someone comments REMOTION on the "this video gets better the longer it runs" short.

---

**The one install:**

```
npx skills add remotion-dev/skills
```

That pulls Remotion's official Claude Code skills (12 of them) into `~/.claude/skills/`:

- remotion-best-practices — the router, 80+ rule files
- remotion-create — new projects and compositions
- remotion-markup — animation, timing, text, media rules (the big one)
- remotion-studio — preview
- remotion-render — export
- remotion-captions — word-timed captions
- remotion-maps — map animations
- remotion-saas — Remotion inside an app
- remotion-interactivity — Studio-editable markup
- remotion-docs — searches Remotion's docs on demand
- remotion-upgrade — version upgrades
- remotion-multimedia — browser media handling

What we layered on top for the video pipeline (all free, all open source):
- `@remotion/transitions` (slide / push / wipe / fade), `@remotion/effects` (light leaks), `@remotion/rough-notation` (hand-drawn circles + underlines), `@remotion/layout-utils` (auto-fit text), `@remotion/motion-blur` (trails), `@remotion/lottie`, `@remotion/noise`
- `lucide-react` — 1,500+ icons by name
- `@code-hike/lighter` — syntax-highlighted code windows
- CC0 sound effects from Kenney (via github.com/kapishdima/soundcn)

Repo: github.com/remotion-dev/skills · Docs: remotion.dev

Want the full faceless-video pipeline (ElevenLabs word-timed voice + Remotion, one command from a text file to a finished Short)? Reply "pipeline".
