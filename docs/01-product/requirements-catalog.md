# Catalogue des exigences

Nombre total : **144**.

## Administration et paramétrage

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| ADM-001 | Must | Créer, modifier, désactiver et historiser chaque valeur de référentiel. | Toute modification conserve auteur, date, ancienne et nouvelle valeur. |
| ADM-002 | Must | Soumettre les changements sensibles à validation à quatre yeux. | Aucune règle financière publiée sans second valideur. |
| ADM-003 | Should | Importer/exporter les référentiels en Excel avec contrôle de format. | Rapport d’erreurs ligne par ligne disponible. |
| ADM-004 | Must | Versionner les barèmes et empêcher les modifications rétroactives non autorisées. | Une version publiée est immutable; une correction crée une nouvelle version. |
| ADM-005 | Could | Simuler l’impact d’un nouveau barème avant publication. | Le système calcule le montant projeté sur la base active. |

## Membres et entreprises

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| MEM-001 | Must | Attribuer un identifiant CNPM unique non réutilisable. | Deux comptes ne peuvent partager le même identifiant. |
| MEM-002 | Must | Détecter les doublons par NIF, RCCM, raison sociale, téléphone et e-mail. | Le système bloque ou soumet à arbitrage selon le score de similarité. |
| MEM-003 | Must | Gérer plusieurs établissements et plusieurs contacts par entreprise. | Un contact principal et un contact financier sont identifiables. |
| MEM-004 | Must | Historiser tout changement de catégorie, groupement, statut ou représentant. | La timeline restitue la valeur, l’auteur, la date et le motif. |
| MEM-005 | Should | Gérer les fusions, changements de raison sociale et successions juridiques. | Les liens entre entités antérieures et nouvelles restent consultables. |
| MEM-006 | Should | Générer une carte membre numérique avec QR sécurisé. | Le QR ouvre une page de vérification sans exposer de données sensibles. |
| MEM-007 | Could | Permettre une vue consolidée groupe de sociétés. | Les soldes et contributions sont agrégés sans fusionner les comptes juridiques. |
| MEM-008 | Must | Exporter la fiche membre complète selon les droits. | PDF horodaté et journalisé, données masquées selon le rôle. |

## Enrôlement et adhésion

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| ENR-001 | Must | Proposer des formulaires adaptatifs selon forme juridique et catégorie. | Les champs et pièces varient automatiquement selon le profil. |
| ENR-002 | Must | Sauvegarder un brouillon et reprendre sur un autre appareil. | Le demandeur récupère son dossier après authentification OTP. |
| ENR-003 | Must | Capturer RCCM, NIF et contacts avec contrôle de format. | Les formats invalides sont refusés avant soumission. |
| ENR-004 | Must | Gérer les pièces obligatoires, facultatives et conditionnelles. | La soumission est bloquée si une pièce requise manque. |
| ENR-005 | Must | Permettre au contrôleur de demander un complément avec motif. | Le membre reçoit la liste exacte et une échéance. |
| ENR-006 | Must | Tracer le consentement, la version de la politique et l’horodatage. | La preuve est exportable pour audit. |
| ENR-007 | Should | Mesurer le taux de conversion par canal, groupement et campagne. | Le tableau de bord présente les étapes d’abandon. |
| ENR-008 | Must | Fonctionner en mode faible connectivité. | Compression images, reprise de chargement et synchronisation différée. |

## Cotisations et échéanciers

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| COT-001 | Must | Générer automatiquement les appels selon l’exercice et le barème. | Chaque membre éligible reçoit un appel unique et traçable. |
| COT-002 | Must | Soumettre une campagne d’appels à simulation puis validation. | Le total, les exceptions et écarts sont visibles avant émission. |
| COT-003 | Must | Émettre l’appel en PDF et via portail, e-mail, SMS ou push. | L’historique de diffusion indique canal, date et statut. |
| COT-004 | Must | Gérer les appels complémentaires, avoirs et annulations. | Chaque correction référence l’appel initial et exige un motif. |
| COT-005 | Must | Gérer les échéanciers et paiements partiels. | Le solde et la prochaine échéance sont recalculés en temps réel. |
| COT-006 | Should | Appliquer automatiquement la période de grâce et les pénalités. | Les règles sont versionnées et visibles dans le détail de calcul. |
| COT-007 | Must | Bloquer la modification d’un appel déjà payé sans workflow d’annulation. | Une opération corrective génère une écriture compensatrice. |
| COT-008 | Must | Produire une situation de compte certifiable à une date donnée. | Le document restitue appels, paiements, soldes et ajustements. |

