import type { DocManual } from './documentation.model';

/**
 * Documentation technique de la plateforme CNPM.
 *
 * Contenu factuel, aligné sur le dépôt : la pile vient de `CLAUDE.md`, le schéma et le
 * dictionnaire de `docs/03-data/data-model.md` et des migrations Flyway, l'arborescence
 * du code source réel, la sécurité et le déploiement des configurations livrées. Aucune
 * règle, table ou fonction n'est inventée.
 */
export const TECHNICAL_MANUAL: DocManual = {
  id: 'technical',
  label: 'Documentation technique',
  tagline:
    "Architecture, base de données, code source, fonctions principales, API, sécurité, déploiement et tests.",
  sections: [
    {
      id: 'tech-architecture',
      title: '1. Architecture et pile technique',
      summary:
        "La plateforme est un monolithe modulaire en architecture hexagonale : un seul déployable, des modules à frontières explicites, les frameworks maintenus en périphérie du domaine.",
      subsections: [
        {
          id: 'tech-architecture-principes',
          heading: 'Principes structurants',
          blocks: [
            {
              kind: 'list',
              items: [
                'Monolithe modulaire (Spring Modulith), pas de microservices : démarrage simple, frontières vérifiées à la compilation.',
                "Architecture hexagonale : le domaine ne dépend d'aucun framework ; les entrées/sorties passent par des ports et des adaptateurs.",
                "Aucun module ne lit les tables privées d'un autre module ; les échanges inter-modules passent par des API applicatives ou des événements.",
                'Aucun contrôleur ne porte de logique métier ; la logique vit dans les services applicatifs et le domaine.',
                'Événements métier fiables via une outbox transactionnelle (enveloppe append-only).',
              ],
            },
          ],
        },
        {
          id: 'tech-architecture-pile',
          heading: 'Pile technique',
          blocks: [
            {
              kind: 'table',
              caption: 'Technologies par couche',
              headers: ['Couche', 'Technologies'],
              rows: [
                ['Backend', 'Java 25 LTS, Spring Boot 4.1, Maven, Spring Modulith'],
                ['Web', 'Angular 22, TypeScript strict, SCSS et tokens de design'],
                ['Mobile', 'Flutter 3.44 / Dart'],
                ['Base de données', 'PostgreSQL 18, Flyway, PgBouncer'],
                ['Identité', 'Auth native (JWT HS256) ; cible IAM Keycloak, OIDC/OAuth 2.0, TOTP, WebAuthn'],
                ['Asynchrone / cache', 'RabbitMQ ; cache technique Valkey'],
                ['Documents', 'Stockage objet compatible S3 avec analyse antivirus'],
              ],
            },
            {
              kind: 'callout',
              tone: 'info',
              text: "Les montants sont en numeric(19,2) et les horodatages en timestamptz ; float et double sont interdits pour un montant. Une écriture financière validée n'est jamais modifiée : on corrige par une écriture compensatrice.",
            },
          ],
        },
      ],
    },
    {
      id: 'tech-arborescence',
      title: '2. Arborescence du code source',
      summary:
        "Le dépôt sépare le backend (modules hexagonaux), le web (Angular), le mobile, la base (migrations), les documents de gouvernance et l'infrastructure.",
      subsections: [
        {
          id: 'tech-arborescence-depot',
          heading: 'Racine du dépôt',
          blocks: [
            {
              kind: 'tree',
              caption: 'Organisation principale',
              lines: [
                'CNPM_Final/',
                '├─ backend/            # API Spring Boot (Java 25)',
                '├─ web/                # front Angular 22',
                '├─ mobile/             # application Flutter',
                '├─ docs/               # sources de vérité (produit, archi, données, API, sécurité)',
                '├─ infrastructure/     # docker, kubernetes, CI',
                '├─ deploy/             # blueprint et guide de déploiement Render',
                '└─ scripts/            # validation du dépôt, données de démonstration',
              ],
            },
          ],
        },
        {
          id: 'tech-arborescence-backend',
          heading: 'Backend — modules hexagonaux',
          blocks: [
            {
              kind: 'tree',
              caption: 'backend/src/main/',
              lines: [
                'java/ml/cnpm/platform/',
                '├─ CnpmPlatformApplication.java   # point d’entrée Spring Boot',
                '├─ shared/            # sécurité, contrat d’API, audit transverses',
                '├─ administration/    # référentiels, sécurité BO, tableau de bord admin',
                '├─ member/            # personnes, entreprises, adhésions',
                '├─ professionalgroup/ # groupements professionnels',
                '├─ contribution/      # exercices, barèmes, appels de cotisation',
                '├─ enrollment/        # prospects et dossiers d’adhésion',
                '├─ recovery/          # recouvrement',
                '├─ integration/       # partenaires, outbox, webhooks',
                '├─ reporting/         # read-models et tableaux de bord',
                '└─ audit/             # journal d’audit et de sécurité',
                '',
                'Chaque module métier : adapter/ (in·out) · application/ · domain/',
                '',
                'resources/',
                '├─ application.yml               # configuration',
                '└─ db/migration/                 # migrations Flyway V1 … V16',
              ],
            },
            {
              kind: 'callout',
              tone: 'info',
              text: "Les schémas financiers (payment, receipt, incentive…) existent dans le modèle de données, mais leurs modules applicatifs relèvent de la feuille de route : ils dépendent de décisions produit encore ouvertes (docs/00-governance/open-decisions.md).",
            },
          ],
        },
        {
          id: 'tech-arborescence-web',
          heading: 'Web — couches et fonctionnalités',
          blocks: [
            {
              kind: 'tree',
              caption: 'web/src/app/',
              lines: [
                'core/           # config API, authentification, formatage, gardes',
                'design-system/  # composants génériques, tokens, tableaux, états',
                'layout/         # shells (admin, portail membre), barre supérieure, menu compte',
                'features/',
                '├─ public/      # accueil, vitrine, adhésion, répertoire public',
                '├─ auth/        # connexion native et 2FA',
                '├─ admin/       # back-office : membres, cotisations, paiements, reçus, requêtes…',
                '└─ member/      # espace membre',
                'ui-contracts/   # contrats d’interface partagés',
                'app.routes.ts · app.config.ts   # routage et amorçage',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tech-base-donnees',
      title: '3. Base de données et dictionnaire',
      summary:
        "PostgreSQL 18 est l'unique source de vérité relationnelle. Le modèle est découpé en 16 schémas ; toute évolution passe par une migration Flyway immuable.",
      subsections: [
        {
          id: 'tech-bd-conventions',
          heading: 'Conventions',
          blocks: [
            {
              kind: 'list',
              items: [
                'Clés techniques UUID (gen_random_uuid) ; références métier distinctes et uniques.',
                'Montants en numeric(19,2), horodatages en timestamptz, devise char(3) (XOF).',
                'Colonnes d’audit standard : created_at/by, updated_at/by, version (verrouillage optimiste).',
                'Contraintes et clés étrangères en base ; aucune intégrité critique laissée à l’interface.',
                'JSONB réservé aux métadonnées non critiques et schématisées.',
                'Écritures financières validées immuables (tables append-only, souvent partitionnées par mois).',
              ],
            },
          ],
        },
        {
          id: 'tech-bd-schemas',
          heading: 'Les 16 schémas',
          blocks: [
            {
              kind: 'table',
              caption: 'Schémas et classification',
              headers: ['Schéma', 'Finalité', 'Classification'],
              rows: [
                ['ref', 'Référentiels et séquences', 'Métier interne'],
                ['iam', 'Identités, habilitations et 2FA', 'Restreint'],
                ['member', 'Personnes, entreprises, adhésions, groupements', 'Confidentiel'],
                ['enrollment', 'Prospects et dossiers d’enrôlement', 'Confidentiel'],
                ['contribution', 'Barèmes, appels et échéanciers', 'Financier'],
                ['payment', 'Transactions, allocations et rapprochement', 'Financier critique'],
                ['receipt', 'Reçus et attestations', 'Financier critique'],
                ['recovery', 'Campagnes et actions de recouvrement', 'Confidentiel'],
                ['incentive', 'Primes et partage de revenus', 'Financier critique'],
                ['service', 'Requêtes, réclamations et SLA', 'Confidentiel'],
                ['document', 'Métadonnées GED et versions', 'Confidentiel'],
                ['governance', 'Commissions, réunions et décisions', 'Interne'],
                ['event', 'Événements et inscriptions', 'Interne'],
                ['notification', 'Modèles et traces de livraison', 'Confidentiel'],
                ['integration', 'Partenaires, outbox et webhooks', 'Restreint'],
                ['audit', 'Audit, sécurité et exports', 'Restreint critique'],
                ['reporting', 'Définitions et exécutions de rapports', 'Interne'],
              ],
            },
          ],
        },
        {
          id: 'tech-bd-dictionnaire',
          heading: 'Dictionnaire des tables',
          blocks: [
            {
              kind: 'paragraph',
              text: "Inventaire des tables par schéma (finalité, nombre de colonnes, immuabilité). Le dictionnaire exhaustif au niveau colonne vit dans docs/03-data/data-dictionary.csv et dans les migrations Flyway.",
            },
            {
              kind: 'table',
              caption: 'Tables du modèle',
              headers: ['Table', 'Finalité', 'Col.', 'Immuable'],
              rows: [
                ['ref.reference_value', 'Valeurs de référentiels historisées', '13', 'Non'],
                ['ref.number_sequence', 'Séquences de numérotation métier', '10', 'Non'],
                ['iam.user_account', 'Compte utilisateur applicatif', '11', 'Non'],
                ['iam.role', 'Rôles applicatifs', '9', 'Non'],
                ['iam.permission', 'Permissions atomiques', '9', 'Non'],
                ['iam.role_permission', 'Association rôle-permission', '8', 'Non'],
                ['iam.user_role', 'Attribution de rôle contextualisée', '13', 'Non'],
                ['iam.mfa_registration', 'Facteurs 2FA enregistrés', '11', 'Non'],
                ['iam.access_review', 'Campagnes de revue d’accès', '11', 'Non'],
                ['member.person', 'Personnes physiques liées aux membres', '11', 'Non'],
                ['member.organization', 'Personnes morales membres ou prospects', '12', 'Non'],
                ['member.organization_identifier', 'Identifiants légaux et fiscaux', '11', 'Non'],
                ['member.address', 'Adresses normalisées', '13', 'Non'],
                ['member.organization_contact', 'Contacts et représentants', '12', 'Non'],
                ['member.membership', 'Adhésion d’une entreprise au CNPM', '12', 'Non'],
                ['member.membership_status_history', 'Historique immuable des statuts', '7', 'Oui'],
                ['member.professional_group', 'Groupements professionnels', '10', 'Non'],
                ['member.group_membership', 'Rattachement entreprise-groupement', '11', 'Non'],
                ['member.communication_preference', 'Consentements et préférences', '12', 'Non'],
                ['enrollment.prospect', 'Prospects à convertir', '11', 'Non'],
                ['enrollment.enrollment_case', 'Dossier d’enrôlement', '12', 'Non'],
                ['enrollment.enrollment_review', 'Contrôles et compléments', '7', 'Oui'],
                ['enrollment.enrollment_decision', 'Décisions d’enrôlement', '8', 'Oui'],
                ['contribution.fiscal_year', 'Exercices de cotisation', '10', 'Non'],
                ['contribution.rate_rule', 'Barèmes versionnés', '14', 'Non'],
                ['contribution.contribution_call', 'Appels de cotisation', '14', 'Non'],
                ['contribution.installment', 'Échéances d’un appel', '12', 'Non'],
                ['contribution.adjustment', 'Ajustements compensatoires', '9', 'Oui'],
                ['payment.payment_reference', 'Références de paiement validées', '12', 'Non'],
                ['payment.payment_transaction', 'Transactions financières append-only', '13', 'Oui'],
                ['payment.payment_allocation', 'Affectations paiement-échéance', '7', 'Oui'],
                ['payment.provider_event', 'Événements des prestataires', '10', 'Oui'],
                ['payment.bank_statement', 'Relevés bancaires importés', '12', 'Non'],
                ['payment.bank_statement_line', 'Lignes de relevé bancaire', '10', 'Oui'],
                ['payment.reconciliation_case', 'Cas de rapprochement', '13', 'Non'],
                ['receipt.receipt', 'Reçus officiels et corrections', '11', 'Oui'],
                ['recovery.campaign', 'Campagnes de recouvrement', '12', 'Non'],
                ['recovery.sequence_template', 'Scénarios de relance', '10', 'Non'],
                ['recovery.sequence_step', 'Étapes d’un scénario', '11', 'Non'],
                ['recovery.recovery_case', 'Dossier de recouvrement', '12', 'Non'],
                ['recovery.recovery_action', 'Journal des actions', '9', 'Oui'],
                ['recovery.promise_to_pay', 'Promesses de paiement', '11', 'Non'],
                ['incentive.bonus_rule', 'Règles de prime de mobilisation', '14', 'Non'],
                ['incentive.bonus_calculation', 'État mensuel de primes', '12', 'Non'],
                ['incentive.bonus_line', 'Détail de prime par encaissement', '10', 'Oui'],
                ['incentive.revenue_share_statement', 'Rémunération du prestataire', '13', 'Non'],
                ['incentive.financial_dispute', 'Litiges de calcul', '11', 'Non'],
                ['service.sla_policy', 'Politiques de délai', '10', 'Non'],
                ['service.request', 'Requêtes et réclamations', '16', 'Non'],
                ['service.request_message', 'Échanges d’une requête', '7', 'Oui'],
                ['document.document', 'Métadonnées documentaires', '13', 'Non'],
                ['document.document_version', 'Versions physiques (objet S3)', '11', 'Oui'],
                ['document.document_link', 'Liens document-objet métier', '10', 'Non'],
                ['governance.commission', 'Commissions et organes', '9', 'Non'],
                ['governance.meeting', 'Réunions institutionnelles', '12', 'Non'],
                ['governance.meeting_attendance', 'Présences et procurations', '10', 'Non'],
                ['governance.decision', 'Décisions et résolutions', '12', 'Non'],
                ['governance.decision_action', 'Actions de mise en œuvre', '11', 'Non'],
                ['event.event', 'Événements et formations', '13', 'Non'],
                ['event.registration', 'Inscriptions à un événement', '11', 'Non'],
                ['notification.template', 'Modèles versionnés', '13', 'Non'],
                ['notification.notification', 'Notification à envoyer', '13', 'Non'],
                ['notification.delivery_attempt', 'Tentatives de livraison', '10', 'Oui'],
                ['integration.partner', 'Partenaires et systèmes externes', '10', 'Non'],
                ['integration.endpoint_configuration', 'Configuration non secrète', '13', 'Non'],
                ['integration.outbox_event', 'Outbox transactionnelle', '10', 'Oui'],
                ['integration.webhook_subscription', 'Abonnements sortants', '11', 'Non'],
                ['integration.webhook_delivery', 'Livraisons de webhooks', '9', 'Oui'],
                ['audit.audit_event', 'Journal d’audit inviolable', '13', 'Oui'],
                ['audit.security_event', 'Événements de sécurité', '9', 'Oui'],
                ['audit.data_export', 'Registre des exports', '10', 'Oui'],
                ['reporting.report_definition', 'Catalogue des rapports', '12', 'Non'],
                ['reporting.report_execution', 'Historique d’exécution', '13', 'Non'],
              ],
            },
            {
              kind: 'callout',
              tone: 'warning',
              text: "Les tables financières append-only (payment.payment_transaction, audit.audit_event, integration.outbox_event…) sont protégées contre UPDATE/DELETE/TRUNCATE et partitionnées par RANGE mensuel. Toute correction se fait par écriture compensatrice, jamais par modification.",
            },
          ],
        },
        {
          id: 'tech-bd-colonnes',
          heading: 'Exemples de dictionnaire au niveau colonne',
          blocks: [
            {
              kind: 'paragraph',
              text: 'Quatre tables cœur, telles que définies dans la migration V1 (colonnes d’audit standard omises).',
            },
            {
              kind: 'table',
              caption: 'iam.user_account — compte utilisateur',
              headers: ['Colonne', 'Type', 'Rôle'],
              rows: [
                ['id', 'uuid', 'Identifiant technique immuable'],
                ['keycloak_subject', 'uuid', 'Identifiant du fournisseur d’identité'],
                ['email', 'varchar(320)', 'Adresse de connexion'],
                ['display_name', 'varchar(255)', 'Nom affiché'],
                ['status', 'varchar(30)', 'État du compte (défaut ACTIVE)'],
                ['last_login_at', 'timestamptz', 'Dernière authentification'],
              ],
            },
            {
              kind: 'table',
              caption: 'member.membership — adhésion',
              headers: ['Colonne', 'Type', 'Rôle'],
              rows: [
                ['organization_id', 'uuid', 'Entreprise adhérente'],
                ['membership_number', 'varchar(60)', 'Numéro métier'],
                ['category_code', 'varchar(50)', 'Actif, dormant, prospect, grand cotisant'],
                ['status', 'varchar(30)', 'État (défaut PENDING)'],
                ['joined_at', 'date', 'Date d’adhésion'],
                ['activated_at', 'timestamptz', 'Activation'],
              ],
            },
            {
              kind: 'table',
              caption: 'contribution.contribution_call — appel de cotisation',
              headers: ['Colonne', 'Type', 'Rôle'],
              rows: [
                ['membership_id', 'uuid', 'Adhésion'],
                ['fiscal_year_id', 'uuid', 'Exercice'],
                ['call_number', 'varchar(60)', 'Référence de l’appel'],
                ['amount_due', 'numeric(19,2)', 'Montant dû'],
                ['currency', 'char(3)', 'Devise (défaut XOF)'],
                ['due_date', 'date', 'Échéance'],
                ['balance_amount', 'numeric(19,2)', 'Solde restant'],
              ],
            },
            {
              kind: 'table',
              caption: 'payment.payment_transaction — transaction (append-only)',
              headers: ['Colonne', 'Type', 'Rôle'],
              rows: [
                ['transaction_number', 'varchar(80)', 'Référence CNPM'],
                ['channel', 'varchar(30)', 'MOBILE_MONEY, BANK, CASH'],
                ['amount', 'numeric(19,2)', 'Montant'],
                ['paid_at', 'timestamptz', 'Date de paiement (clé de partition)'],
                ['idempotency_key', 'varchar(160)', 'Clé anti-doublon'],
                ['raw_payload_hash', 'char(64)', 'Empreinte de la preuve'],
              ],
            },
          ],
        },
        {
          id: 'tech-bd-vues',
          heading: 'Vues de lecture',
          blocks: [
            {
              kind: 'paragraph',
              text: "Les vues aplatissent plusieurs tables d'un même module pour servir un écran ; elles ne franchissent aucune frontière de module et ne portent aucune donnée financière.",
            },
            {
              kind: 'table',
              headers: ['Vue', 'Migration', 'Rôle'],
              rows: [
                [
                  'member.membership_list',
                  'V7, V8',
                  'Liste des membres : adhésion + entreprise + groupement principal + contact principal',
                ],
                [
                  'member.organization_status_history',
                  'V9',
                  'Historique des changements de statut d’adhésion d’une entreprise',
                ],
                [
                  'reporting.* (V13–V16)',
                  'V13–V16',
                  'Read-models du tableau de bord : cotisations, activité, répertoire, canaux de paiement',
                ],
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tech-fonctions',
      title: '4. Fonctions et services principaux',
      summary:
        "Aperçu des services et composants clés, côté backend (services applicatifs) et côté web (passerelles de données et configuration d'exécution).",
      subsections: [
        {
          id: 'tech-fonctions-backend',
          heading: 'Backend — services et sécurité',
          blocks: [
            {
              kind: 'table',
              headers: ['Composant', 'Rôle'],
              rows: [
                ['SecurityConfig', 'Chaîne de filtres : refus par défaut, endpoints publics, resource-server JWT, CORS, erreurs Problem'],
                ['AppTokenService', 'Émission des jetons de session natifs (HS256, clé dérivée d’APP_JWT_SECRET, TTL 8 h)'],
                ['NativeJwtDecoderConfig', 'Décodeur des jetons natifs quand la bascule « auth native » est activée'],
                ['MfaService · TotpService · MfaCryptoService', 'Enrôlement et vérification du second facteur (TOTP)'],
                ['KeycloakAuthoritiesConverter · PermissionDirectory', 'Projection des rôles en permissions atomiques (RBAC)'],
                ['AdminSecurityQueryService', 'Instantané de sécurité du back-office (comptes, rôles, matrice de permissions)'],
                ['DashboardQueryService', 'Alimente le tableau de bord depuis les read-models reporting'],
                ['ProblemResponseWriter', 'Rend les erreurs au format normalisé avec correlationId'],
              ],
            },
          ],
        },
        {
          id: 'tech-fonctions-web',
          heading: 'Web — passerelles et configuration',
          blocks: [
            {
              kind: 'paragraph',
              text: "Chaque domaine fonctionnel est servi par une passerelle injectable, résolue au démarrage selon le mode de données : http (backend réel), demo (fixtures) ou indisponible (façade explicite).",
            },
            {
              kind: 'table',
              headers: ['Élément', 'Rôle'],
              rows: [
                ['CNPM_DATA_MODE', 'Mode figé au bootstrap : « http » ou « demo » (jamais modifié par l’URL ou le stockage)'],
                ['readCnpmRuntimeConfig', 'Lit __CNPM_RUNTIME_CONFIG__ (runtime-config.js) avant l’amorçage Angular'],
                ['buildCnpmApiUrl / isCnpmApiRequest', 'Compose et reconnaît les URL de l’API sous le baseUrl'],
                ['Http*Gateway / Demo*Gateway / Unavailable*Gateway', 'Trois implémentations par domaine ; l’intercepteur ajoute l’authentification aux requêtes API'],
                ['Gardes de route', 'Filtrent l’accès selon les permissions (l’UI ne remplace jamais le contrôle backend)'],
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tech-api',
      title: '5. Contrat d’API',
      summary:
        "Le contrat OpenAPI précède l'implémentation. Les collections sont paginées, les erreurs normalisées et les créations sensibles idempotentes.",
      subsections: [
        {
          id: 'tech-api-regles',
          heading: 'Règles de conception',
          blocks: [
            {
              kind: 'list',
              items: [
                'Source du contrat : docs/04-api/openapi.yaml (et asyncapi.yaml pour l’asynchrone), catalogue docs/04-api/api-catalog.csv.',
                'Erreurs normalisées (format Problem) avec un correlationId propagé de bout en bout.',
                'Clé d’idempotence pour les créations et callbacks sensibles (paiements, webhooks, exports).',
                'Collections paginées et exports bornés ; toute rupture de compatibilité est versionnée.',
                'En développement, le front appelle /v1 ; ce préfixe de passerelle est retiré avant le backend.',
              ],
            },
            {
              kind: 'code',
              caption: 'Exemple d’enveloppe d’erreur normalisée',
              lines: [
                '{',
                '  "code": "AUTHENTICATION_REQUIRED",',
                '  "status": 401,',
                '  "message": "Authentification absente ou expirée.",',
                '  "correlationId": "…"',
                '}',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tech-securite',
      title: '6. Sécurité et authentification',
      summary:
        "Moindre privilège et refus par défaut. L'API est sans session : chaque appel porte un jeton ; l'autorisation fine s'appuie sur des permissions dérivées des rôles.",
      subsections: [
        {
          id: 'tech-securite-auth',
          heading: 'Authentification',
          blocks: [
            {
              kind: 'list',
              items: [
                'Auth native : login vérifie identifiant + mot de passe puis, pour les profils sensibles, un second facteur TOTP.',
                'Un jeton d’accès HS256 est émis (AppTokenService) et porté par l’en-tête Authorization à chaque appel.',
                'La bascule « auth native » (CNPM_SECURITY_NATIVE_JWT_ENABLED) fait valider ces jetons sans Keycloak ; la cible IAM reste Keycloak/OIDC.',
                'API sans état (STATELESS) : pas de cookie de session, CSRF désactivé car aucun cookie d’authentification.',
              ],
            },
          ],
        },
        {
          id: 'tech-securite-autorisation',
          heading: 'Autorisation et audit',
          blocks: [
            {
              kind: 'list',
              items: [
                'Refus par défaut : toute route non explicitement publique exige un jeton valide.',
                'RBAC : les rôles de realm sont convertis en permissions atomiques (ex. IAM.USER.READ, MEMBER.READ, PAYMENT.CONFIRM).',
                '2FA obligatoire pour les rôles sensibles ; step-up pour les opérations critiques.',
                'Toute action sensible produit un événement d’audit corrélé (audit.audit_event, inviolable).',
                'Jamais de mot de passe, jeton, secret, OTP ou charge bancaire complète dans les journaux.',
              ],
            },
            {
              kind: 'callout',
              tone: 'tip',
              text: "En production multi-origines, le backend n'autorise en CORS que l'origine du front (CNPM_WEB_CORS_ALLOWED_ORIGINS) ; sans origine configurée, aucun en-tête CORS n'est ajouté.",
            },
          ],
        },
      ],
    },
    {
      id: 'tech-deploiement',
      title: '7. Déploiement et exploitation',
      summary:
        "La plateforme se déploie en conteneurs. Un blueprint Render décrit le déploiement http complet ; un mode démonstration statique fonctionne sans backend.",
      subsections: [
        {
          id: 'tech-deploiement-images',
          heading: 'Construction et images',
          blocks: [
            {
              kind: 'list',
              items: [
                'Backend : backend/Dockerfile multi-étapes (JDK 25 + wrapper Maven → JRE 25), écoute $PORT, exécution non-root.',
                'Web : build de production Angular (npm run build), publié en site statique.',
                'Base : migrations Flyway appliquées au démarrage (ddl-auto: validate).',
                'Ne jamais utiliser une image de conteneur « latest » en production.',
              ],
            },
          ],
        },
        {
          id: 'tech-deploiement-render',
          heading: 'Blueprint Render',
          blocks: [
            {
              kind: 'paragraph',
              text: 'render.yaml décrit trois services : base PostgreSQL managée, backend (image Docker, auth native), front (site statique dont le baseUrl est câblé sur l’hôte du backend). Détails et limites dans deploy/render/README.md.',
            },
            {
              kind: 'table',
              caption: 'Variables d’environnement clés du backend',
              headers: ['Variable', 'Rôle'],
              rows: [
                ['DATABASE_HOST / PORT / NAME / USER / PASSWORD', 'Connexion à la base (URL composée dans application.yml)'],
                ['APP_JWT_SECRET', 'Secret de signature des jetons natifs (généré, jamais commité)'],
                ['CNPM_SECURITY_NATIVE_JWT_ENABLED', 'Active la validation des jetons natifs (sans Keycloak)'],
                ['CNPM_WEB_CORS_ALLOWED_ORIGINS', 'Origine du front autorisée en CORS'],
                ['RABBITMQ_DEFAULT_USER / PASS', 'Identifiants du broker (l’app démarre sans broker, en mode dégradé)'],
              ],
            },
            {
              kind: 'callout',
              tone: 'info',
              text: "Contraintes d'exploitation : ne pas contourner Flyway, RBAC, 2FA, l'audit ou la validation métier ; ne pas déployer, supprimer des données ou restaurer sans approbation humaine explicite.",
            },
          ],
        },
      ],
    },
    {
      id: 'tech-tests',
      title: '8. Tests et qualité',
      summary:
        "Chaque exigence a au moins un scénario nominal et un scénario de contrôle négatif ; les règles financières, de sécurité et de données ajoutent des tests de répétition, concurrence, idempotence ou intégrité.",
      subsections: [
        {
          id: 'tech-tests-strategie',
          heading: 'Stratégie',
          blocks: [
            {
              kind: 'list',
              items: [
                'Backend : tests d’intégration sur PostgreSQL Testcontainers (JPA/Flyway réels), tests de la chaîne de sécurité.',
                'Web : tests unitaires et d’interaction (Vitest), accessibilité (axe) et régression visuelle (Playwright) sur les écrans P0.',
                'Migrations testées depuis une base vide et depuis la version précédente.',
                'Bugs financiers, de sécurité et de permissions : test de non-régression obligatoire.',
                'Jamais de données personnelles réelles dans les tests, fixtures ou captures.',
              ],
            },
            {
              kind: 'code',
              caption: 'Commandes de vérification',
              lines: [
                '# Backend',
                'mvn -f backend/pom.xml clean verify',
                '',
                '# Web',
                'cd web && npm ci && npm run lint && npm test -- --watch=false && npm run build',
                '',
                '# Contrat & dépôt',
                'bash scripts/validate-openapi.sh',
                'bash scripts/validate-pack.sh',
              ],
            },
          ],
        },
      ],
    },
  ],
};
