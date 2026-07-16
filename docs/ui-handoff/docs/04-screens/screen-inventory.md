# Inventaire des écrans

Le périmètre contient **101 écrans**. La source machine est `data/screen-inventory.json`.

## Répartition

- **Public** : 16
- **Authentification** : 8
- **Back-office** : 38
- **Portail membre** : 20
- **Mobile** : 19

## Public

| ID | Écran | Route | Gabarit | Priorité | Rôles | Référence |
|---|---|---|---|---|---|---|
| PUB-001 | Accueil public CNPM | `/` | `PublicLanding` | P0 | Public | REF-PUB-001 |
| PUB-002 | Presentation du CNPM | `/le-cnpm` | `PublicContent` | P1 | Public | — |
| PUB-003 | Services du CNPM | `/services` | `PublicContent` | P1 | Public | — |
| PUB-004 | Annuaire public des membres | `/membres` | `PublicDirectory` | P0 | Public | — |
| PUB-005 | Recherche et filtres annuaire | `/membres/recherche` | `PublicDirectory` | P1 | Public | — |
| PUB-006 | Vitrine publique d un membre | `/membres/:slug` | `MemberShowcase` | P0 | Public | REF-PUB-006 |
| PUB-007 | Liste des activites et projets du membre | `/membres/:slug/activites` | `MemberShowcase` | P1 | Public | — |
| PUB-008 | Detail d une realisation du membre | `/membres/:slug/realisations/:id` | `MemberShowcaseDetail` | P1 | Public | — |
| PUB-009 | Actualites CNPM | `/actualites` | `PublicListing` | P1 | Public | — |
| PUB-010 | Detail actualite | `/actualites/:slug` | `PublicContent` | P1 | Public | — |
| PUB-011 | Agenda et evenements | `/agenda` | `PublicListing` | P1 | Public | — |
| PUB-012 | Demande d adhesion publique | `/adhesion` | `PublicForm` | P0 | Prospect | — |
| PUB-013 | Confirmation demande adhesion | `/adhesion/confirmation` | `PublicConfirmation` | P0 | Prospect | — |
| PUB-014 | Contact CNPM | `/contact` | `PublicForm` | P1 | Public | — |
| PUB-015 | Verification publique d un recu | `/verification/:code` | `PublicVerification` | P0 | Public | — |
| PUB-016 | Mentions legales et confidentialite | `/legal/:document` | `PublicContent` | P1 | Public | — |

## Authentification

| ID | Écran | Route | Gabarit | Priorité | Rôles | Référence |
|---|---|---|---|---|---|---|
| AUTH-001 | Connexion administration / membre | `/auth/login` | `AuthSplit` | P0 | Tous | REF-AUTH-001 |
| AUTH-002 | Saisie du code 2FA | `/auth/verify` | `AuthSplit` | P0 | Tous | REF-AUTH-001 |
| AUTH-003 | Choix de methode 2FA | `/auth/verify/method` | `AuthCentered` | P0 | Tous | — |
| AUTH-004 | Mot de passe oublie | `/auth/forgot-password` | `AuthCentered` | P0 | Tous | — |
| AUTH-005 | Reinitialiser le mot de passe | `/auth/reset-password` | `AuthCentered` | P0 | Tous | — |
| AUTH-006 | Activation du compte | `/auth/activate` | `AuthCentered` | P0 | Tous | — |
| AUTH-007 | Enrolement TOTP / passkey | `/auth/2fa-enrollment` | `AuthCentered` | P1 | Tous | — |
| AUTH-008 | Session expiree / acces refuse | `/auth/session-ended` | `AuthCentered` | P0 | Tous | — |

## Back-office

