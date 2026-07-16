# Registre consolidé des décisions ouvertes

## Décisions métier, techniques et institutionnelles

| ID | Sujet | Décision attendue | Responsable | Échéance / blocage | Impact | Statut |
|---|---|---|---|---|---|---|
| DEC-001 | Hébergement de production | Choisir souverain/on-premise, cloud local/régional ou hybride | CNPM + DSI | Avant architecture physique | Élevé | Ouverte |
| DEC-002 | Opérateurs Mobile Money | Identifier opérateurs, contrats, sandbox et mécanismes de règlement | CNPM Finance | Avant sprint paiement | Critique | Ouverte |
| DEC-003 | Banques et relevés | Lister banques et formats API, ISO 20022, CSV ou MT940 | CNPM Finance | Avant rapprochement | Critique | Ouverte |
| DEC-004 | SMS et e-mail | Choisir les passerelles et confirmer leurs engagements de service | Communication + DSI | Avant notifications | Moyen | Ouverte |
| DEC-005 | Signature des reçus | Choisir certificat, cachet serveur, horodatage et autorité de confiance | Finance + Juridique | Avant reçu officiel | Critique | Ouverte |
| DEC-006 | Durées de conservation | Valider les durées par catégorie et obligations applicables | Juridique / DPO | Avant production | Élevé | Ouverte |
| DEC-007 | Interopérabilité INPS | Obtenir gouvernance, protocole, données et calendrier | CNPM + INPS | Roadmap phase 2 | Élevé | Ouverte |
| DEC-008 | Barèmes de cotisation | Valider grille, paliers, dérogations et exercice de référence | CNPM Finance | Avant appels | Critique | Ouverte |
| DEC-009 | Primes et partage | Valider taux, assiettes, éligibilité, plafonds et litiges | Direction CNPM | Avant module primes | Critique | Ouverte |
| DEC-010 | Distribution mobile | Choisir stores publics, MDM ou distribution privée | DSI CNPM | Avant bêta mobile | Moyen | Ouverte |
| DEC-011 | SLA de production | Valider disponibilité, RTO, RPO, support et pénalités | CNPM + prestataire | Contractualisation | Élevé | Ouverte |
| DEC-012 | Périmètre du PoC | Fixer taille, segments, durée et seuils de succès | Comité de pilotage | Cadrage PoC | Critique | Ouverte |

## Décisions UI/UX et vitrine publique

Le fichier machine `docs/ui-handoff/data/open-decisions.json` conserve les détails tabulaires UI.

| ID | Sujet | Décision attendue | Responsable | Impact | Statut |
|---|---|---|---|---|---|
| UX-DEC-001 | Police de production | Valider Inter ou une police licenciée équivalente | Communication | Moyen | Ouverte |
| UX-DEC-002 | Logo vectoriel | Fournir le SVG/AI officiel et sa zone de protection | Communication | Élevé | Ouverte |
| UX-DEC-003 | Photothèque | Valider images et droits d’utilisation | Communication / Juridique | Élevé | Ouverte |
| UX-DEC-004 | Badge membre vérifié | Définir critères, durée, portée et retrait | Secrétariat / Finance | Élevé | Ouverte |
| UX-DEC-005 | Modération des vitrines | Définir SLA, contenus interdits, recours et suspension | Communication / Juridique | Élevé | Ouverte |
| UX-DEC-006 | URL des vitrines | Choisir `/membres/:slug` ou des sous-domaines | DSI CNPM | Moyen | Ouverte |
| UX-DEC-007 | Langues | Valider les langues publiques et l’ordre de déploiement | Communication | Moyen | Ouverte |
| UX-DEC-008 | Cartographie | Choisir fournisseur, hébergement et consentement | DSI / Juridique | Moyen | Ouverte |
| UX-DEC-009 | Icônes | Valider une bibliothèque unique, proposée : Lucide | Produit / UX | Faible | Ouverte |
| UX-DEC-010 | Seuils visuels | Valider seuils et masques de régression | QA / UX | Moyen | Ouverte |

## Processus
Toute nouvelle décision porte un identifiant, un propriétaire, une date cible, un impact, des options et une trace d’approbation. Une décision fermée doit être reportée dans les documents, contrats et tests concernés.