## Paiements et rapprochement

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| PAY-001 | Must | Générer une référence de paiement unique et non prédictible. | La référence permet d’identifier membre, appel et canal sans exposer d’information sensible. |
| PAY-002 | Must | Recevoir les statuts des opérateurs via API sécurisée. | Chaque callback est authentifié, idempotent et journalisé. |
| PAY-003 | Must | Importer les relevés bancaires en formats configurables. | Le système détecte doublons, incohérences et lignes non imputées. |
| PAY-004 | Must | Rapprocher automatiquement par référence, montant, date et payeur. | Un score explique la proposition; le seuil est paramétrable. |
| PAY-005 | Must | Présenter une file de rapprochement manuel. | L’agent voit preuve, candidat, écarts et historique avant décision. |
| PAY-006 | Must | Gérer trop-perçus, sous-paiements, remboursements et rejets. | Chaque cas suit un workflow comptable et laisse une piste d’audit. |
| PAY-007 | Must | Empêcher la double confirmation d’une transaction. | Les clés d’idempotence et contrôles d’unicité bloquent le doublon. |
| PAY-008 | Should | Alerter sur les anomalies et paiements suspects. | Règles : montant inhabituel, canal incohérent, répétition, modification de compte. |

## Reçus et attestations

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| REC-001 | Must | Émettre un reçu uniquement après confirmation CNPM. | Aucun reçu officiel ne peut être produit sur paiement non confirmé. |
| REC-002 | Must | Inclure numéro unique, membre, montant, période, canal, date et signature. | Le PDF contient toutes les mentions obligatoires et le logo CNPM. |
| REC-003 | Should | Signer électroniquement et apposer un QR de vérification. | Le QR valide l’authenticité sans exposer de données confidentielles. |
| REC-004 | Must | Notifier le membre par portail, e-mail, SMS et/ou push. | Le statut de livraison est conservé. |
| REC-005 | Must | Annuler/remplacer un reçu via workflow contrôlé. | Le reçu annulé reste archivé et la version de remplacement le référence. |
| REC-006 | Should | Permettre la vérification publique limitée d’un reçu. | La page confirme authenticité, statut et montant sans données excessives. |

## Recouvrement et relances

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| REL-001 | Must | Configurer des séquences par événement, délai, canal et segment. | Exemple : J-15 e-mail, J-7 SMS, J+3 appel, J+15 courrier. |
| REL-002 | Must | Personnaliser les messages avec données membre et solde. | Les modèles affichent un aperçu avant envoi. |
| REL-003 | Must | Gérer les consentements et préférences de communication. | Le canal non autorisé n’est jamais utilisé, sauf obligation légale. |
| REL-004 | Must | Suspendre automatiquement les relances en cas de litige ou promesse active. | La suspension est visible et datée. |
| REL-005 | Must | Créer et suivre les promesses de paiement. | Montant, date, commentaire et statut tenu/non tenu sont obligatoires. |
| REL-006 | Should | Planifier appels, visites et rendez-vous. | Les tâches apparaissent dans l’agenda et le portefeuille de l’agent. |
| REL-007 | Must | Mesurer performance par campagne, agent, canal et segment. | Taux de contact, conversion, montant récupéré, coût et délai moyen. |
| REL-008 | Could | Proposer une priorisation assistée par score. | Le score est explicable et ne décide pas seul d’une sanction. |

## Portail et application membre

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| PRT-001 | Must | Connexion par mot de passe ou OTP avec 2FA selon risque. | Le membre peut récupérer son accès sans intervention manuelle abusive. |
| PRT-002 | Must | Consulter le détail des cotisations et télécharger les appels. | Les calculs et ajustements sont explicités. |
| PRT-003 | Must | Initier un paiement et suivre son statut. | Le statut est actualisé et les échecs sont expliqués. |
| PRT-004 | Must | Télécharger reçus, attestations et carte membre. | Les documents sont signés et vérifiables. |
| PRT-005 | Must | Mettre à jour les informations soumises à validation. | Les changements sensibles restent en attente jusqu’à validation. |
| PRT-006 | Must | Déposer et suivre une requête ou réclamation. | Le membre voit le SLA, les réponses et les pièces demandées. |
| PRT-007 | Should | Inscrire des représentants aux événements. | Confirmation, QR d’accès et rappel automatiques. |
| PRT-008 | Should | Gérer les utilisateurs délégués de l’entreprise. | Le représentant principal attribue des droits limités. |
| PRT-009 | Should | Utiliser l’application en français et préparer d’autres langues. | Tous les libellés sont externalisés et traduisibles. |
| PRT-010 | Should | Recevoir des notifications push pertinentes. | Les préférences sont modifiables et la désinscription respectée. |

