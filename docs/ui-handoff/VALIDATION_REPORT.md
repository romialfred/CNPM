# Rapport de validation — Handoff UI/UX intégré v1.0.0

**Date de contrôle initial :** 16 juillet 2026  
**Statut :** baseline UI/UX intégrée au dépôt CNPM.

## Couverture
- 101 écrans : 16 publics, 8 authentification, 38 back-office, 20 portail membre et 19 mobile.
- 74 composants.
- 14 références visuelles de 1672 × 941 px.
- Tokens JSON, CSS, SCSS, TypeScript, Flutter et ECharts.
- 10 décisions UX ouvertes.
- Guide Word/PDF de 28 pages et matrice Excel de 9 feuilles.

## Contrôles couverts
Structure, identifiants d’écran, composants, empreintes des références, tokens, JSON Schema, liens Markdown, absence de polices, intégrité Word/PDF/Excel, tests visuels et accessibilité.

## Validation dans le dépôt consolidé
Depuis la racine :

```bash
bash scripts/validate-pack.sh
```

Ou pour le handoff uniquement :

```bash
cd docs/ui-handoff
bash scripts/validate.sh
```

Le fichier racine `CLAUDE.md` configure Claude Code et `AGENTS.md` configure Codex. L’ancien overlay est déjà fusionné et n’est plus livré.

## Preuves
- `validation/guide-docx-a11y.json` : aucune anomalie détectée lors du contrôle initial.
- `validation/guide-pdf-preflight.txt` : PDF de 28 pages, ouvrable, non chiffré et non scanné.
- `MANIFEST.sha256` : empreinte des fichiers du handoff intégré.
