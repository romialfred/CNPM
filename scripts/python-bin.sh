#!/usr/bin/env sh
# Sélectionne un interpréteur Python réellement exécutable.
#
# `command -v python3` réussit sur Windows même quand python3 est le stub
# Microsoft Store, qui échoue à l'exécution. Les validateurs appelés via ce
# stub retournaient un succès sans jamais s'exécuter : un contrôle vert qui ne
# vérifiait rien. On exige donc une exécution réussie, pas une simple présence.
cnpm_python_bin() {
  for candidate in python3 python py; do
    if command -v "$candidate" >/dev/null 2>&1 &&
      "$candidate" -c 'import sys; sys.exit(0)' >/dev/null 2>&1; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  echo "ERREUR: aucun interpréteur Python exécutable (python3, python, py). Python 3.12+ est requis." >&2
  exit 1
}
