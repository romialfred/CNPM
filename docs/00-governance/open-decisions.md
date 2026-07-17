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
| UX-DEC-013 | Modèle de consentement des contacts publics | Définir le recueil, la conservation, la révocation et la revérification du consentement à publier des coordonnées | Juridique / DPO + Communication | Élevé | Ouverte |

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

### UX-DEC-013 — Modèle de consentement des contacts publics

**Contexte.** `docs/12-member-showcase/requirements.md` impose que « les contacts
publics nécessitent un consentement et une date de vérification », et
`.claude/rules/member-showcase.md` interdit d'exposer un contact personnel sans
consentement. Aucun modèle de consentement n'existe : ni le dictionnaire de données,
ni les fixtures du handoff ne portent ce couple.

**Constat.** L'écran pilote PUB-006 affichait initialement téléphone, courriel et
adresse d'un membre sur une page publique indexable, sans la métadonnée exigée. Sur
des données fictives l'effet est nul ; sur un membre réel, ce serait une publication
de coordonnées sans base.

**État actuel.** Le port `ShowcaseGateway` porte désormais `contactConsent`
(`grantedAt` + `verifiedAt`). L'adaptateur de démonstration le laisse à `null`,
faute de donnée : **la section Contact n'est donc pas rendue**. Un test verrouille
cette absence.

**Décision attendue.** Mode de recueil du consentement, durée de validité, procédure
de revérification, effet d'une révocation sur une vitrine déjà publiée, et
distinction entre contact d'entreprise et contact personnel.

**Impact si non tranché.** Aucune vitrine ne peut publier de coordonnées — la section
Contact prévue par la fiche restera vide. À fermer avant R4.

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

## DATA-DEC-001 — `segment` contredit `status` dans les fixtures de démonstration

**Propriétaire.** Direction produit / responsable du handoff UI.
**Impact.** BO-002 (liste des membres) et tout écran affichant un statut membre.
**Statut.** BLOCKED — décision humaine requise. Contourné sans blocage de la livraison.

**Constat.** Dans `docs/ui-handoff/data/demo-fixtures.json`, l'enregistrement
`CNPM-2024-0528` porte `status: "DORMANT"` et `segment: "Actif"` : les deux champs
se contredisent. Plus largement, `segment` mélange deux natures — un marqueur
(`Grand cotisant`) et des échos du statut (`Actif`, `Dormant`, `Prospect`).

La maquette `ref-bo-002-members-list.png` aggrave la confusion en affichant
`Grand cotisant` **dans la colonne Statut**, au même rang que `Actif` et `Dormant`.

**Lecture retenue pour livrer, à confirmer.** `status` est le champ de cycle de vie
faisant autorité (`ACTIVE`, `DORMANT`, `PROSPECT`) ; `Grand cotisant` est un
marqueur **orthogonal** au statut, et non une quatrième valeur de statut. Deux
éléments convergent :

1. le KPI se nomme `largeContributorsSubset` — un **sous-ensemble**, pas une classe ;
2. le critère d'acceptation de la fiche BO-002 énonce « actifs et dormants composent
   la base de membres, prospects séparés » et **n'y range pas les grands cotisants**.

En conséquence, l'écran rend le statut depuis `status` et n'utilise `segment` que
pour détecter le marqueur `Grand cotisant`. Les échos de statut portés par `segment`
sont ignorés, ce qui neutralise la contradiction de `CNPM-2024-0528` sans la corriger.

**Arbitrage demandé.** Confirmer que `Grand cotisant` est un marqueur orthogonal, puis
soit retirer `segment` des fixtures, soit le restreindre au seul marqueur.

## DATA-DEC-002 — filtres de BO-002 sans donnée correspondante

**Propriétaire.** Direction produit.
**Impact.** BO-002.
**Statut.** PARTIELLEMENT DÉBLOQUÉ — Région et Groupement semés (2026-07-17) ; Secteur,
Niveau de cotisation et Période d'adhésion restent BLOCKED.