## Requêtes et réclamations

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| REQ-001 | Must | Attribuer un numéro de dossier unique et un accusé de réception. | Le membre reçoit numéro, date et délai cible. |
| REQ-002 | Must | Qualifier automatiquement ou manuellement la demande. | Catégorie, priorité, service, confidentialité et responsable sont définis. |
| REQ-003 | Should | Affecter selon compétence, charge et groupement. | L’affectation automatique peut être reprise avec motif. |
| REQ-004 | Must | Gérer échanges, pièces, commentaires internes et réponses externes. | Les notes internes ne sont jamais visibles du membre. |
| REQ-005 | Must | Suivre SLA, relances internes et escalades. | Des alertes sont envoyées avant et après dépassement. |
| REQ-006 | Should | Permettre au membre de réouvrir dans un délai paramétrable. | Le motif de réouverture est obligatoire. |
| REQ-007 | Should | Mesurer satisfaction et qualité de service. | Score, verbatim et motif d’insatisfaction sont exploitables en BI. |
| REQ-008 | Could | Capitaliser les réponses en base de connaissances. | Une réponse validée peut être transformée en article FAQ. |

## Groupements professionnels

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| GRP-001 | Must | Créer les groupements, responsables, mandats et zones. | Chaque membre est rattaché à un ou plusieurs groupements selon règles. |
| GRP-002 | Must | Attribuer un portefeuille de prospects et membres. | Le groupement ne voit que son périmètre autorisé. |
| GRP-003 | Must | Suivre objectifs d’enrôlement, cotisation et réactivation. | Les objectifs et réalisations sont comparables par période. |
| GRP-004 | Should | Former et habiliter des référents de groupement. | Le système suit habilitation, date de formation et expiration. |
| GRP-005 | Should | Gérer les commissions, membres, mandats et documents. | L’historique des compositions est conservé. |
| GRP-006 | Must | Produire des tableaux de bord sectoriels. | Encaissements, adhésions, retard et engagement par groupement. |

## Primes et partage de revenus

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| PRI-001 | Must | Associer chaque encaissement à une catégorie de mobilisation. | La catégorie est déterminée par règle et peut être corrigée avec validation. |
| PRI-002 | Must | Calculer automatiquement la prime selon taux, base et plafonds. | Le détail de calcul est explicable et exportable. |
| PRI-003 | Must | Gérer contestations, corrections et rétrocessions. | Aucune suppression; les ajustements sont tracés. |
| PRI-004 | Must | Produire un état mensuel soumis à commission de vérification. | État par agent, catégorie, membre, encaissement et montant. |
| PRI-005 | Must | Valider puis figer la période de prime. | Une période clôturée ne change que par réouverture autorisée. |
| PRI-006 | Must | Calculer la rémunération du prestataire sur encaissements éligibles. | Les cotisants maintenus sur l’ancien système sont exclus. |
| PRI-007 | Should | Comparer encaissement brut, frais canal, prime et net CNPM. | Le rapport de réconciliation détaille chaque composante. |

## Gestion électronique des documents

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| GED-001 | Must | Stocker les documents avec type, version, date, auteur et confidentialité. | Chaque document est rattaché à un objet métier et historisé. |
| GED-002 | Must | Analyser les fichiers par antivirus et contrôler extensions/tailles. | Un fichier dangereux est bloqué et l’incident journalisé. |
| GED-003 | Must | Gérer expiration des pièces et alertes de renouvellement. | Le membre et le gestionnaire sont alertés avant échéance. |
| GED-004 | Should | Appliquer des durées de conservation et gel légal. | La suppression respecte la politique et les litiges en cours. |
| GED-005 | Could | Rechercher par métadonnées et contenu OCR. | Les scans lisibles deviennent interrogeables. |
| GED-006 | Must | Générer les documents depuis des modèles approuvés. | Les données fusionnées sont contrôlées et le modèle versionné. |

## Événements et formations

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| EVT-001 | Should | Créer événements, sessions, capacités, lieux et publics cibles. | Les inscriptions sont limitées selon critères et capacité. |
| EVT-002 | Should | Permettre l’inscription des représentants du membre. | Confirmation et QR individuel générés. |
| EVT-003 | Could | Gérer présence, certificat et satisfaction. | La participation alimente l’indicateur d’engagement membre. |
| EVT-004 | Should | Publier actualités et documents ciblés. | Le contenu peut être public, réservé ou limité à un segment. |

