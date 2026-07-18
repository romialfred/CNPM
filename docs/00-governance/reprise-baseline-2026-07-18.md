# Baseline de reprise — 18 juillet 2026

## Mandat

Le commanditaire confie la reprise complète de la plateforme CNPM avec les objectifs
suivants : conserver les fondations réutilisables, livrer les parcours Web puis les
autres canaux, utiliser des données fictives déterministes lorsque nécessaire et
atteindre une qualité visuelle premium mesurée à **9,8/10 minimum** face aux références
validées.

Cette exigence de fidélité ne change pas la hiérarchie des sources : les PNG gouvernent
la direction artistique et la composition, tandis que les fiches écran, tokens,
contrats et décisions corrigent leurs incohérences métier, de données ou
d'accessibilité.

## Point de départ contrôlé

Baseline Git avant reprise : `b831640` sur
`r0/fondations-securite-runtime-auth-001`. La reprise est isolée dans
`codex/reprise-plateforme-premium`.

| Domaine | Cible canonique | Baseline constatée | État initial |
|---|---:|---:|---|
| Exigences | 144 | 144 tracées | corpus complet, statuts à réaligner |
| Écrans | 101, dont 56 P0 | 16 pages Angular, environ 13 références représentées | démonstration partielle |
| Composants UI | 74, dont 62 P0 | 24 répertoires de design system | partiel |
| API principale | 78 opérations | 19 routes Java | partiel, dérive COT à corriger |
| Schéma PostgreSQL | 73 tables | 73 tables, 9 migrations | fondation disponible |
| Web vers backend | parcours verticaux | aucun `HttpClient` applicatif | non raccordé |
| Backend | 19 modules cibles | ADM, MEM, ENR, COT et socle sécurité/audit partiels | partiel |
| Mobile | 19 écrans | shell et smoke test | amorce |

## Preuves initiales

- Backend : `mvn -f backend/pom.xml -B verify`, **185 tests réussis**, PostgreSQL
  Testcontainers 18.4, neuf migrations appliquées.
- Web : ESLint réussi, **111 tests réussis**, build de production réussi.
- Build Web : six avertissements de budget CSS ; ils imposent une factorisation par le
  design system, pas un relèvement silencieux des seuils.
- Baselines Playwright approuvées : absentes au démarrage de la reprise.
- Authentification réelle, guards d'expérience et adaptateurs HTTP : absents.

## Définition de « terminé » pour la reprise

Une story ou un écran n'est compté comme livré que lorsque tous les éléments
applicables sont présents dans la même tranche :

1. exigence, story, permission et décisions ouvertes identifiées ;
2. contrat OpenAPI/AsyncAPI et migration alignés si nécessaires ;
3. backend, audit, erreurs, concurrence et idempotence implémentés ;
4. adaptateur Angular réel et profil de démonstration explicite ;
5. navigation et actions sans lien mort ;
6. états nominal, chargement, vide, erreur, permission et reprise couverts ;
7. tests unitaires, intégration, contrat et E2E réussis ;
8. axe, clavier, reflow, zoom et viewports obligatoires validés ;
9. capture 1672×941 comparée à la référence, score automatique **≥ 9,8/10** ;
10. revue UX sans écart bloquant et baseline applicative versionnée.

Un score pixel supérieur à 9,8 ne compense jamais un défaut métier, une violation
d'accessibilité, un contenu institutionnel inventé ou une action inerte.

## Ordre de livraison

La taxonomie `R0` à `R5` de `PLANS.md` reste canonique.

| Lot | Résultat attendu | Gate de sortie |
|---|---|---|
| Reprise R0 | routes, navigation, qualité visuelle, IAM et socles fiables | aucun lien mort, CI et baseline propres |
| R1 | membre, entreprise, contact, enrôlement, activation et portail profil | parcours vertical Web/API/PostgreSQL |
| R2 | cotisation, référence, paiement, rapprochement et reçu | décisions DEC-002/003/005/008 fermées ou adaptateurs demo bornés |
| R3 | recouvrement, requêtes, notifications, primes | workflows, SoD et SLA testés |
| R4 | public, annuaire, vitrine, modération et services | checklist de promotion R4 entièrement fermée |
| R5 | BI, exports, mobile, migration et exploitation | performance, sécurité, PRA et recette globale |

## Règle sur les données de démonstration

Les valeurs des maquettes peuvent être reprises pour obtenir la densité visuelle des
tableaux, graphiques et tableaux de bord, sous réserve qu'elles soient synthétiques ou
explicitement signalées comme fictives. Aucun impayé fictif associé à une entreprise
réelle ne doit être diffusé hors d'un environnement de démonstration contrôlé. Aucun
QR, reçu, cachet ou signature ne doit pouvoir être confondu avec un document officiel.

## Décisions qui restent institutionnelles

La reprise ne fabrique pas les opérateurs Mobile Money, formats bancaires, barèmes,
signature des reçus, politiques de conservation, SLA, consentements ou règles de
modération. Les écrans peuvent simuler ces dépendances derrière des adaptateurs de
démonstration, mais leur activation réelle reste conditionnée à `open-decisions.md`.
