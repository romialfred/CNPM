#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$ROOT/scripts/python-bin.sh"
"$(cnpm_python_bin)" "$ROOT/scripts/validate-openapi.py"
