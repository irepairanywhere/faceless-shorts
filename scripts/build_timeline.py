#!/usr/bin/env python3
"""beats.json + words.json -> timeline.json (Remotion props).

Each beat has `vo` (spoken text) and `lines`. Text lines use *word* for emphasis.
On-screen words are matched IN ORDER to the spoken words of that beat, so every
word pops exactly when it is said. Non-text lines (icon/image/card/diagram/
terminal/chat/phone/badge/gap) appear right after the previous text line
finishes unless `at` (beat-relative seconds) or `after` (a spoken word) is given.
"""
import json, re, subprocess, sys
from pathlib import Path

def clean(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}

NUM_WORDS = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
             "ten": "10", "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90", "hundred": "100"}

def norm(s: str) -> str:
    t = re.sub(r"[^a-z0-9]", "", s.lower())
    return NUM_WORDS.get(t, t)

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

def element(ln: dict, t: float, image_prefix: str):
    t = round(t, 3)
    if "gap" in ln: return {"kind": "gap", "h": ln["gap"]}
    if "icon" in ln: return clean({"kind": "icon", "name": ln["icon"], "w": ln.get("w"), "t": t, "rotate": ln.get("rotate", 0), "color": ln.get("color"), "bg": ln.get("bg")})
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
        return clean({"kind": "badge", "text": None if b.startswith("icon:") else b, "icon": b[5:] if b.startswith("icon:") else None, "size": ln.get("size"), "t": t})
    return None

def build(project: Path, slug: str, voice_mp3: Path, words_json: Path, music: bool, image_prefix: str) -> dict:
    spec = json.loads((project / "beats.json").read_text())
    vo_words = json.loads(words_json.read_text())["words"]
    dur = audio_duration(voice_mp3) or (vo_words[-1]["end"] + 0.5)
    cursor = 0
    beats_out, warnings = [], []
    for b in spec["beats"]:
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
            el = element(ln, t, image_prefix)
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
    timeline = {
        "fps": 30, "durationSec": beats_out[-1]["end"],
        "voSrc": f"audio/{slug}/voice.mp3",
        "musicSrc": f"audio/{slug}/music.mp3" if music else None,
        "musicVolume": (spec.get("music") or {}).get("volume", 0.12),
        "watermark": spec.get("watermark", ""),
        "theme": spec.get("theme", "paper"),
        "anim": spec.get("anim"),
        "annot": spec.get("annot"),
        "beats": beats_out,
    }
    for w in warnings: print("  warn:", w)
    return timeline

if __name__ == "__main__":
    proj = Path(sys.argv[1]).resolve()
    slug = proj.name
    music = (proj / "music.mp3").exists()
    tl = build(proj, slug, proj / "voice.mp3", proj / "words.json", music, f"images/{slug}")
    (proj / "timeline.json").write_text(json.dumps(tl, indent=1))
    print(f"timeline: {len(tl['beats'])} beats, {tl['durationSec']:.2f}s -> {proj/'timeline.json'}")
