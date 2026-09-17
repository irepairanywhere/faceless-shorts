#!/usr/bin/env python3
"""One command: projects/<slug>/beats.json -> final.mp4

Steps: narration -> ElevenLabs TTS (cached by text hash) -> optional music
(ElevenLabs Music, cached) -> timeline.json -> copy assets into remotion/public
-> Remotion render -> projects/<slug>/final.mp4

Usage: make_short.py projects/<slug> [--no-render] [--preview] [--voice ID] [--speed 1.05] [--no-music]
"""
import argparse, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
REMOTION = ROOT / "remotion"
sys.path.insert(0, str(ROOT / "scripts"))
from tts_timestamps import load_key, synthesize, words_from_alignment  # noqa: E402
from build_timeline import build  # noqa: E402
from fetch_stock import fetch_stock, fetch_gif  # noqa: E402

def resolve_stock(tl: dict, proj: Path, slug: str):
    """Turn {"bg": {"stock": "query"}} and clip stock queries into files under remotion/public/stock/<slug>/."""
    pub = REMOTION / "public" / "stock" / slug
    wide = int(tl.get("width", 1080)) > int(tl.get("height", 1920))
    for b in tl["beats"]:
        bg = b.get("bg")
        if bg and bg.get("stock"):
            f = fetch_stock(bg["stock"], proj / "stock", pick=int(bg.get("pick", 0)), landscape=wide, source=bg.get("source", "auto"))
            pub.mkdir(parents=True, exist_ok=True); shutil.copy(f, pub / f.name)
            bg["src"] = f"stock/{slug}/{f.name}"; bg.pop("stock", None); bg.pop("pick", None); bg.pop("source", None)
        for l in b["lines"]:
            if l.get("kind") == "clip" and l.get("stock"):
                f = fetch_stock(l["stock"], proj / "stock", landscape=wide)
                pub.mkdir(parents=True, exist_ok=True); shutil.copy(f, pub / f.name)
                l["src"] = f"stock/{slug}/{f.name}"; l.pop("stock", None)
            if l.get("kind") == "gif" and l.get("stock"):
                try:
                    f = fetch_gif(l["stock"], proj / "stock")
                    pub.mkdir(parents=True, exist_ok=True); shutil.copy(f, pub / f.name)
                    l["src"] = f"stock/{slug}/{f.name}"; l.pop("stock", None)
                except BaseException as e:  # Klipy down / no key: fall back to a 3D sticker so the beat still has a visual
                    from build_timeline import resolve_emoji
                    print(f"  warn: gif '{l['stock']}' failed ({str(e)[:80]}); using an emoji sticker instead")
                    t0 = l.get("t", b["start"] + 0.3); l.clear(); l.update({"kind": "emoji", **resolve_emoji("exploding head"), "w": 260, "t": t0})

def sh(cmd, cwd=None):
    print("  $", " ".join(str(c) for c in cmd[:8]), "…" if len(cmd) > 8 else "")
    return subprocess.run(cmd, cwd=cwd, check=True)

