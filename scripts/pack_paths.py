#!/usr/bin/env python3
"""Règles communes de sélection des fichiers du pack.

`generate-manifest.py` et `validate-pack.py` doivent appliquer exactement la
même définition de « fichier versionné », sinon le manifeste et sa validation
divergent. Ce module est la source unique de cette règle.

Le manifeste ne couvre que les fichiers suivis par Git. Les artefacts locaux
(`.env`, `.claude/settings.local.json`, rapports générés) sont ignorés par
`.gitignore` : les inclure faisait échouer `validate-pack.sh` dès qu'on
suivait l'instruction `cp .env.example .env` de `START_HERE.md`.
"""

from __future__ import annotations

from pathlib import Path

EXCLUDED_NAMES = {"MANIFEST_SHA256.txt", "file-inventory.csv", ".DS_Store", "Thumbs.db"}
EXCLUDED_PARTS = {".git", "__pycache__", "node_modules", "target", "dist", "build", ".dart_tool"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}

# Artefacts locaux ignorés par .gitignore, jamais versionnés donc jamais
# attendus dans le manifeste.
LOCAL_ONLY_NAMES = {"CLAUDE.local.md"}
LOCAL_ONLY_PATHS = {".claude/settings.local.json"}
LOCAL_ONLY_PARTS = {"reports", "visual-diff", "secrets", ".venv", ".idea", ".vscode", ".angular", ".gradle", "coverage", "playwright-report", "test-results"}


def is_local_only(rel_posix: str) -> bool:
    """Vrai si le chemin est un artefact local ignoré par Git."""
    parts = rel_posix.split("/")
    name = parts[-1]
    if rel_posix in LOCAL_ONLY_PATHS or name in LOCAL_ONLY_NAMES:
        return True
    if any(part in LOCAL_ONLY_PARTS for part in parts):
        return True
    # .env et ses variantes locales, mais .env.example reste versionné.
    return (name == ".env" or name.startswith(".env.")) and name != ".env.example"


def included(path: Path, root: Path) -> bool:
    """Vrai si le fichier doit figurer dans le manifeste du pack."""
    if not path.is_file() or path.name in EXCLUDED_NAMES or path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    rel = path.relative_to(root)
    if any(part in EXCLUDED_PARTS for part in rel.parts):
        return False
    return not is_local_only(rel.as_posix())
