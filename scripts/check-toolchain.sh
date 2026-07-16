#!/usr/bin/env sh
set -eu

check() {
  name="$1"
  shift
  if command -v "$name" >/dev/null 2>&1; then
    printf '%-12s OK  ' "$name"
    "$@" 2>&1 | head -n 1
  else
    printf '%-12s MISSING
' "$name"
  fi
}

check java java -version
check mvn mvn -version
check node node --version
check npm npm --version
check flutter flutter --version
check docker docker --version
check python3 python3 --version

echo
echo "Target baseline: Java 25, Maven 3.9+, Node compatible with Angular 22, Flutter 3.44, Docker/Compose, Python 3.12+."