## Décisionnel et reporting

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| BI-001 | Must | Filtrer par période, exercice, membre, catégorie, secteur, groupement et canal. | Les filtres s’appliquent à tous les visuels cohérents. |
| BI-002 | Must | Naviguer du KPI agrégé jusqu’à la transaction autorisée. | Le drill-down respecte les habilitations et masque les données sensibles. |
| BI-003 | Must | Exporter en Excel, PDF et CSV avec horodatage. | L’export conserve filtres, auteur et date. |
| BI-004 | Should | Programmer l’envoi de rapports aux destinataires autorisés. | Fréquence, format, filtre et durée de validité configurables. |
| BI-005 | Must | Définir objectifs et seuils d’alerte. | Les alertes montrent écart, cause probable et lien vers détail. |
| BI-006 | Should | Afficher tendances, comparaisons N/N-1 et prévisions. | Les méthodes de prévision et marges d’incertitude sont documentées. |
| BI-007 | Must | Maintenir un dictionnaire des KPI. | Définition, formule, source, fréquence et propriétaire accessibles. |
| BI-008 | Could | Permettre des tableaux de bord personnalisés par rôle. | L’utilisateur peut enregistrer sa vue sans modifier la vue institutionnelle. |

## Sécurité et identité

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| SEC-001 | Must | Imposer 2FA aux administrateurs, financiers et comptes sensibles. | TOTP, application d’authentification ou OTP; SMS en secours contrôlé. |
| SEC-002 | Should | Appliquer une authentification adaptative selon risque. | Nouvel appareil, pays inhabituel ou action sensible déclenche une étape supplémentaire. |
| SEC-003 | Must | Gérer politique de mot de passe, verrouillage et récupération sécurisée. | La récupération ne révèle pas l’existence d’un compte. |
| SEC-004 | Should | Révoquer sessions et appareils depuis le profil. | L’utilisateur voit les sessions actives et peut les fermer. |
| SEC-005 | Should | Supporter SSO/OIDC pour les agents CNPM. | Intégration à un fournisseur d’identité possible sans refonte. |

## Audit et conformité

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| AUD-001 | Must | Journaliser connexions, consultations sensibles, créations, modifications, validations et exports. | Événement, auteur, horodatage, objet, avant/après, IP/appareil et résultat. |
| AUD-002 | Must | Rendre les journaux inaltérables et consultables par l’auditeur. | Les utilisateurs opérationnels ne peuvent ni modifier ni supprimer. |
| AUD-003 | Must | Rechercher et exporter les événements pour une période. | Export signé/horodaté avec filtres et motif d’accès. |
| AUD-004 | Must | Déclencher alertes sur événements critiques. | Exemples : compte privilégié, changement bancaire, export massif, échecs répétés. |
| AUD-005 | Should | Définir la durée de conservation par type de journal. | La politique est paramétrable et conforme aux obligations applicables. |

## Intégrations et interopérabilité

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| INT-001 | Must | Prévoir un identifiant de correspondance externe par entreprise. | Plusieurs identifiants externes peuvent être liés sans remplacer l’ID CNPM. |
| INT-002 | Must | Versionner les API et contrats d’échange. | Une nouvelle version n’interrompt pas les consommateurs existants. |
| INT-003 | Must | Gérer consentement et base légale avant tout échange. | Chaque flux est documenté et autorisé. |
| INT-004 | Must | Tracer l’origine, la date et la qualité de chaque donnée importée. | La provenance reste visible et auditable. |
| INT-005 | Should | Résoudre les conflits de données selon règles de confiance. | Aucune donnée CNPM validée n’est écrasée silencieusement. |
| INT-006 | Should | Tester l’intégration dans un environnement sandbox. | Jeux de données fictifs, clés distinctes et journal de tests. |

