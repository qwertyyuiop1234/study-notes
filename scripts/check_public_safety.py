#!/usr/bin/env python3
"""Check basic public-study-site safety before publishing.

This is intentionally conservative. It only warns; it does not delete files.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SUSPICIOUS = [
    "exam", "midterm", "final", "answer", "solution", "assignment",
    "과제", "정답", "시험", "중간", "기말", "password", "secret",
]

warnings = []
for path in DOCS.rglob("*"):
    if path.is_file():
        low = str(path.relative_to(ROOT)).lower()
        if any(token in low for token in SUSPICIOUS):
            warnings.append(str(path.relative_to(ROOT)))

if warnings:
    print("Potentially sensitive filenames found:")
    for item in warnings:
        print(f"- {item}")
    raise SystemExit(1)

print("No suspicious filenames found.")