**Constat.** La maquette expose sept filtres. Les fixtures ne portent de donnée que
pour quatre d'entre eux.

| Filtre de la maquette | Donnée disponible | Livré |
|---|---|---|
| Statut | `status` | oui |
| Catégorie | `category` | oui |
| Groupement | `member.professional_group` (39 groupements réels, V6) | oui |
| Recherche texte | plusieurs champs | oui |
| Secteur d'activité | aucune taxonomie officielle | non |
| Région | `ref.reference_value` domaine `REGION` (7 CPR, V6) | oui |
| Niveau de cotisation | aucun champ (dépend de DEC-008) | non |
| Période d'adhésion | aucune date d'adhésion (`lastActivity` n'en est pas une) | non |

**Lecture retenue.** Un filtre affiché mais non alimenté est un contrôle mensonger :
il laisse croire à un tri qui n'a pas lieu. Les filtres sans donnée ne sont donc pas
rendus, plutôt que rendus inertes ou peuplés de valeurs inventées.

**Déblocage 2026-07-17 (source : commanditaire).** Le CNPM a désigné son site officiel
`cnpm.ml` (pages *Groupements professionnels* et *CPR*) comme référentiel de sa
nomenclature institutionnelle. La migration `V6__seed_regions_and_professional_groups.sql`
sème donc :

- **7 régions** (Conseils Patronaux de Région) dans `ref.reference_value` domaine `REGION` ;
- **39 groupements professionnels** dans `member.professional_group`.

Il s'agit de la **structure publique** du CNPM (aucune donnée confidentielle de membre,
aucun contact personnel de président de CPR). Quatre points restent à confirmer par le
CNPM avant toute exposition définitive ; la migration étant immuable, leur correction
passera par une V7 :

1. **GCM** — l'extraction du site a renvoyé un libellé dupliqué de CAGCDM (probable
   erreur) ; le sigle est conservé, la dénomination officielle reste à confirmer.
2. **AEPES** — dénomination complète non publiée sur la fiche ; réduite à son sigle.
3. **Taxonomie de secteurs** — le site ne publie **aucune** liste de secteurs d'activité.
   `member.professional_group.sector_code` est laissé `NULL` ; le filtre *Secteur* reste
   non rendu. L'affectation d'un secteur à chaque groupement relève d'un arbitrage CNPM.
4. **District de Bamako** — n'est pas un CPR (siège) ; son ajout éventuel comme 8ᵉ entité
   régionale n'est pas tranché.

**Arbitrage demandé.** (a) Confirmer les 39 groupements et 7 régions semés, corriger
GCM/AEPES ; (b) fournir la taxonomie des secteurs d'activité ; (c) trancher le statut de
Bamako ; (d) fournir les niveaux de cotisation (lié à DEC-008) et confirmer si la date
d'adhésion entre au modèle.

## DATA-DEC-003 — volume du jeu de démonstration des membres

**Propriétaire.** Responsable du handoff UI.
**Impact.** BO-002 (pagination, tri, filtres).
**Statut.** Tranché en tant que décision technique ; signalé pour information.

**Constat.** `members[]` comptait six enregistrements, quand l'écran doit démontrer
pagination, tri et filtres sur une base de plusieurs milliers de membres. Six lignes
ne permettent d'exercer aucun de ces mécanismes : la pagination n'aurait jamais eu
qu'une seule page, et un test vert n'aurait rien prouvé.

**Décision.** Le jeu est étendu à 33 enregistrements synthétiques déterministes
(30 membres — 23 actifs et 7 dormants — plus 3 prospects), dans la continuité stricte
des conventions existantes : raisons sociales fictives, domaines `.example`, montants
en XOF. Aucune donnée réelle de membre, conformément à `CLAUDE.md`.

