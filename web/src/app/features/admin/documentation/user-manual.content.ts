import type { DocManual } from './documentation.model';

/**
 * Manuel utilisateur du back-office CNPM.
 *
 * Décrit les parcours réels de la plateforme (connexion, tableau de bord, membres,
 * cotisations, paiements, reçus, requêtes, vitrine, utilisateurs, compte) sans inventer
 * de règle métier : les libellés et fonctions correspondent aux écrans livrés.
 */
export const USER_MANUAL: DocManual = {
  id: 'user',
  label: 'Manuel utilisateur',
  tagline: "Prise en main des parcours du portail, écran par écran, avec les étapes clés.",
  sections: [
    {
      id: 'um-demarrage',
      title: '1. Démarrage et connexion',
      summary:
        'Comment accéder à la plateforme, s’authentifier en sécurité et se repérer dans l’interface.',
      subsections: [
        {
          id: 'um-demarrage-connexion',
          heading: 'Se connecter',
          blocks: [
            {
              kind: 'steps',
              items: [
                'Depuis la vitrine publique, cliquez sur « Accéder au portail » (ou ouvrez la page de connexion).',
                'Saisissez votre adresse de connexion et votre mot de passe.',
                'Si votre rôle l’exige, saisissez le code à usage unique de votre application d’authentification (2FA).',
                'Vous arrivez sur votre espace : tableau de bord (administration) ou accueil membre selon votre profil.',
              ],
            },
            {
              kind: 'callout',
              tone: 'info',
              text: "La session est conservée lors d'un rafraîchissement de page : actualiser ne déconnecte pas. Pour quitter, utilisez « Se déconnecter » dans le menu du compte.",
            },
          ],
        },
        {
          id: 'um-demarrage-2fa',
          heading: 'Double authentification (2FA)',
          blocks: [
            {
              kind: 'paragraph',
              text: "La 2FA est obligatoire pour les rôles sensibles. Elle repose sur un code temporaire (TOTP) généré par une application dédiée sur votre téléphone.",
            },
            {
              kind: 'list',
              items: [
                'À l’enrôlement, scannez le QR code proposé avec votre application d’authentification.',
                'À chaque connexion sensible, saisissez le code à 6 chiffres affiché par l’application.',
                'Conservez vos codes de secours en lieu sûr ; ils dépannent en cas de perte du téléphone.',
              ],
            },
          ],
        },
        {
          id: 'um-demarrage-reperes',
          heading: 'Se repérer',
          blocks: [
            {
              kind: 'list',
              items: [
                'La barre latérale donne accès aux modules (membres, cotisations, paiements, reçus, requêtes, reporting…).',
                'La barre supérieure porte la recherche, les repères de contexte et le menu du compte (en haut à droite).',
                'Le menu du compte réunit : Mon profil, Mes préférences, Aide et documentation, et Se déconnecter.',
                'Les menus diffèrent selon le rôle : un membre voit son espace, un administrateur voit le back-office.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'um-tableau-de-bord',
      title: '2. Tableau de bord',
      summary:
        'Vue synthétique de l’activité : indicateurs clés, évolution des cotisations, paiements récents, activités et alertes.',
      subsections: [
        {
          id: 'um-tdb-lecture',
          heading: 'Lire le tableau de bord',
          blocks: [
            {
              kind: 'list',
              items: [
                'Cartes d’indicateurs : membres, membres actifs, cotisations, taux de recouvrement, reçus.',
                'Graphique d’évolution mensuelle des cotisations et répartition par canal de paiement.',
                'Derniers paiements et dernières activités, présentés en tableaux lisibles.',
                'Alertes : les plus importantes d’abord, avec un lien « voir toutes » pour la liste complète.',
              ],
            },
            {
              kind: 'callout',
              tone: 'tip',
              text: 'Les chiffres proviennent de read-models dédiés : ils reflètent des agrégats et n’exposent aucune donnée nominative dans les vues publiques.',
            },
          ],
        },
      ],
    },
    {
      id: 'um-membres',
      title: '3. Membres, entreprises et groupements',
      summary:
        'Consulter le répertoire des membres, ouvrir la fiche détaillée d’une entreprise et parcourir les groupements professionnels.',
      subsections: [
        {
          id: 'um-membres-repertoire',
          heading: 'Répertoire des membres',
          blocks: [
            {
              kind: 'steps',
              items: [
                'Ouvrez « Membres » dans la barre latérale.',
                'Utilisez la recherche et les filtres (statut, catégorie, groupement) pour affiner la liste.',
                'Parcourez les colonnes : entreprise, contact et groupement principal, situation de cotisation.',
                'Cliquez sur une ligne pour ouvrir la fiche détaillée du membre.',
              ],
            },
            {
              kind: 'callout',
              tone: 'info',
              text: "Les filtres, tris et la sélection sont conservés dans l'URL : une vue filtrée est partageable et se retrouve à l'identique.",
            },
          ],
        },
        {
          id: 'um-membres-fiche',
          heading: 'Fiche d’un membre',
          blocks: [
            {
              kind: 'list',
              items: [
                'Identité de l’entreprise : dénomination, catégorie (ex. « Grande Entreprise »), statut d’adhésion.',
                'Contacts et représentants, groupement de rattachement.',
                'Situation de cotisation et repères d’activité.',
                'La catégorie et le statut d’adhésion sont affichés en clair, jamais par la seule couleur.',
              ],
            },
          ],
        },
        {
          id: 'um-membres-groupements',
          heading: 'Entreprises et groupements',
          blocks: [
            {
              kind: 'paragraph',
              text: "Les pages Entreprises et Groupements présentent les personnes morales et les groupements professionnels du CNPM, avec recherche, filtres et accès au détail.",
            },
          ],
        },
      ],
    },
    {
      id: 'um-cotisations',
      title: '4. Cotisations',
      summary:
        'Suivre les exercices, les appels de cotisation et la situation de paiement des membres.',
      subsections: [
        {
          id: 'um-cotisations-suivi',
          heading: 'Suivre les cotisations',
          blocks: [
            {
              kind: 'list',
              items: [
                'Consultez les appels de cotisation par exercice, avec montant dû, échéance et solde.',
                'Repérez rapidement les appels échus ou partiellement réglés.',
                'Ouvrez un appel pour voir ses échéances et son historique.',
              ],
            },
            {
              kind: 'callout',
              tone: 'warning',
              text: "Les montants sont des données financières : ils ne sont jamais modifiés directement. Une correction passe par un ajustement compensatoire tracé.",
            },
          ],
        },
      ],
    },
    {
      id: 'um-paiements',
      title: '5. Paiements',
      summary:
        'Consulter les transactions, importer un relevé bancaire et suivre le rapprochement.',
      subsections: [
        {
          id: 'um-paiements-transactions',
          heading: 'Transactions et canaux',
          blocks: [
            {
              kind: 'list',
              items: [
                'Chaque transaction porte une référence, un canal (mobile money, banque, espèces), un montant et une date.',
                'Les transactions validées sont en append-only : elles ne sont ni modifiées ni supprimées.',
                'Le rapprochement associe les paiements aux échéances correspondantes.',
              ],
            },
          ],
        },
        {
          id: 'um-paiements-import',
          heading: 'Importer un relevé bancaire',
          blocks: [
            {
              kind: 'steps',
              items: [
                'Ouvrez l’import de relevé depuis le module Paiements.',
                'Déposez le fichier de relevé fourni par la banque.',
                'Vérifiez les lignes détectées avant de valider.',
                'Lancez le rapprochement pour rattacher les lignes aux paiements attendus.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'um-recus',
      title: '6. Reçus',
      summary: 'Retrouver et vérifier les reçus officiels émis après paiement.',
      subsections: [
        {
          id: 'um-recus-consulter',
          heading: 'Consulter et vérifier',
          blocks: [
            {
              kind: 'list',
              items: [
                'Retrouvez les reçus disponibles après émission.',
                'Un reçu est un document officiel immuable ; une correction donne lieu à une nouvelle version.',
                'La vérification publique d’un reçu se fait par un jeton opaque, sans exposer de données sensibles.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'um-requetes',
      title: '7. Requêtes',
      summary: 'Créer et suivre une demande ou une réclamation adressée au CNPM.',
      subsections: [
        {
          id: 'um-requetes-cycle',
          heading: 'Cycle d’une requête',
          blocks: [
            {
              kind: 'steps',
              items: [
                'Créez une requête en précisant son objet et le contexte.',
                'Suivez son avancement et les échanges associés.',
                'Consultez le délai de traitement attendu (SLA) selon le type de dossier.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'um-vitrine',
      title: '8. Vitrine publique',
      summary:
        'Valoriser une entreprise membre selon les règles de publication, et modérer les pages avant mise en ligne.',
      subsections: [
        {
          id: 'um-vitrine-principes',
          heading: 'Principes de la vitrine',
          blocks: [
            {
              kind: 'list',
              items: [
                'Le membre édite le contenu de sa page ; il ne modifie jamais le statut de vérification CNPM.',
                'Un gabarit contraint encadre la mise en forme (pas d’éditeur libre) ; médias avec métadonnées de droits et texte alternatif.',
                'La page suit des états : brouillon, revue, approuvé, planifié, publié, rejeté, retiré, suspendu.',
                'Le badge de vérification explique ce qui a été vérifié et quand.',
              ],
            },
            {
              kind: 'callout',
              tone: 'info',
              text: "La modération valide ou rejette une page avant publication. Les sections vides ne sont pas affichées ; aucun contact personnel n'est exposé sans consentement.",
            },
          ],
        },
      ],
    },
    {
      id: 'um-utilisateurs',
      title: '9. Gestion des utilisateurs',
      summary:
        'Consulter les comptes, les rôles et la matrice des permissions du back-office (sécurité).',
      subsections: [
        {
          id: 'um-utilisateurs-securite',
          heading: 'Comptes, rôles et permissions',
          blocks: [
            {
              kind: 'list',
              items: [
                'Consultez la liste des comptes (administrateurs et membres) et leur état.',
                'Visualisez les rôles applicatifs et la matrice des permissions atomiques.',
                'La création de compte, la réinitialisation 2FA et l’attribution de droits obéissent au principe du moindre privilège et à la séparation des tâches.',
              ],
            },
            {
              kind: 'callout',
              tone: 'warning',
              text: "L'affichage des droits dans l'interface est un confort : la vérification d'authentification, de permission et de périmètre est toujours refaite côté backend.",
            },
          ],
        },
      ],
    },
    {
      id: 'um-compte',
      title: '10. Compte et préférences',
      summary: 'Gérer son profil, ses préférences et accéder à l’aide.',
      subsections: [
        {
          id: 'um-compte-menu',
          heading: 'Menu du compte',
          blocks: [
            {
              kind: 'list',
              items: [
                'Mon profil : informations d’identité et de connexion du compte.',
                'Mes préférences : réglages personnels d’affichage et de communication.',
                'Aide et documentation : ce manuel et la documentation technique.',
                'Se déconnecter : ferme la session en cours.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'um-espace-membre',
      title: '11. Espace membre',
      summary:
        'Le portail dédié aux entreprises membres, avec un menu distinct de celui de l’administration.',
      subsections: [
        {
          id: 'um-espace-membre-contenu',
          heading: 'Ce que voit un membre',
          blocks: [
            {
              kind: 'list',
              items: [
                'Accueil membre : synthèse de sa situation.',
                'Ses cotisations, paiements et reçus.',
                'Ses requêtes adressées au CNPM.',
                'La gestion de sa vitrine publique (édition, aperçu, publication).',
                'Son profil et le répertoire.',
              ],
            },
            {
              kind: 'callout',
              tone: 'tip',
              text: "Le menu d'un membre est volontairement réduit à son périmètre : il n'accède pas aux fonctions d'administration.",
            },
          ],
        },
      ],
    },
  ],
};