## PostgreSQL et données

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| DB-001 | Must | Utiliser PostgreSQL comme seul SGBD relationnel de production. | Les bases métier, Keycloak, Flowable et métadonnées BI utilisent PostgreSQL; H2 est limité aux tests locaux. |
| DB-002 | Must | Maintenir PostgreSQL sur une version officiellement supportée et le dernier correctif mineur validé. | La matrice de versions indique date d'installation, patch, fin de support et plan de montée de version. |
| DB-003 | Must | Séparer les domaines par schémas et propriétaires techniques distincts. | Exemples : member, contribution, payment, recovery, service, governance, integration, audit, reporting. |
| DB-004 | Must | Employer des clés techniques UUID et des numéros métiers lisibles séparés. | Un changement de numéro métier ne modifie jamais la clé ni les relations. |
| DB-005 | Must | Stocker les montants en NUMERIC avec code devise et règles d'arrondi explicites. | Aucun type flottant n'est utilisé pour une cotisation, prime, commission, frais ou solde. |
| DB-006 | Must | Stocker les horodatages en TIMESTAMPTZ et afficher selon Africa/Bamako. | L'instant UTC, le fuseau d'affichage et la date métier restent non ambigus. |
| DB-007 | Must | Imposer clés étrangères, unicité, CHECK et transactions sur les invariants métier. | Les incohérences critiques sont rejetées même si elles proviennent d'un import ou d'une API. |
| DB-008 | Must | Rendre les écritures financières validées append-only. | Aucune suppression physique; annulation et correction par écritures compensatrices liées. |
| DB-009 | Must | Garantir l'idempotence par contraintes uniques et clés de déduplication. | Une transaction externe, un webhook ou un lot rejoué ne peut être comptabilisé deux fois. |
| DB-010 | Must | Limiter JSONB aux métadonnées extensibles non critiques. | Les champs de recherche, calcul, contrôle ou reporting sont modélisés en colonnes typées. |
| DB-011 | Should | Indexer et partitionner selon des mesures réelles. | B-tree par défaut; GIN/pg_trgm pour recherche; partitionnement des audits, événements et notifications si nécessaire. |
| DB-012 | Must | Appliquer les migrations par Flyway dans la CI/CD. | Scripts versionnés, revus, testés sur copie représentative et compatibles avec un déploiement progressif. |
| DB-013 | Must | Mettre en place sauvegardes chiffrées, archivage WAL et PITR. | RPO 15 min et RTO 4 h démontrés par un test de restauration documenté. |
| DB-014 | Must | Prévoir haute disponibilité et lecture décisionnelle séparée. | Standby répliqué et bascule testée; BI sur réplique ou vues dédiées, jamais par requêtes lourdes sur le primaire. |
| DB-015 | Must | Superviser capacité, verrous, réplication, vacuum et requêtes lentes. | Alertes, pg_stat_statements, seuils et runbooks d'intervention disponibles. |
| DB-016 | Must | Assurer la réversibilité PostgreSQL complète. | Exports SQL et formats ouverts, schéma, dictionnaire, migrations, pièces et contrôles d’intégrité sont remis au CNPM. |

## Architecture technique et exploitation

| ID | Priorité | Exigence | Critère d’acceptation |
|---|---|---|---|
| TEC-001 | Must | Démontrer que PostgreSQL est l'unique source de vérité relationnelle. | Inventaire des stockages et test de reprise prouvent qu'aucune donnée métier ne dépend uniquement d'un cache ou broker. |
| TEC-002 | Must | Fournir la matrice complète des versions, licences, CVE et fins de support. | Aucun composant en fin de vie ou sans correctif de sécurité dans la version candidate. |
| TEC-003 | Must | Interdire tout accès direct des applications clientes à PostgreSQL. | Web et mobile passent exclusivement par les API authentifiées et autorisées. |
| TEC-004 | Must | Reproduire un environnement depuis le code et les artefacts versionnés. | Installation automatisée sur environnement vierge avec résultat documenté. |
| TEC-005 | Must | Démontrer SSO, 2FA et séparation des rôles. | Scénarios positifs/négatifs pour administrateur, finance, agent, auditeur et membre. |
| TEC-006 | Must | Restaurer PostgreSQL à un instant choisi. | RPO/RTO mesurés, contrôles fonctionnels et rapprochement financier après restauration. |
| TEC-007 | Must | Tester la bascule d'un nœud applicatif et de la base. | Aucune perte de transaction confirmée; reprise dans le SLA approuvé. |
| TEC-008 | Must | Valider les performances et la faible connectivité. | Les seuils de la section 17.4 sont atteints sur un jeu de données et une charge représentatifs. |
| TEC-009 | Must | Prouver l'idempotence des paiements et webhooks. | Le même message rejoué plusieurs fois produit un seul effet financier. |
| TEC-010 | Should | Corréler logs, métriques et traces. | Une transaction de test est suivie de l'interface jusqu'à PostgreSQL et aux intégrations par correlation_id. |
| TEC-011 | Must | Appliquer les portes de sécurité CI/CD. | Un secret de test, une vulnérabilité critique et un test échoué bloquent effectivement la promotion. |
| TEC-012 | Must | Exécuter un exercice de réversibilité. | Code, images, configuration, schéma, migrations, données et pièces sont exportés puis réinstallés sous contrôle CNPM. |
