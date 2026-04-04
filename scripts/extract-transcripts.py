#!/usr/bin/env python3
"""Extract Language Transfer Complete Spanish transcript PDF into per-lesson JSON files.

Each lesson is a JSON array of dialogue turns:
[
  {"speaker": "T", "words": ["Hello", "and", "welcome"]},
  {"speaker": "S", "words": ["Hola"]},
  ...
]
"""

import json
import re
import sys
from pathlib import Path

import pdfplumber


def format_dialogue(text: str) -> list[dict]:
    """Parse transcript text into structured dialogue turns."""
    # Join soft-wrapped lines
    lines = text.split("\n")
    joined = []
    buf = ""
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if buf:
                joined.append(buf)
                buf = ""
            joined.append("")
            continue
        if buf:
            buf += " " + stripped
        else:
            buf = stripped
    if buf:
        joined.append(buf)

    text = "\n\n".join(joined)

    # Split on speaker markers
    text = re.sub(r"(?<=[.!?…])\s+(T:|S:)", r"\n\n\1", text)
    text = re.sub(r"(?<=\S)\s+(T:|S:)\s", r"\n\n\1 ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    turns = []
    for para in paragraphs:
        speaker = None
        body = para
        if para.startswith("T:"):
            speaker = "T"
            body = para[para.index(":") + 1 :].strip()
        elif para.startswith("S:"):
            speaker = "S"
            body = para[para.index(":") + 1 :].strip()

        # Split into word tokens, each with display and clean forms
        raw_tokens = re.split(r"(\s+)", body)
        word_tokens = []
        for t in raw_tokens:
            if not t:
                continue
            if t.strip():
                clean = re.sub(r"[.,;:!?¡¿\"'()\[\]{}…—–-]+$", "", t)
                clean = re.sub(r"^[¡¿\"'(]+", "", clean)
                clean = clean.lower()
                word_tokens.append({"display": t, "clean": clean})
            else:
                word_tokens.append({"display": t, "clean": ""})

        turns.append({"speaker": speaker, "words": word_tokens})

    return turns


def extract(pdf_path: str, output_dir: str = "transcripts"):
    out = Path(output_dir)
    out.mkdir(exist_ok=True)

    pdf = pdfplumber.open(pdf_path)

    # Find all track start pages
    track_pages: list[tuple[int, int]] = []
    for i in range(len(pdf.pages)):
        text = pdf.pages[i].extract_text() or ""
        lines = text.strip().split("\n")
        if lines and re.match(r"^Track\s+(\d+)\s*$", lines[0].strip()):
            num = int(re.search(r"\d+", lines[0]).group())
            track_pages.append((num, i))

    print(f"Found {len(track_pages)} tracks")

    for idx, (track_num, start_page) in enumerate(track_pages):
        if idx + 1 < len(track_pages):
            end_page = track_pages[idx + 1][1]
        else:
            end_page = len(pdf.pages)

        pages_text = []
        for page_idx in range(start_page, end_page):
            page_text = pdf.pages[page_idx].extract_text() or ""
            pages_text.append(page_text)

        full_text = "\n".join(pages_text)
        full_text = re.sub(r"^Track\s+\d+\s*\n+", "", full_text, count=1)

        turns = format_dialogue(full_text)

        filename = out / f"lesson-{track_num:02d}.json"
        with open(filename, "w") as f:
            json.dump(turns, f, ensure_ascii=False, indent=2)

        print(f"Wrote {filename} ({len(turns)} turns, {end_page - start_page} pages)")

    pdf.close()


if __name__ == "__main__":
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "scripts/transcript.pdf"
    extract(pdf_path)