Les proportions reproduisent celles des KPI (77 % d'actifs) afin que les agrégats
dérivés du jeu restent plausibles. Le panneau de synthèse est **calculé à partir des
membres réellement servis**, et non recopié du bloc `kpis` : un panneau annonçant
4 968 membres au-dessus d'un tableau en annonçant 33 serait exactement le « total
incohérent » que la fiche interdit.

## UX-DEC-014 — éléments du bandeau d'administration sans source

**Propriétaire.** Direction produit.
**Impact.** AdminShell (LAY-001), donc tout écran d'administration.
**Statut.** BLOCKED — décision humaine requise. Livré en périmètre réduit.

**Constat.** La maquette `ref-bo-002-members-list.png` place quatre éléments dans la
barre supérieure. Deux ne s'adossent à aucune spécification.

| Élément | Source | Livré |
|---|---|---|
| Recherche globale | aucun écran de résultats globaux spécifié | oui, restreinte à la liste des membres |
| Identité de session | `GET /auth/me` existe côté backend ; le port web ne l'expose pas | oui, via un port `SESSION_GATEWAY` |
| Cloche de notifications, badge « 8 » | aucun module de notification n'existe ; le « 8 » est un chiffre de maquette | non |
| Menu « Nouvelle action » | aucun contenu de menu n'est spécifié | non |

**Lecture retenue.** La cloche et son compteur ne sont pas rendus. Afficher « 8 »
serait recopier un chiffre de maquette — ce que `ux-ui.md` interdit explicitement —
et une cloche sans compteur reste un contrôle inerte qui promet une fonction absente.
Le menu « Nouvelle action » n'est pas rendu : un menu dont on ignore les entrées ne
peut pas être deviné, et l'en-tête de page porte déjà l'action primaire de l'écran.

La recherche globale est rendue mais honnête sur sa portée : elle cible la liste des
membres, seule collection existante, et son libellé le dit.

**Arbitrage demandé.** Spécifier le module de notifications (source du compteur, portée,
accusé de lecture) et les entrées du menu « Nouvelle action ».

## DATA-DEC-004 — raisons sociales réelles dans les fixtures de démonstration

**Propriétaire.** Responsable du handoff UI / Direction juridique.
**Impact.** Toute capture, story et démonstration affichant la liste des membres.
**Statut.** BLOCKED — décision humaine requise. Non corrigé unilatéralement.

**Constat.** Les six enregistrements d'origine de `members[]` portent des raisons
sociales qui désignent des entreprises maliennes réelles — notamment `SOMACOP SA`,
`BICIM SA` et `SODIMEX SA`. Ces enregistrements sont antérieurs à la présente
implémentation ; ils viennent du handoff.

L'écran BO-002 les affiche avec un statut et un taux de règlement : `BICIM SA` y
apparaît « Dormant » à 46 % réglé, `SODIMEX SA` en « Prospect » à 0 %. Ces mentions
sont inventées de bout en bout, mais elles nomment des tiers identifiables.

**Pourquoi c'est un problème.** `CLAUDE.md` prescrit « aucune donnée réelle de membre
dans les tests, fixtures ou captures ». Une entreprise réelle présentée comme mauvais
payeur dans une capture destinée à circuler est précisément ce que cette règle
prévient — le caractère fictif de la donnée ne protège pas le tiers nommé.

**Ce qui a été fait.** Les 27 enregistrements ajoutés (DATA-DEC-003) emploient des
raisons sociales délibérément inventées (`Sahel Agro SA`, `Bamako Textiles SA`…). Les
six d'origine sont laissés intacts : ils appartiennent au handoff, et les réécrire
sans arbitrage romprait la référence des maquettes déjà produites.

**Arbitrage demandé.** Confirmer le remplacement des six raisons sociales d'origine par
des dénominations sans correspondance réelle, et faire régénérer les maquettes qui les
affichent.

## DATA-DEC-005 — idempotence des créations sans magasin de clés

**Propriétaire.** Architecture / Direction technique.
**Impact.** Toutes les créations sensibles (référentiels, et à terme paiements, reçus).
**Statut.** Tranché en décision technique ; signalé pour information.

**Constat.** `.claude/rules/api.md` et `CLAUDE.md` exigent une clé d'idempotence sur les
créations sensibles, et le contrat déclare l'en-tête `Idempotency-Key` obligatoire. Or
le modèle de données ne comporte **aucun magasin générique de clés d'idempotence** : la
seule idempotence provisionnée est la colonne `payment.payment_transaction.idempotency_key`,
spécifique aux paiements. `ref.reference_value` n'a pas de colonne de clé.

**Décision.** Pour `createReferenceValue`, l'idempotence est portée par la **clé naturelle
(domaine, code)**, dont l'unicité est déjà garantie par
`uq_ref_reference_value_domain_code` :

- même (domaine, code) et contenu identique → la valeur existante est renvoyée (rejeu, 200) ;
- même (domaine, code) et contenu différent → conflit d'état (409) ;
- création concurrente franchissant la vérification préalable → la violation d'unicité
  est traduite en 409.

L'en-tête `Idempotency-Key` reste **exigé** (400 s'il est absent), conformément au
contrat, mais n'est **pas stocké** : la sémantique complète « même clé → même réponse
rejouée » n'est pas implémentée.

