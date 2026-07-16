# Audit de préservation des sources

## Sources institutionnelles conservées sans modification

| Fichier canonique | SHA-256 |
|---|---|
| `docs/00-sources/TDR_NTA_Digitalisation_Cotisations_CNPM.pdf` | `5b1ed7f3c804628e443d7667d4f79b6e6b862defe4fc351881a76c545f91500d` |
| `docs/00-sources/Specifications_Fonctionnelles_CNPM_v1.1.docx` | `4bac2eaaf96ed405e62bf6fc9450a0d891644afb9ce8f741b3cc01675a392898` |
| `docs/00-sources/Specifications_Fonctionnelles_CNPM_v1.1.pdf` | `ab8c77e9dcf662eda31f7fc48605dbaa4c49f4109a6ddcec4cd1cfc17140a7a0` |
| `docs/00-sources/logo-CNPM.png` | `5698b8d7e7439a01d73339b839ffc8bc4410dc11e4343c3aa0c5c4ac0ba69441` |

Le logo conservé est uniquement le raster fourni dans l’archive. Les reconstructions et favicons non approuvés ne figurent pas dans le dépôt final.

## Livrables opérationnels conservés

| Livrable | Emplacement canonique | SHA-256 |
|---|---|---|
| Backlog, traçabilité et recette | `docs/01-product/CNPM_Backlog_Traceabilite_Recette.xlsx` | `92886b3a7d27d6e87bf0422daddf34fee79d1da16174d11b67b6bd3bf90573bf` |
| DCTD Word | `docs/02-architecture/CNPM_DCTD_v1.0.docx` | `7e4ffcda9466f373a6a854451cf74c38438c36460203d6a5205bd6ff7259b24d` |
| DCTD PDF | `docs/02-architecture/CNPM_DCTD_v1.0.pdf` | `dfdf24da51b1be2f8149f81d4c94e4c812487cab95bd5ac7f245465aee3466c0` |
| Dictionnaire PostgreSQL | `docs/03-data/CNPM_Dictionnaire_Donnees_PostgreSQL.xlsx` | `0accd7fd74547a40ec3a87044551f06ed88a0347fa56b3deab628de0bd4e3ce9` |
| Matrice RBAC | `docs/05-security/CNPM_RBAC_Matrice.xlsx` | `44def4e7937f45ca9034c3d60624ef46cf0f53080621202303562922a242250f` |

## Politique de consolidation

- Une copie unique de chaque source binaire a été retenue.
- Les copies portant un autre nom mais la même empreinte ont été supprimées.
- Les instructions agents et fichiers de configuration ont été fusionnés, réécrits ou remplacés lorsqu’ils étaient concurrents ; leur absence d’identité binaire avec l’archive est donc intentionnelle.
- Les trois copies de tokens destinées au Web et au mobile sont les seules duplications exactes autorisées et sont contrôlées par le validateur.
- Le détail des suppressions se trouve dans `duplicate-removal.csv`.
- L’inventaire final et les empreintes de tous les fichiers versionnables se trouvent dans `file-inventory.csv` et `../../MANIFEST_SHA256.txt`.
