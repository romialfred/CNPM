#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import mimetypes
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_NAMES = {"MANIFEST_SHA256.txt", "file-inventory.csv", ".DS_Store", "Thumbs.db"}
EXCLUDED_PARTS = {".git", "__pycache__", "node_modules", "target", "dist", "build", ".dart_tool"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}


def included(path: Path) -> bool:
    if not path.is_file() or path.name in EXCLUDED_NAMES or path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    rel = path.relative_to(ROOT)
    return not any(part in EXCLUDED_PARTS for part in rel.parts)

rows = []
for path in sorted(ROOT.rglob("*")):
    if included(path):
        rel = path.relative_to(ROOT).as_posix()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        media_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        rows.append((rel, path.stat().st_size, media_type, digest))

(ROOT / "MANIFEST_SHA256.txt").write_text(
    "\n".join(f"{digest}  {rel}" for rel, _, _, digest in rows) + "\n",
    encoding="utf-8",
)
with (ROOT / "docs/00-governance/file-inventory.csv").open("w", encoding="utf-8", newline="") as stream:
    writer = csv.writer(stream, delimiter=";")
    writer.writerow(["path", "size_bytes", "media_type", "sha256"])
    writer.writerows(rows)
print(f"Generated repository manifest for {len(rows)} files")