| ID | Écran | Route | Gabarit | Priorité | Rôles | Référence |
|---|---|---|---|---|---|---|
| BO-001 | Tableau de bord operationnel | `/admin/dashboard` | `AdminDashboard` | P0 | Direction, Finance, Recouvrement | REF-BO-001 |
| BO-002 | Liste des membres | `/admin/members` | `AdminTable` | P0 | Gestionnaire, Recouvrement | REF-BO-002 |
| BO-003 | Fiche membre 360 degres | `/admin/members/:id` | `AdminEntityDetail` | P0 | Gestionnaire, Recouvrement | REF-BO-003 |
| BO-004 | Creation / modification membre | `/admin/members/:id/edit` | `AdminForm` | P0 | Gestionnaire | — |
| BO-005 | Liste des entreprises | `/admin/organizations` | `AdminTable` | P0 | Gestionnaire | — |
| BO-006 | Fiche entreprise | `/admin/organizations/:id` | `AdminEntityDetail` | P0 | Gestionnaire | — |
| BO-007 | Gestion des contacts | `/admin/organizations/:id/contacts` | `AdminTable` | P1 | Gestionnaire | — |
| BO-008 | Liste des enrôlements | `/admin/enrollments` | `AdminTable` | P0 | Validateur, Gestionnaire | — |
| BO-009 | Nouvel enrôlement multi-etapes | `/admin/enrollments/new` | `AdminWizard` | P0 | Gestionnaire | REF-BO-009 |
| BO-010 | Validation d un enrôlement | `/admin/enrollments/:id/review` | `AdminReview` | P0 | Validateur | — |
| BO-011 | Cotisations et echeanciers | `/admin/contributions` | `AdminFinance` | P0 | Finance, Comptable | REF-BO-011 |
| BO-012 | Generation des appels | `/admin/contributions/calls/new` | `AdminWizard` | P0 | Finance | — |
| BO-013 | Detail d une cotisation | `/admin/contributions/:id` | `AdminEntityDetail` | P0 | Finance, Recouvrement | — |
| BO-014 | Paiements et rapprochement | `/admin/payments/reconciliation` | `AdminMasterDetail` | P0 | Comptable, Finance | REF-BO-014 |
| BO-015 | Import releve bancaire | `/admin/payments/import` | `AdminImport` | P0 | Comptable | — |
| BO-016 | Registre des recus | `/admin/receipts` | `AdminTable` | P0 | Finance, Audit | — |
| BO-017 | Campagnes de recouvrement | `/admin/recovery/campaigns` | `AdminCampaignBuilder` | P1 | Recouvrement | REF-BO-017 |
| BO-018 | Detail d une campagne | `/admin/recovery/campaigns/:id` | `AdminEntityDetail` | P1 | Recouvrement | — |
| BO-019 | File des relances et actions | `/admin/recovery/actions` | `AdminTable` | P1 | Recouvrement | — |
| BO-020 | Portefeuille agent de recouvrement | `/admin/recovery/portfolio` | `AdminTable` | P1 | Recouvrement | — |
| BO-021 | Requetes et reclamations | `/admin/requests` | `AdminTable` | P0 | Support, Gestionnaire | — |
| BO-022 | Traitement d une requete | `/admin/requests/:id` | `AdminCaseDetail` | P0 | Support, Gestionnaire | — |
| BO-023 | GED et documents | `/admin/documents` | `AdminDocumentLibrary` | P1 | Gestionnaire, Audit | — |
| BO-024 | Groupements professionnels | `/admin/groups` | `AdminTable` | P1 | Gestionnaire | — |
| BO-025 | Fiche groupement | `/admin/groups/:id` | `AdminEntityDetail` | P1 | Gestionnaire | — |
| BO-026 | Reunions, commissions et decisions | `/admin/governance` | `AdminWorkspace` | P2 | Secretariat, Direction | — |
| BO-027 | Evenements et formations | `/admin/events` | `AdminTable` | P2 | Communication | — |
| BO-028 | Reporting decisionnel | `/admin/reporting` | `AdminAnalytics` | P1 | Direction, Finance, Analyste | REF-BO-028 |
| BO-029 | Constructeur de rapports | `/admin/reporting/builder` | `AdminReportBuilder` | P2 | Analyste | — |
| BO-030 | Utilisateurs et securite | `/admin/security/users` | `AdminSecurity` | P1 | Administrateur securite | REF-BO-030 |
| BO-031 | Roles et permissions | `/admin/security/roles` | `AdminMatrix` | P1 | Administrateur securite | — |
| BO-032 | Journaux d audit | `/admin/security/audit` | `AdminAudit` | P1 | Audit, Securite | — |
| BO-033 | Parametrage fonctionnel | `/admin/settings` | `AdminSettings` | P1 | Administrateur fonctionnel | — |
| BO-034 | Barèmes, taux et primes | `/admin/settings/rates` | `AdminTable` | P1 | Finance, Administrateur fonctionnel | — |
| BO-035 | Primes de mobilisation | `/admin/bonuses` | `AdminFinance` | P1 | Finance, Commission | — |
| BO-036 | Partage de revenus prestataire | `/admin/revenue-share` | `AdminFinance` | P1 | Finance, Direction | — |
| BO-037 | Moderation des vitrines membres | `/admin/showcases/moderation` | `AdminReview` | P1 | Communication, Moderateur | — |
| BO-038 | Supervision des integrations | `/admin/integrations` | `AdminOperations` | P1 | Administrateur technique | — |

## Portail membre

