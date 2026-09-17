#!/usr/bin/env python3
"""Stock footage + reaction GIF fetcher for faceless-shorts.

fetch_stock(query, dest_dir) -> Path to a 1080x1920 (or 1920x1080) 30fps silent mp4 (>=24s, cover-cropped, looped),
cached by query slug. Sources: Pexels first, Pixabay when Pexels has nothing (or source="pixabay" to force it).
fetch_gif(query, dest_dir) -> Path to a looping mp4 (preferred) or .gif from Klipy (free, Tenor-compatible).
Keys in env or ~/Developer/faceless-shorts/.env: PEXELS_API_KEY, PIXABAY_API_KEY, KLIPY_API_KEY.
"""
import os, re, subprocess, sys
from pathlib import Path
import requests

ENV = Path(__file__).resolve().parent.parent / ".env"

def load_key(name: str = "PEXELS_API_KEY", required: bool = True):
    if os.environ.get(name): return os.environ[name]
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            if line.startswith(name + "="): return line.split("=", 1)[1].strip().strip('"').strip("'")
    if required: sys.exit(f"{name} not found (put it in {ENV})")
    return None

def slug(q: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", q.lower()).strip("-")[:60]

def _download(url: str, raw: Path):
    with requests.get(url, stream=True, timeout=300) as dl:
        dl.raise_for_status()
        with open(raw, "wb") as fh:
            for chunk in dl.iter_content(1 << 20): fh.write(chunk)

def _pexels(query: str, landscape: bool, per_page: int = 8) -> list:
    key = load_key("PEXELS_API_KEY", required=False)
    if not key: return []
    H = 1080 if landscape else 1920
    for params in ({"orientation": "landscape" if landscape else "portrait", "size": "medium"}, {"size": "medium"}):
        r = requests.get("https://api.pexels.com/videos/search", headers={"Authorization": key}, params={"query": query, "per_page": per_page, **params}, timeout=60)
        r.raise_for_status()
        out = []
        for v in r.json().get("videos", []):
            files = [f for f in v["video_files"] if f.get("file_type") == "video/mp4" and (f.get("height") or 0) >= 1080] or [f for f in v["video_files"] if f.get("file_type") == "video/mp4"]
            if not files: continue
            f = sorted(files, key=lambda x: abs((x.get("height") or 0) - H) + (0 if ((x.get("width") or 0) >= (x.get("height") or 0)) == landscape else 500))[0]
            out.append({"url": f["link"], "id": f"pexels-{v['id']}", "dur": v.get("duration"), "by": (v.get("user") or {}).get("name", "?"), "src": "pexels"})
        if out: return out
    return []

def _pixabay(query: str, landscape: bool, per_page: int = 8) -> list:
    key = load_key("PIXABAY_API_KEY", required=False)
    if not key: return []
    for params in ({"orientation": "horizontal" if landscape else "vertical"}, {}):
        r = requests.get("https://pixabay.com/api/videos/", params={"key": key, "q": query, "per_page": per_page, "safesearch": "true", **params}, timeout=60)
        r.raise_for_status()
        out = []
        for h in r.json().get("hits", []):
            vs = h.get("videos") or {}
            f = vs.get("large") or vs.get("medium") or vs.get("small")
            if not f or not f.get("url"): continue
            out.append({"url": f["url"], "id": f"pixabay-{h['id']}", "dur": h.get("duration"), "by": h.get("user", "?"), "src": "pixabay"})
        if out: return out
    return []

def fetch_stock(query: str, dest_dir: Path, seconds: int = 24, pick: int = 0, landscape: bool = False, source: str = "auto") -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    W, H = (1920, 1080) if landscape else (1080, 1920)
    out = dest_dir / f"{slug(query)}{'' if pick == 0 else f'-{pick}'}{'-wide' if landscape else ''}{'-px' if source == 'pixabay' else ''}.mp4"
    if out.exists() and out.stat().st_size > 100_000: return out
    vids = []
    if source in ("auto", "pexels"): vids = _pexels(query, landscape)
    if not vids and source in ("auto", "pixabay"): vids = _pixabay(query, landscape)
    if not vids: sys.exit(f"stock: no results for '{query}' (source={source}; keys present: pexels={bool(load_key('PEXELS_API_KEY', False))}, pixabay={bool(load_key('PIXABAY_API_KEY', False))})")
    v = vids[min(pick, len(vids) - 1)]
    raw = dest_dir / f".raw-{v['id']}.mp4"
    _download(v["url"], raw)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", str(raw), "-t", str(seconds), "-an",
                    "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], check=True)
    raw.unlink(missing_ok=True)
    print(f"  stock: '{query}' -> {out.name} ({v['id']}, {v.get('dur')}s, by {v['by']})")
    return out

def fetch_gif(query: str, dest_dir: Path, pick: int = 0) -> Path:
    """Klipy GIF search -> looping mp4 in dest_dir (falls back to .gif). Free key from https://partner.klipy.com/api-keys."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    base = dest_dir / f"gif-{slug(query)}{'' if pick == 0 else f'-{pick}'}"
    for ext in (".mp4", ".gif"):
        if base.with_suffix(ext).exists() and base.with_suffix(ext).stat().st_size > 10_000: return base.with_suffix(ext)
    key = load_key("KLIPY_API_KEY")
    r = requests.get(f"https://api.klipy.com/api/v1/{key}/gifs/search", params={"q": query, "per_page": 12, "customer_id": "faceless-shorts", "content_filter": "medium"}, timeout=60)
    r.raise_for_status()
    js = r.json()
    items = (js.get("data") or {}).get("data") or js.get("data") or js.get("results") or []
    if not items: sys.exit(f"klipy: no results for '{query}'")
    it = items[min(pick, len(items) - 1)]
    files = it.get("file") or it.get("media_formats") or {}
    url = None; ext = ".mp4"
    for size in ("hd", "md", "sm"):
        f = (files.get(size) or {}) if isinstance(files, dict) else {}
        if f.get("mp4", {}).get("url"): url = f["mp4"]["url"]; break
    if not url:
        for size in ("hd", "md", "sm"):
            f = (files.get(size) or {}) if isinstance(files, dict) else {}
            if f.get("gif", {}).get("url"): url = f["gif"]["url"]; ext = ".gif"; break
    if not url and isinstance(files, dict):  # tenor-style
        for k in ("mp4", "gif", "tinygif"):
            if files.get(k, {}).get("url"): url = files[k]["url"]; ext = ".gif" if "gif" in k else ".mp4"; break
    if not url: sys.exit(f"klipy: no downloadable file for '{query}': {list(files)[:6]}")
    out = base.with_suffix(ext)
    raw = out if ext == ".gif" else dest_dir / f".raw-gif-{slug(query)}.mp4"
    _download(url, raw)
    if ext == ".mp4":
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-an", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30", "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], check=True)
        raw.unlink(missing_ok=True)
    print(f"  gif: '{query}' -> {out.name} (klipy {it.get('id') or it.get('slug')})")
    return out

if __name__ == "__main__":
    q = sys.argv[1]; d = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("stock")
    print(fetch_gif(q, d) if os.environ.get("GIF") else fetch_stock(q, d, source=os.environ.get("SOURCE", "auto")))
