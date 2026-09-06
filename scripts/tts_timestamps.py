#!/usr/bin/env python3
"""ElevenLabs text-to-speech WITH word timestamps.

Usage: tts_timestamps.py narration.txt out.mp3 words.json [--voice ID] [--model M] [--speed 1.0]
Writes the mp3 and a words.json: {"words":[{"text","start","end"}...]} (seconds).
API key: $ELEVENLABS_API_KEY, or .env next to this repo, or ~/Developer/video-use/.env
"""
import argparse, base64, json, os, sys
from pathlib import Path
import requests

def load_key() -> str:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    for p in [Path(__file__).resolve().parent.parent / ".env", Path.home() / "Developer/video-use/.env"]:
        if p.exists():
            for line in p.read_text().splitlines():
                if line.strip().startswith("ELEVENLABS_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("ELEVENLABS_API_KEY not found")

def synthesize(text: str, voice: str, model: str, speed: float, key: str) -> dict:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128"
    settings = {"stability": 0.5, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True}
    if abs(speed - 1.0) > 1e-6:
        settings["speed"] = speed
    body = {"text": text, "model_id": model, "voice_settings": settings}
    r = requests.post(url, headers={"xi-api-key": key, "Content-Type": "application/json"}, json=body, timeout=300)
    if r.status_code >= 400 and "speed" in settings:
        settings.pop("speed"); body["voice_settings"] = settings
        r = requests.post(url, headers={"xi-api-key": key, "Content-Type": "application/json"}, json=body, timeout=300)
    if r.status_code >= 400:
        sys.exit(f"ElevenLabs error {r.status_code}: {r.text[:400]}")
    return r.json()

def words_from_alignment(al: dict) -> list[dict]:
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None
    for ch, s, e in zip(chars, st, en):
        if ch.isspace():
            if cur: words.append(cur); cur = None
        else:
            if cur is None: cur = {"text": ch, "start": s, "end": e}
            else: cur["text"] += ch; cur["end"] = e
    if cur: words.append(cur)
    return words

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("narration"); ap.add_argument("out_mp3"); ap.add_argument("words_json")
    ap.add_argument("--voice", default="nPczCjzI2devNBz1zQrb")  # Brian
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--speed", type=float, default=1.0)
    a = ap.parse_args()
    text = Path(a.narration).read_text().strip()
    d = synthesize(text, a.voice, a.model, a.speed, load_key())
    Path(a.out_mp3).write_bytes(base64.b64decode(d["audio_base64"]))
    words = words_from_alignment(d["alignment"])
    Path(a.words_json).write_text(json.dumps({"text": text, "voice_id": a.voice, "model": a.model, "speed": a.speed, "words": words}, indent=1))
    print(f"tts: {len(words)} words, {words[-1]['end']:.2f}s -> {a.out_mp3}")

if __name__ == "__main__":
    main()