| ID | Écran | Route | Gabarit | Priorité | Rôles | Référence |
|---|---|---|---|---|---|---|
| MP-001 | Accueil du portail membre | `/member/home` | `MemberDashboard` | P0 | Membre | REF-MP-001 |
| MP-002 | Mes cotisations | `/member/contributions` | `MemberListing` | P0 | Membre | — |
| MP-003 | Detail cotisation et echeancier | `/member/contributions/:id` | `MemberDetail` | P0 | Membre | — |
| MP-004 | Payer une cotisation | `/member/payments/new` | `MemberPayment` | P0 | Membre | — |
| MP-005 | Confirmation de paiement | `/member/payments/:id/status` | `MemberConfirmation` | P0 | Membre | — |
| MP-006 | Historique des paiements | `/member/payments` | `MemberListing` | P0 | Membre | — |
| MP-007 | Mes recus et attestations | `/member/receipts` | `MemberDocumentList` | P0 | Membre | — |
| MP-008 | Verification / telechargement recu | `/member/receipts/:id` | `MemberDocumentPreview` | P0 | Membre | — |
| MP-009 | Mes requetes | `/member/requests` | `MemberListing` | P0 | Membre | — |
| MP-010 | Nouvelle requete | `/member/requests/new` | `MemberForm` | P0 | Membre | — |
| MP-011 | Detail et conversation requete | `/member/requests/:id` | `MemberCaseDetail` | P0 | Membre | — |
| MP-012 | Mes documents | `/member/documents` | `MemberDocumentList` | P1 | Membre | — |
| MP-013 | Profil entreprise | `/member/profile` | `MemberProfile` | P1 | Administrateur membre | — |
| MP-014 | Utilisateurs de l entreprise | `/member/users` | `MemberTable` | P1 | Administrateur membre | — |
| MP-015 | Editeur de vitrine publique | `/member/showcase/edit` | `ShowcaseEditor` | P0 | Administrateur membre | — |
| MP-016 | Apercu et publication vitrine | `/member/showcase/preview` | `ShowcasePreview` | P0 | Administrateur membre | — |
| MP-017 | Statistiques de la vitrine | `/member/showcase/analytics` | `ShowcaseAnalytics` | P1 | Administrateur membre | — |
| MP-018 | Annuaire prive et opportunites | `/member/directory` | `MemberDirectory` | P1 | Membre | — |
| MP-019 | Evenements, formations, avantages | `/member/benefits` | `MemberListing` | P2 | Membre | — |
| MP-020 | Securite et preferences | `/member/settings/security` | `MemberSettings` | P1 | Membre | — |

## Mobile

| ID | Écran | Route | Gabarit | Priorité | Rôles | Référence |
|---|---|---|---|---|---|---|
| MOB-001 | Connexion mobile | `mobile://login` | `MobileAuth` | P0 | Membre | REF-MOB-001 |
| MOB-002 | Verification 2FA mobile | `mobile://verify` | `MobileAuth` | P0 | Membre | REF-MOB-001 |
| MOB-003 | Accueil mobile membre | `mobile://home` | `MobileDashboard` | P0 | Membre | REF-MOB-001 |
| MOB-004 | Liste des cotisations | `mobile://contributions` | `MobileList` | P0 | Membre | — |
| MOB-005 | Detail cotisation | `mobile://contributions/:id` | `MobileDetail` | P0 | Membre | — |
| MOB-006 | Paiement Mobile Money | `mobile://payments/new` | `MobilePayment` | P0 | Membre | — |
| MOB-007 | Etat d un paiement | `mobile://payments/:id` | `MobileConfirmation` | P0 | Membre | — |
| MOB-008 | Historique paiements | `mobile://payments` | `MobileList` | P0 | Membre | — |
| MOB-009 | Liste des recus | `mobile://receipts` | `MobileList` | P0 | Membre | — |
| MOB-010 | Apercu recu | `mobile://receipts/:id` | `MobileDocument` | P0 | Membre | — |
| MOB-011 | Liste des requetes | `mobile://requests` | `MobileList` | P0 | Membre | — |
| MOB-012 | Nouvelle requete mobile | `mobile://requests/new` | `MobileWizard` | P0 | Membre | REF-MOB-001 |
| MOB-013 | Conversation requete | `mobile://requests/:id` | `MobileConversation` | P0 | Membre | — |
| MOB-014 | Documents | `mobile://documents` | `MobileList` | P1 | Membre | — |
| MOB-015 | Notifications | `mobile://notifications` | `MobileList` | P1 | Membre | — |
| MOB-016 | Profil et entreprise | `mobile://profile` | `MobileProfile` | P1 | Membre | REF-MOB-001 |
| MOB-017 | Securite et appareils | `mobile://security` | `MobileSettings` | P1 | Membre | — |
| MOB-018 | Mode hors connexion | `mobile://offline` | `MobileOffline` | P1 | Membre | — |
| MOB-019 | Synchronisation en attente | `mobile://sync` | `MobileStatus` | P1 | Membre | — |
