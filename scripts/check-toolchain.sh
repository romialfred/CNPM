#!/usr/bin/env sh
set -eu

# Un outil n'est "OK" que s'il s'exécute réellement et retourne une version.
# La simple présence dans le PATH ne suffit pas : sous Windows, les stubs
# Microsoft Store (python3, python) existent dans le PATH mais échouent à
# l'exécution. Les signaler "OK" masquait des contrôles non exécutés.
check() {
  name="$1"
  shift
  if ! command -v "$name" >/dev/null 2>&1; then
    printf '%-12s MISSING\n' "$name"
    return 0
  fi
  if output=$("$@" 2>&1) && first=$(printf '%s\n' "$output" | head -n 1) && [ -n "$first" ] &&
    printf '%s' "$first" | grep -qE '[0-9]+\.[0-9]+'; then
    printf '%-12s OK  %s\n' "$name" "$first"
  else
    first=$(printf '%s\n' "$output" | head -n 1)
    printf '%-12s BROKEN  (présent dans le PATH mais non exécutable) %s\n' "$name" "$first"
  fi
}

check java java -version
check mvn mvn -version
check node node --version
check npm npm --version
check flutter flutter --version
check docker docker --version

# Interpréteur Python : le dépôt appelle python3, mais un stub Store peut
# l'occuper. On rapporte l'interpréteur réellement utilisable.
python_bin=""
for candidate in python3 python py; do
  if command -v "$candidate" >/dev/null 2>&1 &&
    "$candidate" --version >/dev/null 2>&1; then
    python_bin="$candidate"
    break
  fi
done
if [ -n "$python_bin" ]; then
  printf '%-12s OK  %s (via %s)\n' "python" "$("$python_bin" --version 2>&1 | head -n 1)" "$python_bin"
else
  printf '%-12s MISSING\n' "python"
fi

echo
echo "Target baseline: Java 25, Maven 3.9+, Node compatible with Angular 22, Flutter 3.44, Docker/Compose, Python 3.12+."
