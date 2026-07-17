#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import mimetypes
import sys
from pathlib import Path

# Ne pas créer de __pycache__ : validate-pack.py rejette les caches du dépôt.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pack_paths import included  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]

rows = []
for path in sorted(ROOT.rglob("*")):
    if included(path, ROOT):
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
