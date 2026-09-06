#!/usr/bin/env python3
"""Pexels stock video fetcher for faceless-shorts.

fetch_stock(query, dest_dir) -> Path to a 1080x1920 30fps silent mp4 (≥24s, cover-cropped, looped),
cached by query slug. Key: PEXELS_API_KEY in env or ~/Developer/faceless-shorts/.env
"""
import os, re, subprocess, sys
from pathlib import Path
import requests

def load_key() -> str:
    if os.environ.get("PEXELS_API_KEY"): return os.environ["PEXELS_API_KEY"]
    p = Path(__file__).resolve().parent.parent / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            if line.startswith("PEXELS_API_KEY="): return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("PEXELS_API_KEY not found (put it in ~/Developer/faceless-shorts/.env)")

def slug(q: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", q.lower()).strip("-")[:60]

def fetch_stock(query: str, dest_dir: Path, seconds: int = 24, pick: int = 0) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    out = dest_dir / f"{slug(query)}{'' if pick == 0 else f'-{pick}'}.mp4"
    if out.exists() and out.stat().st_size > 100_000: return out
    r = requests.get("https://api.pexels.com/videos/search", headers={"Authorization": load_key()},
                     params={"query": query, "orientation": "portrait", "size": "medium", "per_page": 8}, timeout=60)
    r.raise_for_status()
    vids = r.json().get("videos", [])
    if not vids:
        r = requests.get("https://api.pexels.com/videos/search", headers={"Authorization": load_key()},
                         params={"query": query, "size": "medium", "per_page": 8}, timeout=60)
        vids = r.json().get("videos", [])
    if not vids: sys.exit(f"pexels: no results for '{query}'")
    v = vids[min(pick, len(vids) - 1)]
    files = [f for f in v["video_files"] if f.get("file_type") == "video/mp4" and (f.get("height") or 0) >= 1080]
    files = files or [f for f in v["video_files"] if f.get("file_type") == "video/mp4"]
    f = sorted(files, key=lambda x: abs((x.get("height") or 0) - 1920) + (0 if (x.get("width") or 0) <= (x.get("height") or 0) else 500))[0]
    raw = dest_dir / f".raw-{v['id']}.mp4"
    with requests.get(f["link"], stream=True, timeout=300) as dl:
        dl.raise_for_status()
        with open(raw, "wb") as fh:
            for chunk in dl.iter_content(1 << 20): fh.write(chunk)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", str(raw), "-t", str(seconds), "-an",
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], check=True)
    raw.unlink(missing_ok=True)
    print(f"  stock: '{query}' -> {out.name} (pexels #{v['id']}, {v['duration']}s, by {v.get('user',{}).get('name','?')})")
    return out

if __name__ == "__main__":
    q = sys.argv[1]; d = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("stock")
    print(fetch_stock(q, d))
