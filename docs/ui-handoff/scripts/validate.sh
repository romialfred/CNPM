#!/usr/bin/env sh
set -eu
python3 scripts/verify_assets.py
python3 scripts/build_tokens.py
python3 scripts/validate_handoff.py
python3 scripts/generate_manifest.py
