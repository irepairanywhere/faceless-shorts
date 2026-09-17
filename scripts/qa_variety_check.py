#!/usr/bin/env python3
"""Static pre-render check for beats.json against the repo's own variety/pacing rules.

Adapted from OpenMontage's slideshow-risk scorer concept (github.com/calesthio/OpenMontage)
to this repo's actual beat schema and Ahmed's standing rules in SKILL.md, rather than
OpenMontage's generic scene/shot-language model which doesn't apply to kinetic typography.

Usage: python3 scripts/qa_variety_check.py projects/<slug> [--hook <name>]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DIGIT_RE = re.compile(r"\d")


def word_count(text: str) -> int:
    return len(re.findall(r"[\w'-]+", text or ""))


def beat_runtime_s(beat: dict, speed: float) -> float:
    return word_count(beat.get("vo", "")) / 2.75 / speed


def load_beats(project_dir: Path, hook: str | None) -> dict:
    data = json.loads((project_dir / "beats.json").read_text())
    if hook:
        variants = data.get("hook_variants", {})
        if hook not in variants:
            raise SystemExit(f"no hook_variant named '{hook}'")
        replacement = variants[hook]
        replacement = replacement if isinstance(replacement, list) else [replacement]
        # hook_variants replace the leading beats they were scripted against.
        data = {**data, "beats": replacement + data["beats"][len(replacement):]}
    return data


def check_pacing(data: dict) -> list[str]:
    warnings = []
    speed = data.get("speed", 1.0)
    beats = data.get("beats", [])
    is_vsl = data.get("aspect") == "16:9"

    total_s = sum(beat_runtime_s(b, speed) for b in beats) + 1
    if not is_vsl and total_s > 50:
        warnings.append(f"cap: est. runtime {total_s:.1f}s exceeds the 50s hard cap (rule 7)")

    for i, beat in enumerate(beats):
        dur = beat_runtime_s(beat, speed)
        if dur > 6.5:
            warnings.append(
                f"pace: beat[{i}] '{beat.get('id', i)}' est. {dur:.1f}s of VO — beats should be ≤6s (rule 9)"
            )
    return warnings


def check_starbursts(data: dict) -> list[str]:
    warnings = []
    beats = data.get("beats", [])
    deco_indices = [i for i, b in enumerate(beats) if b.get("deco")]
    if any(i < 2 for i in deco_indices):
        warnings.append("starburst: deco:true found in the first two beats (rule 13 bans this)")
    if len(deco_indices) > 1:
        warnings.append(
            f"starburst: {len(deco_indices)} beats use deco:true, at most 1 per video is allowed (rule 13)"
        )
    return warnings


def check_transitions(data: dict) -> list[str]:
    warnings = []
    beats = data.get("beats", [])
    transitions = [b.get("transition") for b in beats if b.get("transition")]
    if len(transitions) < 2:
        return warnings

    for i in range(1, len(transitions)):
        if transitions[i] == transitions[i - 1]:
            warnings.append(
                f"transition: '{transitions[i]}' repeats back-to-back at beat {i} — never use the same one twice in a row"
            )

    if len(beats) >= 6 and len(set(transitions)) < 3:
        warnings.append(
            f"transition: only {len(set(transitions))} distinct transition(s) used across {len(beats)} beats — mix at least three"
        )
    return warnings


def check_silent_numbers(data: dict) -> list[str]:
    warnings = []
    for i, beat in enumerate(data.get("beats", [])):
        for line in beat.get("lines", []):
            text = line.get("text")
            if text and DIGIT_RE.search(text) and not line.get("silent"):
                warnings.append(
                    f"numbers: beat[{i}] has a spoken (non-silent) line with a digit — "
                    f"'{text}': write it as words in vo, show digits via a silent line (rule 9b): {text!r}"
                )
    return warnings


def check_variety_vs_last(data: dict, project_slug: str) -> list[str]:
    readme = REPO_ROOT / "README.md"
    if not readme.exists():
        return []
    table_start = readme.read_text().find("### Variety log")
    if table_start == -1:
        return []
    table_text = readme.read_text()[table_start:]
    data_rows = [
        line for line in table_text.splitlines()[3:]
        if line.startswith("|") and "---" not in line
    ]
    if not data_rows:
        return []
    last_cells = [c.strip() for c in data_rows[-1].strip("|").split("|")]
    if len(last_cells) < 4:
        return []
    last_video, last_theme, _last_hook, last_anim = last_cells[0], last_cells[1], last_cells[2], last_cells[3]
    if project_slug in last_video:
        return []  # re-checking the same row (e.g. a hook variant) isn't a repeat

    warnings = []
    theme, anim = data.get("theme"), data.get("anim")
    if theme and theme == last_theme and anim == last_anim:
        warnings.append(
            f"variety: theme '{theme}' + anim '{anim}' match the previous video ({last_video}) exactly — "
            f"confirm the opening hook differs (rule 8)"
        )
    return warnings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project_dir")
    parser.add_argument("--hook")
    args = parser.parse_args()

    project_dir = Path(args.project_dir)
    data = load_beats(project_dir, args.hook)

    warnings: list[str] = []
    warnings += check_pacing(data)
    warnings += check_starbursts(data)
    warnings += check_transitions(data)
    warnings += check_silent_numbers(data)
    warnings += check_variety_vs_last(data, project_dir.name)

    for w in warnings:
        print(f"warn: {w}")

    if warnings:
        print(f"qa: {len(warnings)} warning(s) — review before rendering")
    else:
        print("qa: clean")

    return 0


if __name__ == "__main__":
    sys.exit(main())