def ensure_voice(proj: Path, spec: dict, voice: str, speed: float):
    narration = "\n\n".join(b["vo"].strip() for b in spec["beats"])
    h = hashlib.sha1(f"{voice}|{speed}|{narration}".encode()).hexdigest()[:12]
    stamp = proj / ".voice.hash"
    if (proj / "voice.mp3").exists() and (proj / "words.json").exists() and stamp.exists() and stamp.read_text().strip() == h:
        print("voice: cached"); return
    (proj / "narration.txt").write_text(narration)
    print(f"voice: synthesizing {len(narration)} chars with {voice} @ speed {speed}")
    import base64
    d = synthesize(narration, voice, spec.get("model", "eleven_multilingual_v2"), speed, load_key())
    (proj / "voice.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    words = words_from_alignment(d["alignment"])
    (proj / "words.json").write_text(json.dumps({"text": narration, "voice_id": voice, "speed": speed, "words": words}, indent=1))
    stamp.write_text(h)
    print(f"voice: {len(words)} words, {words[-1]['end']:.2f}s")

def tighten_voice(proj: Path, max_gap: float = 0.42, keep: float = 0.26):
    """Cut dead air between sentences (gaps > max_gap shrink to `keep`) and shift word times. Idempotent."""
    wj = json.loads((proj / "words.json").read_text())
    if wj.get("tightened"): return
    words = wj["words"]
    raw = proj / "voice_raw.mp3"
    if not raw.exists(): shutil.copy(proj / "voice.mp3", raw)
    cuts = []
    if words and words[0]["start"] > 0.25: cuts.append((0.12, words[0]["start"] - 0.05))
    for a, b in zip(words, words[1:]):
        if b["start"] - a["end"] > max_gap: cuts.append((a["end"] + keep, b["start"] - 0.03))
    cuts = [(s_, e_) for s_, e_ in cuts if e_ - s_ > 0.05]
    if cuts:
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(raw)], capture_output=True, text=True).stdout.strip())
        segs, pos = [], 0.0
        for s_, e_ in cuts: segs.append((pos, s_)); pos = e_
        segs.append((pos, dur))
        parts = [f"[0:a]atrim=start={s_:.3f}:end={e_:.3f},asetpts=PTS-STARTPTS[s{i}]" for i, (s_, e_) in enumerate(segs)]
        fc = ";".join(parts) + ";" + "".join(f"[s{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=0:a=1[out]"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-filter_complex", fc, "-map", "[out]", "-c:a", "libmp3lame", "-q:a", "2", str(proj / "voice.mp3")], check=True)
        def shift(t):
            return t - sum(min(e_, t) - s_ for s_, e_ in cuts if s_ < t)
        for w in words: w["start"], w["end"] = round(shift(w["start"]), 3), round(shift(w["end"]), 3)
        wj["removed_s"] = round(sum(e_ - s_ for s_, e_ in cuts), 2)
        print(f"voice: tightened {len(cuts)} gaps, removed {wj['removed_s']}s of dead air -> {words[-1]['end']:.2f}s")
    wj["tightened"] = True
    (proj / "words.json").write_text(json.dumps(wj, indent=1))

def ensure_music(proj: Path, spec: dict, duration_s: float):
    m = spec.get("music")
    if not m or not m.get("prompt"): return False
    out = proj / "music.mp3"
    need_ms = int((duration_s + 3) * 1000)
    stamp = proj / ".music.hash"
    h = hashlib.sha1(f"{m['prompt']}|{need_ms // 5000}".encode()).hexdigest()[:12]
    if out.exists() and stamp.exists() and stamp.read_text().strip() == h:
        print("music: cached"); return True
    print(f"music: generating {need_ms/1000:.0f}s via ElevenLabs Music")
    r = requests.post("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
                      headers={"xi-api-key": load_key(), "Content-Type": "application/json"},
                      json={"prompt": m["prompt"], "music_length_ms": max(10000, min(300000, need_ms)), "model_id": "music_v1"}, timeout=600)
    if r.status_code >= 400 or not r.content[:3] in (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        print(f"  music failed ({r.status_code}): {r.text[:200]} — continuing without music"); return out.exists()
    out.write_bytes(r.content); stamp.write_text(h); return True

def loudnorm(src: Path, dst: Path, I=-14.0, TP=-1.0, LRA=11.0):
    """Two-pass EBU loudness normalization to social targets (-14 LUFS / -1 dBTP). Video stream copied."""
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
    a, b = meas.rfind("{"), meas.rfind("}")
    af = f"loudnorm=I={I}:TP={TP}:LRA={LRA}"
    if a != -1 and b > a:
        m = json.loads(meas[a:b + 1])
        af += f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
        print(f"  loudnorm: {m['input_i']} LUFS -> {I} LUFS")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(dst)], check=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project"); ap.add_argument("--no-render", action="store_true"); ap.add_argument("--preview", action="store_true")
    ap.add_argument("--voice"); ap.add_argument("--speed", type=float); ap.add_argument("--no-music", action="store_true")
    ap.add_argument("--hook", help="name of a hook_variants entry in beats.json; renders the variant as projects/<slug>/variants/<name>/")
    a = ap.parse_args()
    proj = Path(a.project).resolve(); slug = proj.name
    spec = json.loads((proj / "beats.json").read_text())
    if a.hook:
        variants = spec.get("hook_variants") or {}
        if a.hook not in variants: sys.exit(f"no hook variant '{a.hook}' (have: {list(variants)})")
        vdir = proj / "variants" / a.hook; vdir.mkdir(parents=True, exist_ok=True)
        vspec = {k: v for k, v in spec.items() if k != "hook_variants"}
        v = variants[a.hook]; v = v if isinstance(v, list) else [v]
        vspec["beats"] = v + spec["beats"][len(v):]
        (vdir / "beats.json").write_text(json.dumps(vspec, indent=2))
        for sub in ("images", "stock"):
            if (proj / sub).exists() and not (vdir / sub).exists(): os.symlink(proj / sub, vdir / sub)
        proj = vdir; slug = f"{slug}-{a.hook}"; spec = vspec
        print(f"variant: hook '{a.hook}' -> {vdir}")
    voice = a.voice or spec.get("voice_id", "nPczCjzI2devNBz1zQrb")
    speed = a.speed if a.speed is not None else float(spec.get("speed", 1.0))
    ensure_voice(proj, spec, voice, speed)
    if spec.get("tighten", True): tighten_voice(proj, float(spec.get("max_gap", 0.42)), float(spec.get("keep_gap", 0.26)))
    words = json.loads((proj / "words.json").read_text())["words"]
    has_music = False if a.no_music else ensure_music(proj, spec, words[-1]["end"])
    tl = build(proj, slug, proj / "voice.mp3", proj / "words.json", has_music, f"images/{slug}")
    for b in tl["beats"]:
        if b.get("bg", {}).get("stock") or any(l.get("stock") for l in b["lines"]): pass
    tl["sfx"] = (REMOTION / "public" / "sfx" / "pop.mp3").exists() and not spec.get("no_sfx", False)
    tl["sfxLevel"] = float(spec.get("sfx_level", 0.8))
    resolve_stock(tl, proj, slug)
    (proj / "timeline.json").write_text(json.dumps(tl, indent=1))
    print(f"timeline: {len(tl['beats'])} beats, {tl['durationSec']:.2f}s, sfx={'on' if tl['sfx'] else 'off'}")
    # stage assets for Remotion's staticFile()
    pub_a = REMOTION / "public" / "audio" / slug; pub_a.mkdir(parents=True, exist_ok=True)
    shutil.copy(proj / "voice.mp3", pub_a / "voice.mp3")
    if has_music: shutil.copy(proj / "music.mp3", pub_a / "music.mp3")
    if (proj / "images").exists():
        pub_i = REMOTION / "public" / "images" / slug
        if pub_i.exists(): shutil.rmtree(pub_i)
        shutil.copytree(proj / "images", pub_i)
    if a.no_render:
        print("done (no render). Preview: cd remotion && npx remotion studio src/index.ts"); return
    out = proj / ("preview.mp4" if a.preview else "final.mp4")
    cmd = ["npx", "remotion", "render", "src/index.ts", "KineticShort", str(out), f"--props={proj/'timeline.json'}", "--codec=h264", "--crf=19" if not a.preview else "--crf=24", "--log=error"]
    if a.preview: cmd.append("--scale=0.5")
    cmd[5] = str(out.with_suffix(".prenorm.mp4"))
    sh(cmd, cwd=REMOTION)
    loudnorm(out.with_suffix(".prenorm.mp4"), out)
    out.with_suffix(".prenorm.mp4").unlink(missing_ok=True)
    if out.stat().st_size > 28 * 1024 * 1024:  # phone-delivery limit is 30 MiB
        big = out.with_suffix(".big.mp4"); out.rename(big)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(big), "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-c:a", "copy", "-movflags", "+faststart", str(out)], check=True)
        big.unlink(missing_ok=True)
        print(f"  size guard: re-encoded to {out.stat().st_size/1048576:.1f} MiB")
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout.replace("\n", " ")
    print(f"done: {out}  [{probe.strip()}]")

if __name__ == "__main__":
    main()
