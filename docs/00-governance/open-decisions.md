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
| DEC-013 | Taxonomie de release canonique | Choisir le référentiel de release faisant foi | Direction de programme | Avant affectation du backlog | Élevé | **Fermée le 2026-07-16 — `PLANS.md` (R0–R5) fait foi** |

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
| UX-DEC-011 | Récupération, support et méthodes 2FA alternatives | Définir la destination réelle de « mot de passe oublié », du canal de support, des méthodes 2FA autorisées et des codes de secours | DSI + Sécurité + Communication | Élevé | Ouverte |
| UX-DEC-012 | Sémantique du sélecteur d'espace (AUTH-001) | Trancher entre patron ARIA `tablist` et `radiogroup` pour le choix administration/membre | Produit / UX + Accessibilité | Moyen | Ouverte |

## Décisions ouvertes — détail

### UX-DEC-011 — Récupération, support et méthodes 2FA alternatives

**Contexte.** La fiche `ref-auth-001-login.md` exige les affordances « récupération »,
« autre méthode » et « codes de secours si autorisés », et le pattern
`authentication-2fa.md` impose d'afficher les méthodes alternatives. Aucune de ces
destinations n'existe : la récupération de mot de passe est portée par le fournisseur
d'identité (non provisionné), le canal de support n'est pas arbitré, et les méthodes
2FA réellement autorisées relèvent de la politique de sécurité.

**Décision attendue.** Destination de la récupération (flux Keycloak hébergé ou
parcours CNPM), canal de support publiable, liste des méthodes 2FA autorisées par
profil, politique de codes de secours.

**État actuel — BLOCKED.** Aucun lien n'est affiché sur `AUTH-001` tant que la
destination n'existe pas : une affordance visible qui ne mène nulle part est un
défaut, et fabriquer une adresse de support serait inventer une donnée
institutionnelle. Les emplacements sont marqués en commentaire dans
`web/src/app/features/auth/login.page.html` et `verify.page.html`.

**Options.** (1) Déléguer récupération et méthodes à Keycloak (rapide, cohérent avec
ADR-003, mais rupture visuelle avec le gabarit CNPM). (2) Parcours CNPM natif relayant
Keycloak (cohérence visuelle, coût et surface de sécurité accrus).

### UX-DEC-012 — Sémantique du sélecteur d'espace (AUTH-001)

**Contexte.** La fiche nomme le composant « Tabs espace administration / membre », et
l'implémentation utilise le patron ARIA `tablist`. Or l'audit accessibilité indépendant
relève que sélectionner un onglet ne révèle aucun `tabpanel` : le choix paramètre la
soumission (realm/destination) sans changer de contenu visible. Le contrat ARIA de
`tab` suppose un panneau associé ; un lecteur d'écran annonce « onglet sélectionné »
puis l'utilisateur cherche un panneau qui n'existe pas.

**Décision attendue.** Conserver `tablist` (fidélité au vocabulaire de la fiche) ou
adopter `radiogroup` (fidélité à la sémantique réelle : choix exclusif paramétrant un
formulaire).

**Recommandation technique.** `radiogroup`, avec le contrôle placé dans le `<form>`.
C'est la sémantique réelle et cela supprime un contrat ARIA incomplet. Impacte le
vocabulaire de la fiche et le catalogue de composants, d'où l'arbitrage UX.

**Impact si non tranché.** Le patron actuel reste incomplet (`tab` sans `tabpanel`,
sans `aria-controls`). Défaut d'accessibilité MAJEUR ouvert, non bloquant pour le reste
de l'écran.

## Décisions fermées — détail

### DEC-013 — Taxonomie de release canonique

**Contexte.** Trois référentiels de release se contredisaient, rendant impossible
l'affectation traçable des 144 stories du backlog :

| Source | Taxonomie |
|---|---|
| `PLANS.md` | R0 → R5 (6 releases) |
| `docs/01-product/release-plan.md` | Release 0 → 3 (4 releases) |
| `docs/01-product/product-backlog.md` | `R1 - PoC / socle`, `R2 - Déploiement élargi`, `R3 - Innovation` |

**Options examinées.**

1. `PLANS.md` (R0–R5) fait foi — cohérent avec `CLAUDE.md` et le prompt maître,
   qui désignent tous deux `PLANS.md` comme plan opérationnel principal. Impose
   de réaligner `release-plan.md` et les 144 stories.
2. `release-plan.md` (Release 0–3) fait foi — impose de remapper `PLANS.md` et le
   backlog vers 4 releases, en contradiction avec la hiérarchie des sources.

**Décision (2026-07-16).** Option 1 : **`PLANS.md` (R0–R5) est la taxonomie
canonique.** Motif : `CLAUDE.md` et le prompt maître d'implémentation le
désignent explicitement comme plan opérationnel principal ; retenir une autre
source aurait contredit la hiérarchie de `source-of-truth.md`.

**Impacts et travaux induits.**

- `docs/01-product/release-plan.md` : à réaligner sur R0–R5.
- `docs/01-product/product-backlog.md` : les 144 stories portent une `Release
  cible` issue de l'ancienne taxonomie et doivent être remappées.
- `docs/01-product/traceability-matrix.csv` et `test-catalog.csv` : à vérifier.
- Tant que le réalignement n'est pas fait, **aucune affirmation d'appartenance
  d'une story à une release n'est fiable**.

**Trace d'approbation.** Arbitrage utilisateur du 2026-07-16, sollicité par
l'audit initial.

## Processus
Toute nouvelle décision porte un identifiant, un propriétaire, une date cible, un impact, des options et une trace d’approbation. Une décision fermée doit être reportée dans les documents, contrats et tests concernés.
