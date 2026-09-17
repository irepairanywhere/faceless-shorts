#!/usr/bin/env python3
"""beats.json + words.json -> timeline.json (Remotion props).

Each beat has `vo` (spoken text) and `lines`. Text lines use *word* for emphasis.
On-screen words are matched IN ORDER to the spoken words of that beat, so every
word pops exactly when it is said. Non-text lines (icon/image/card/diagram/
terminal/chat/phone/badge/gap) appear right after the previous text line
finishes unless `at` (beat-relative seconds) or `after` (a spoken word) is given.
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

def clean(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}

# ---- v8 asset resolvers: emoji stickers, brand logos ------------------------------------------------------------
REMOTION = Path(__file__).resolve().parent.parent / "remotion"
FLUENT = Path.home() / "Developer" / "fluentui-emoji" / "assets"   # git clone --depth 1 microsoft/fluentui-emoji (MIT)
BUILTIN_ICONS = {"github", "gemini", "kimi", "glm", "bookmark", "phone", "phone_missed", "phone_dark", "claude", "claude_confused", "starburst"}
DARK = False          # set per beat by build(): dark canvas -> mono brand logos default to white
EXTRA_WARN: list = []
_CACHE: dict = {}

def _json(p: Path):
    if p not in _CACHE: _CACHE[p] = json.loads(p.read_text())
    return _CACHE[p]

def _slug(q: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(q).lower()).strip("-")

def resolve_emoji(q, animated: bool = False) -> dict:
    """{"emoji": "rocket" | "🚀" | "money bag"} -> Microsoft Fluent 3D PNG (public/emoji/, 1,285 stickers) or, with
    animated=True, a Google Noto animated emoji name for @remotion/animated-emoji (411 names; falls back to the sticker)."""
    q = str(q).strip(); s = _slug(q)
    if animated:
        names = _json(REMOTION / "public" / "animated-emoji-names.json")
        hit = next((e for e in names if e["name"] == s), None) or next((e for e in names if s in e.get("tags", []) or e["name"].startswith(s)), None)
        if hit:
            d = REMOTION / "public" / "animated-emoji"; d.mkdir(parents=True, exist_ok=True)
            f = d / f"{hit['name']}-2x.webm"
            if not f.exists() or f.stat().st_size < 1000:
                import urllib.request
                urllib.request.urlretrieve(f"https://raw.githubusercontent.com/remotion-dev/animated-emoji/main/public/{hit['name']}-2x.webm", f)
                print(f"  animated emoji: downloaded {f.name}")
            return {"name": hit["name"], "animated": True}
        EXTRA_WARN.append(f"animated emoji '{q}' is not in the Noto set; using the 3D sticker instead")
    idx = _json(REMOTION / "public" / "emoji-index.json")
    e = idx.get(s) or next((v for v in idx.values() if v.get("glyph") == q), None) \
        or next((v for k, v in idx.items() if k.startswith(s)), None) \
        or next((v for k, v in idx.items() if s in k), None) \
        or next((v for v in idx.values() if s in [_slug(k) for k in v.get("kw", [])]), None)
    if not e:
        EXTRA_WARN.append(f"emoji '{q}' not found in remotion/public/emoji-index.json; showing a question mark")
        e = idx["red-question-mark"]
    # stage a flat copy (Remotion's bundler does not follow symlinked folders; 1,285 PNGs would bloat every bundle)
    src = FLUENT / e["file"]; dst = REMOTION / "public" / "emoji" / (_slug(e["file"].split("/")[0]) + "_3d.png")
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists(): shutil.copy(src, dst)
    return {"src": f"emoji/{dst.name}"}

def _si_hex(key: str):
    for it in _json(REMOTION / "node_modules" / "simple-icons" / "data" / "simple-icons.json"):
        if it.get("slug", re.sub(r"[^a-z0-9]", "", it["title"].lower())) == key: return it.get("hex")
    return None

def resolve_icon(name, color=None) -> dict:
    """Brand logos by name: `lobe:<x>` (AI/LLM logos, @lobehub/icons-static-svg, 906 files incl. -color variants),
    `si:<x>` (simple-icons, 3,459 brands, CC0), `lucide:<x>` (forces Lucide). Unprefixed: builtin -> lobe color -> lobe mono
    -> simple-icons (brand hex, black brands flip to white on dark beats) -> Lucide fallback in the TSX. Colored copies are
    written to remotion/public/brand/ and referenced through `src`."""
    n = str(name); force = None
    if ":" in n and n.split(":", 1)[0] in ("lobe", "si", "lucide"): force, n = n.split(":", 1)
    if force == "lucide" or (force is None and n in BUILTIN_ICONS): return {"name": n}
    key = re.sub(r"[^a-z0-9]", "", n.lower())
    lobe = REMOTION / "node_modules" / "@lobehub" / "icons-static-svg" / "icons"
    si = REMOTION / "node_modules" / "simple-icons" / "icons"
    out = REMOTION / "public" / "brand"; out.mkdir(parents=True, exist_ok=True)
    fill = color or ("#FFFFFF" if DARK else "#111111")
    def mono(src: Path, tag: str) -> str:
        svg = src.read_text()
        svg = svg.replace('fill="currentColor"', f'fill="{fill}"', 1) if 'fill="currentColor"' in svg else svg.replace("<svg ", f'<svg fill="{fill}" ', 1)
        dst = out / f"{tag}-{key}-{fill.strip('#').lower()}.svg"; dst.write_text(svg); return f"brand/{dst.name}"
    if force in (None, "lobe"):
        if not color and (lobe / f"{key}-color.svg").exists():
            dst = out / f"lobe-{key}-color.svg"; shutil.copy(lobe / f"{key}-color.svg", dst); return {"name": n, "src": f"brand/{dst.name}"}
        if (lobe / f"{key}.svg").exists(): return {"name": n, "src": mono(lobe / f"{key}.svg", "lobe")}
    if force in (None, "si") and (si / f"{key}.svg").exists():
        if not color:
            h = _si_hex(key)
            if h and not (DARK and h.lower() in ("000000", "0f0f0f", "111111", "191919", "1a1a1a")): fill = "#" + h.upper()
        return {"name": n, "src": mono(si / f"{key}.svg", "si")}
    if force: EXTRA_WARN.append(f"icon '{name}' not found in {force} set; falling back to Lucide")
    return {"name": n}

NUM_WORDS = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
             "ten": "10", "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90", "hundred": "100"}

TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}
ONES = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9}
TEENS = {"eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17", "eighteen": "18", "nineteen": "19"}
def norm(s: str) -> str:
    t = re.sub(r"[^a-z0-9]", "", s.lower())
    if t in NUM_WORDS: return NUM_WORDS[t]
    if t in TEENS: return TEENS[t]
    m = re.fullmatch(r"(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(one|two|three|four|five|six|seven|eight|nine)?", t)  # "sixty-five" -> 65, so "65×" on screen lands on it
    if m: return str(TENS[m.group(1)] + (ONES[m.group(2)] if m.group(2) else 0))
    return t

def parse_tokens(text: str):
    """-> [(word, emph)] handling *...* spans."""
    out, on = [], False
    for tok in text.split():
        starts, ends = tok.startswith("*"), tok.endswith("*") and len(tok) > 1
        if starts: on = True; tok = tok[1:]
        if ends: tok = tok[:-1]
        emph = on
        if ends: on = False
        out.append((tok, emph))
    return out

def audio_duration(p: Path) -> float:
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True, check=True)
        return float(out.stdout.strip())
    except Exception:
        return 0.0

TIER_STATE: list = []   # v9: chips placed so far, accumulated across beats so each beat only names what it adds
TIER_SEEN = False

def element(ln: dict, t: float, image_prefix: str, extra: dict | None = None):
    t = round(t, 3)
    extra = extra or {}
    if "gap" in ln: return {"kind": "gap", "h": ln["gap"]}
    if "tierboard" in ln:
        # {"tierboard": {"add": {"label": "Backlinks", "grade": "S"}}, "w": 960, "at": 0, "appear": "Backlinks.", "land": "S."}
        # placed chips carry over from earlier beats (override with "placed": [...]); an `add` whose label is already on the
        # board becomes a pulse instead of a second chip (hook variants re-use beats).
        global TIER_SEEN
        spec = ln["tierboard"] if isinstance(ln["tierboard"], dict) else {}
        placed = [dict(p) for p in spec.get("placed", TIER_STATE)]
        add = spec.get("add"); pulse = None; adds = None
        if isinstance(add, list):   # several chips dropping in, each on its own word ("on"); resolved in build()
            adds = [a for a in (extra.get("adds") or []) if not any(p["label"] == a["label"] for p in placed)]
            for i, a in enumerate(adds):
                if a.get("t") is None: a["t"] = round(t + 0.3 + i * 0.25, 3)
            add = None
        elif add and any(p["label"] == add["label"] for p in placed): pulse, add = add["label"], None
        out = clean({"kind": "tierboard", "tiers": spec.get("tiers"), "placed": placed, "add": add, "adds": adds, "pulse": pulse,
                     "enter": (not TIER_SEEN) and not spec.get("stamp"), "stamp": bool(spec.get("stamp")) or None,
                     "pop": TIER_SEEN and extra.get("mid_beat", False), "w": ln.get("w"), "ratio": ln.get("ratio"), "t": t,
                     "appear": extra.get("appear"), "land": extra.get("land"), "colors": spec.get("colors")})
        TIER_STATE[:] = placed + ([add] if add else []) + [{"label": a["label"], "grade": a["grade"]} for a in (adds or [])]
        TIER_SEEN = True
        return out
    if "icon" in ln:
        r = resolve_icon(ln["icon"], ln.get("color"))
        return clean({"kind": "icon", "name": r["name"], "src": r.get("src"), "w": ln.get("w"), "t": t, "rotate": ln.get("rotate", 0), "color": ln.get("color"), "bg": ln.get("bg")})
    if "emoji" in ln:
        e = resolve_emoji(ln["emoji"], bool(ln.get("animated")))
        return clean({"kind": "emoji", **e, "w": ln.get("w"), "t": t, "rotate": ln.get("rotate", 0), "float": ln.get("float", True)})
    if "gif" in ln:
        g = str(ln["gif"])
        return clean({"kind": "gif", "src": g if "/" in g else None, "stock": None if "/" in g else g, "w": ln.get("w"), "h": ln.get("h"), "t": t})
    if "image" in ln: return clean({"kind": "image", "src": f"{image_prefix}/{ln['image']}", "w": ln.get("w", 900), "t": t, "tilt": ln.get("tilt", 0), "blur": ln.get("blur", 0), "reveal": ln.get("reveal", True), "pan": ln.get("pan")})
    if "card" in ln: return clean({"kind": "card", "name": ln["card"], "w": ln.get("w"), "t": t, "title": ln.get("title"), "subtitle": ln.get("subtitle")})
    if "diagram" in ln: return clean({"kind": "diagram", "variant": ln["diagram"], "t": t, "nodes": ln.get("nodes"), "left": ln.get("left")})
    if "terminal" in ln: return clean({"kind": "terminal", "lines": ln["terminal"], "w": ln.get("w"), "title": ln.get("title"), "t": t})
    if "chat" in ln: return clean({"kind": "chat", "text": ln["chat"], "who": ln.get("who", "you"), "w": ln.get("w"), "t": t, "label": ln.get("label")})
    if "phone" in ln: return clean({"kind": "phone", "src": f"{image_prefix}/{ln['phone']}", "w": ln.get("w"), "t": t})
    if "clip" in ln:
        c = ln["clip"]
        return clean({"kind": "clip", "src": c if isinstance(c, str) and "/" in c else None, "stock": c if isinstance(c, str) and "/" not in c else None, "w": ln.get("w"), "h": ln.get("h"), "t": t})
    if "lottie" in ln: return clean({"kind": "lottie", "src": f"lottie/{ln['lottie']}", "w": ln.get("w"), "t": t, "loop": ln.get("loop", True), "speed": ln.get("speed", 1)})
    if "code" in ln: return clean({"kind": "code", "lines": ln["code"], "lang": ln.get("lang", "html"), "title": ln.get("title"), "w": ln.get("w"), "t": t, "theme": ln.get("theme"), "typing": ln.get("typing", True)})
    if "badge" in ln:
        b = str(ln["badge"])
        ic = resolve_icon(b[5:]) if b.startswith("icon:") else None
        return clean({"kind": "badge", "text": None if ic else b, "icon": ic["name"] if ic else None, "iconSrc": ic.get("src") if ic else None, "size": ln.get("size"), "t": t})
    if "bar-chart" in ln:
        spec = ln["bar-chart"] if isinstance(ln["bar-chart"], dict) else {}
        return clean({"kind": "bar-chart", "t": t, "data": spec.get("data"), "max": spec.get("max"), "accentColor": spec.get("accentColor"),
                      "barColor": spec.get("barColor"), "labelWidth": spec.get("labelWidth"), "placement": ln.get("placement")})
    if "browser-frame" in ln:
        spec = ln["browser-frame"] if isinstance(ln["browser-frame"], dict) else {}
        src = f"{image_prefix}/{spec['src']}" if spec.get("src") else None
        return clean({"kind": "browser-frame", "t": t, "url": spec.get("url"), "src": src, "width": ln.get("w"), "height": spec.get("height"), "placement": ln.get("placement")})
    if "device-frame" in ln:
        spec = ln["device-frame"] if isinstance(ln["device-frame"], dict) else {}
        src = f"{image_prefix}/{spec['src']}" if spec.get("src") else None
        return clean({"kind": "device-frame", "t": t, "device": spec.get("device", "phone"), "src": src, "width": ln.get("w"), "placement": ln.get("placement")})
    if "cursor" in ln:
        spec = ln["cursor"] if isinstance(ln["cursor"], dict) else {}
        return clean({"kind": "cursor", "t": t, "fromX": spec.get("fromX"), "fromY": spec.get("fromY"), "toX": spec.get("toX"), "toY": spec.get("toY"),
                      "click": spec.get("click"), "travelDuration": spec.get("travelDuration")})
    return None

def build(project: Path, slug: str, voice_mp3: Path, words_json: Path, music: bool, image_prefix: str) -> dict:
    spec = json.loads((project / "beats.json").read_text())
    vo_words = json.loads(words_json.read_text())["words"]
    dur = audio_duration(voice_mp3) or (vo_words[-1]["end"] + 0.5)
    cursor = 0
    beats_out, warnings = [], []
    global DARK, TIER_SEEN
    TIER_STATE.clear(); TIER_SEEN = False
    theme_dark = spec.get("theme", "paper") in ("midnight", "terminal", "film")
    for b in spec["beats"]:
        bgc = (b.get("bg") or {}).get("color", "")
        DARK = theme_dark or bool((b.get("bg") or {}).get("stock")) or (bgc.startswith("#") and len(bgc) == 7 and int(bgc[1:3], 16) * 0.2126 + int(bgc[3:5], 16) * 0.7152 + int(bgc[5:7], 16) * 0.0722 < 110)
        n = len(b["vo"].split())
        bw = vo_words[cursor:cursor + n]
        cursor += n
        if not bw:
            warnings.append(f"beat {b['id']}: no VO words (cursor past end)"); continue
        b_start = bw[0]["start"]
        c = 0
        last_end = b_start
        lines_out = []
        def find_word(tok, window=6):
            nonlocal c
            nt = norm(tok)
            if not nt: return None
            for j in range(c, min(len(bw), c + window)):
                nj = norm(bw[j]["text"])
                if nj == nt or (len(nt) > 3 and (nj.startswith(nt) or nt.startswith(nj))):
                    c = j + 1
                    return bw[j]
            return None
        for ln in b["lines"]:
            if "text" in ln and ln.get("silent"):
                # on-screen only (not spoken): stagger words after the previous line, consume no VO words
                if "at" in ln: t0 = b_start + float(ln["at"])
                elif "after" in ln:
                    hit = next((w for w in bw if norm(w["text"]) == norm(ln["after"])), None)
                    t0 = (hit["start"] - 0.05) if hit else last_end + 0.05
                else: t0 = last_end + 0.05
                words = []
                for k, (tok, emph) in enumerate(parse_tokens(ln["text"])):
                    words.append({"text": tok, "t": round(t0 + k * 0.08, 3), "end": round(t0 + k * 0.08 + 0.2, 3), "emph": emph})
                lines_out.append(clean({"kind": "text", "words": words, "size": ln.get("size", "md"), "box": bool(ln.get("box")), "color": ln.get("color"), "emphColor": ln.get("emphColor"), "underline": ln.get("underline"), "fit": ln.get("fit"), "annot": ln.get("annot")}))
                if words: last_end = max(last_end, words[-1]["end"])
                continue
            if "text" in ln:
                words = []
                for k, (tok, emph) in enumerate(parse_tokens(ln["text"])):
                    w = find_word(tok, window=20 if k == 0 else 6)
                    if w is None:
                        t = last_end + (0.14 if norm(tok) else 0.0)
                        if norm(tok): warnings.append(f"beat {b['id']}: '{tok}' not found in VO, placed at {t:.2f}")
                        words.append({"text": tok, "t": round(t, 3), "end": round(t + 0.2, 3), "emph": emph})
                        if norm(tok): last_end = t + 0.2
                    else:
                        words.append({"text": tok, "t": round(w["start"], 3), "end": round(w["end"], 3), "emph": emph})
                        last_end = w["end"]
                o = clean({"kind": "text", "words": words, "size": ln.get("size", "md"), "box": bool(ln.get("box")), "color": ln.get("color"), "emphColor": ln.get("emphColor"), "underline": ln.get("underline"), "fit": ln.get("fit"), "annot": ln.get("annot")})
                lines_out.append(o)
                continue
            if "at" in ln:
                t = b_start + float(ln["at"])
            elif "after" in ln:
                hit = next((w for w in bw if norm(w["text"]) == norm(ln["after"])), None)
                t = hit["end"] if hit else last_end
            else:
                t = last_end + 0.05
            extra = {"mid_beat": (t - b_start) > 0.15}
            for key in ("appear", "land"):   # v9 tierboard: chip appears / lands on a spoken word
                if key in ln:
                    hit = next((w for w in bw if norm(w["text"]) == norm(ln[key])), None)
                    if hit: extra[key] = round(hit["start"] + 0.05, 3)
                    else: warnings.append(f"beat {b['id']}: {key} word '{ln[key]}' not found in VO")
            tb = ln.get("tierboard") if isinstance(ln.get("tierboard"), dict) else None
            if tb and isinstance(tb.get("add"), list):
                extra["adds"] = []
                for it in tb["add"]:
                    word = it.get("on") or it.get("appear"); tt = None
                    if word:
                        hit = next((w for w in bw if norm(w["text"]) == norm(word)), None)
                        if hit: tt = round(hit["start"] + 0.05, 3)
                        else: warnings.append(f"beat {b['id']}: on word '{word}' not found in VO")
                    extra["adds"].append({"label": it["label"], "grade": it["grade"], "t": tt})
            el = element(ln, t, image_prefix, extra)
            if el: lines_out.append(el)
            else: warnings.append(f"beat {b['id']}: unknown line {ln}")
        bo = {"id": b["id"], "start": round(max(0.0, b_start - 0.12), 3), "lines": lines_out,
              "layout": b.get("layout", "center"), "grid": b.get("grid", True), "deco": bool(b.get("deco", False)),
              "camera": b.get("camera", {"zoom": [1, 1.05]})}
        if b.get("transition"): bo["transition"] = b["transition"]
        if b.get("anim"): bo["anim"] = b["anim"]
        if b.get("bg"): bo["bg"] = dict(b["bg"])
        beats_out.append(bo)
    if cursor != len(vo_words):
        warnings.append(f"VO word count mismatch: consumed {cursor} of {len(vo_words)}")
    beats_out[0]["start"] = 0.0
    for i, bo in enumerate(beats_out):
        bo["end"] = beats_out[i + 1]["start"] if i + 1 < len(beats_out) else round(dur + 0.6, 3)
        # v8: an element placed `after` the beat's last word would pop as the beat ends and never be seen — pull it in
        for l in bo["lines"]:
            if "t" in l and l["t"] > bo["end"] - 0.6:
                l["t"] = round(max(bo["start"] + 0.05, bo["end"] - 0.6), 3)
    timeline = {
        "fps": 30, "durationSec": beats_out[-1]["end"],
        "voSrc": f"audio/{slug}/voice.mp3",
        "musicSrc": f"audio/{slug}/music.mp3" if music else None,
        "musicVolume": (spec.get("music") or {}).get("volume", 0.12),
        "watermark": spec.get("watermark", ""),
        "theme": spec.get("theme", "paper"),
        "width": 1920 if str(spec.get("aspect", "9:16")) in ("16:9", "landscape", "wide") else 1080,
        "height": 1080 if str(spec.get("aspect", "9:16")) in ("16:9", "landscape", "wide") else 1920,
        "anim": spec.get("anim"),
        "annot": spec.get("annot"),
        "beats": beats_out,
    }
    for w in warnings + EXTRA_WARN: print("  warn:", w)
    EXTRA_WARN.clear()
    return timeline

if __name__ == "__main__":
    proj = Path(sys.argv[1]).resolve()
    slug = proj.name
    music = (proj / "music.mp3").exists()
    tl = build(proj, slug, proj / "voice.mp3", proj / "words.json", music, f"images/{slug}")
    (proj / "timeline.json").write_text(json.dumps(tl, indent=1))
    print(f"timeline: {len(tl['beats'])} beats, {tl['durationSec']:.2f}s -> {proj/'timeline.json'}")
