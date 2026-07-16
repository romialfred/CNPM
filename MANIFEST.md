# Manifeste du dépôt consolidé

Le fichier `MANIFEST_SHA256.txt` contient l’empreinte SHA-256 de chaque fichier versionnable. L’inventaire détaillé est disponible dans `docs/00-governance/file-inventory.csv`.

Régénération après une modification documentaire ou structurelle :

```bash
python3 scripts/generate-manifest.py
```

Les caches, dépendances installées, builds et fichiers de manifeste eux-mêmes sont exclus.