**Arbitrage demandé.** Décider si un magasin de clés d'idempotence générique
(table partagée `integration.idempotency_key` ou colonne par table) est introduit avant
les modules financiers, où la sémantique complète de rejeu est réellement critique.

## DATA-DEC-006 — coût du tri par groupement à fort volume (vue membership_list)

**Propriétaire.** Architecture / Direction technique.
**Impact.** BO-002 (`listMemberships`).
**Statut.** Signalé pour information — hypothèse de volume à valider.

**Constat.** La vue `member.membership_list` (V7) résout le groupement principal par une
sous-requête `LATERAL`. Trier sur les colonnes **dérivées** de cette LATERAL
(`primaryGroupName`), sans filtre sélectif, n'est pas indexable sur une vue simple :
un audit DBA indépendant a mesuré ~1 s et ~700 000 buffers pour 20 lignes rendues sur un
banc de **100 000 adhésions**. Les tris/filtres sur colonnes réelles (`status`,
`categoryCode`) et le filtre `groupCode` (39 groupements) restent rapides et indexés.

**Pourquoi ce n'est pas corrigé maintenant.** Le volume réel d'entreprises membres du
CNPM n'est chiffré par aucune source du dépôt. À l'échelle plausible d'un patronat
national (quelques milliers de membres, 39 groupements), le coût est négligeable.
Sur-optimiser (vue matérialisée indexée, ou dénormalisation de `primary_group_id` sur
`member.membership`) avant de connaître le volume serait prématuré et relèverait d'un ADR.

**Arbitrage demandé.** Fournir l'ordre de grandeur du nombre d'entreprises membres. Si
> ~50 000, décider entre (a) vue matérialisée rafraîchie, (b) dénormalisation de
`primary_group_id`, ou (c) restriction du tri par groupement à un usage filtré.

## ARCH-DEC-001 — propriété des tables de groupements professionnels

**Propriétaire.** Architecture.
**Impact.** Module MEMBER et futur module GRP (Groupements).
**Statut.** Tranché en décision technique ; signalé pour information.

**Constat.** `docs/02-architecture/modules.md` liste `GRP` (Groupements professionnels)
comme module logique distinct de `MEM`, et `openapi.yaml` tague `/professional-groups`
sous `GROUP`. Or les tables `member.professional_group` et `member.group_membership` sont
physiquement dans le schéma `member`, et la vue `membership_list` (V7) les lit depuis le
package `member`.

**Décision.** Tant que le module GRP n'est pas implémenté, **MEMBER est propriétaire en
lecture et écriture** de `professional_group` et `group_membership` — cohérent avec
`data-model.md` qui décrit le schéma `member` comme « … adhésions **et groupements** ».
Quand GRP existera, il ne lira pas directement ces tables : il passera par un port exposé
par MEMBER, ou les tables seront déplacées vers un schéma `grp` via un ADR dédié.

## Processus
Toute nouvelle décision porte un identifiant, un propriétaire, une date cible, un impact, des options et une trace d’approbation. Une décision fermée doit être reportée dans les documents, contrats et tests concernés.
