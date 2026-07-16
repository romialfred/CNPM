# Backlog produit détaillé

Nombre de user stories : **144**.

> Les stories reprennent sans suppression les exigences de la spécification fonctionnelle. Les estimations sont des hypothèses de planification à affiner par l’équipe.

## Administration et paramétrage

### US-ADM-001 - Créer, modifier, désactiver et historiser chaque valeur de référentiel

- **Exigence source** : ADM-001
- **Acteur** : Administrateur fonctionnel CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur fonctionnel cnpm, je veux créer, modifier, désactiver et historiser chaque valeur de référentiel. afin de sécuriser et fluidifier le processus administration et paramétrage.
- **Critère d’acceptation principal** : Toute modification conserve auteur, date, ancienne et nouvelle valeur.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ADM-002 - Soumettre les changements sensibles à validation à quatre yeux

- **Exigence source** : ADM-002
- **Acteur** : Administrateur fonctionnel CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur fonctionnel cnpm, je veux soumettre les changements sensibles à validation à quatre yeux. afin de sécuriser et fluidifier le processus administration et paramétrage.
- **Critère d’acceptation principal** : Aucune règle financière publiée sans second valideur.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ADM-003 - Importer/exporter les référentiels en Excel avec contrôle de format

- **Exigence source** : ADM-003
- **Acteur** : Administrateur fonctionnel CNPM
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que administrateur fonctionnel cnpm, je veux importer/exporter les référentiels en Excel avec contrôle de format. afin de sécuriser et fluidifier le processus administration et paramétrage.
- **Critère d’acceptation principal** : Rapport d’erreurs ligne par ligne disponible.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ADM-004 - Versionner les barèmes et empêcher les modifications rétroactives non autorisées

- **Exigence source** : ADM-004
- **Acteur** : Administrateur fonctionnel CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur fonctionnel cnpm, je veux versionner les barèmes et empêcher les modifications rétroactives non autorisées. afin de sécuriser et fluidifier le processus administration et paramétrage.
- **Critère d’acceptation principal** : Une version publiée est immutable; une correction crée une nouvelle version.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ADM-005 - Simuler l’impact d’un nouveau barème avant publication

- **Exigence source** : ADM-005
- **Acteur** : Administrateur fonctionnel CNPM
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que administrateur fonctionnel cnpm, je veux simuler l’impact d’un nouveau barème avant publication. afin de sécuriser et fluidifier le processus administration et paramétrage.
- **Critère d’acceptation principal** : Le système calcule le montant projeté sur la base active.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Membres et entreprises

### US-MEM-001 - Attribuer un identifiant CNPM unique non réutilisable

- **Exigence source** : MEM-001
- **Acteur** : Gestionnaire des membres
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que gestionnaire des membres, je veux attribuer un identifiant CNPM unique non réutilisable. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : Deux comptes ne peuvent partager le même identifiant.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-002 - Détecter les doublons par NIF, RCCM, raison sociale, téléphone et e-mail

- **Exigence source** : MEM-002
- **Acteur** : Gestionnaire des membres
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que gestionnaire des membres, je veux détecter les doublons par NIF, RCCM, raison sociale, téléphone et e-mail. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : Le système bloque ou soumet à arbitrage selon le score de similarité.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-003 - Gérer plusieurs établissements et plusieurs contacts par entreprise

- **Exigence source** : MEM-003
- **Acteur** : Gestionnaire des membres
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que gestionnaire des membres, je veux gérer plusieurs établissements et plusieurs contacts par entreprise. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : Un contact principal et un contact financier sont identifiables.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-004 - Historiser tout changement de catégorie, groupement, statut ou représentant

- **Exigence source** : MEM-004
- **Acteur** : Gestionnaire des membres
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que gestionnaire des membres, je veux historiser tout changement de catégorie, groupement, statut ou représentant. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : La timeline restitue la valeur, l’auteur, la date et le motif.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-005 - Gérer les fusions, changements de raison sociale et successions juridiques

- **Exigence source** : MEM-005
- **Acteur** : Gestionnaire des membres
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que gestionnaire des membres, je veux gérer les fusions, changements de raison sociale et successions juridiques. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : Les liens entre entités antérieures et nouvelles restent consultables.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-006 - Générer une carte membre numérique avec QR sécurisé

- **Exigence source** : MEM-006
- **Acteur** : Gestionnaire des membres
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que gestionnaire des membres, je veux générer une carte membre numérique avec QR sécurisé. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : Le QR ouvre une page de vérification sans exposer de données sensibles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-007 - Permettre une vue consolidée groupe de sociétés

- **Exigence source** : MEM-007
- **Acteur** : Gestionnaire des membres
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que gestionnaire des membres, je veux permettre une vue consolidée groupe de sociétés. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : Les soldes et contributions sont agrégés sans fusionner les comptes juridiques.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-MEM-008 - Exporter la fiche membre complète selon les droits

- **Exigence source** : MEM-008
- **Acteur** : Gestionnaire des membres
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que gestionnaire des membres, je veux exporter la fiche membre complète selon les droits. afin de sécuriser et fluidifier le processus membres et entreprises.
- **Critère d’acceptation principal** : PDF horodaté et journalisé, données masquées selon le rôle.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Enrôlement et adhésion

### US-ENR-001 - Proposer des formulaires adaptatifs selon forme juridique et catégorie

- **Exigence source** : ENR-001
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux proposer des formulaires adaptatifs selon forme juridique et catégorie. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : Les champs et pièces varient automatiquement selon le profil.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-002 - Sauvegarder un brouillon et reprendre sur un autre appareil

- **Exigence source** : ENR-002
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux sauvegarder un brouillon et reprendre sur un autre appareil. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : Le demandeur récupère son dossier après authentification OTP.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-003 - Capturer RCCM, NIF et contacts avec contrôle de format

- **Exigence source** : ENR-003
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux capturer RCCM, NIF et contacts avec contrôle de format. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : Les formats invalides sont refusés avant soumission.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-004 - Gérer les pièces obligatoires, facultatives et conditionnelles

- **Exigence source** : ENR-004
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux gérer les pièces obligatoires, facultatives et conditionnelles. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : La soumission est bloquée si une pièce requise manque.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-005 - Permettre au contrôleur de demander un complément avec motif

- **Exigence source** : ENR-005
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux permettre au contrôleur de demander un complément avec motif. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : Le membre reçoit la liste exacte et une échéance.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-006 - Tracer le consentement, la version de la politique et l’horodatage

- **Exigence source** : ENR-006
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux tracer le consentement, la version de la politique et l’horodatage. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : La preuve est exportable pour audit.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-007 - Mesurer le taux de conversion par canal, groupement et campagne

- **Exigence source** : ENR-007
- **Acteur** : Validateur des enrôlements
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que validateur des enrôlements, je veux mesurer le taux de conversion par canal, groupement et campagne. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : Le tableau de bord présente les étapes d’abandon.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-ENR-008 - Fonctionner en mode faible connectivité

- **Exigence source** : ENR-008
- **Acteur** : Validateur des enrôlements
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que validateur des enrôlements, je veux fonctionner en mode faible connectivité. afin de sécuriser et fluidifier le processus enrôlement et adhésion.
- **Critère d’acceptation principal** : Compression images, reprise de chargement et synchronisation différée.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Cotisations et échéanciers

### US-COT-001 - Générer automatiquement les appels selon l’exercice et le barème

- **Exigence source** : COT-001
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux générer automatiquement les appels selon l’exercice et le barème. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Chaque membre éligible reçoit un appel unique et traçable.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-002 - Soumettre une campagne d’appels à simulation puis validation

- **Exigence source** : COT-002
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux soumettre une campagne d’appels à simulation puis validation. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Le total, les exceptions et écarts sont visibles avant émission.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-003 - Émettre l’appel en PDF et via portail, e-mail, SMS ou push

- **Exigence source** : COT-003
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux émettre l’appel en PDF et via portail, e-mail, SMS ou push. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : L’historique de diffusion indique canal, date et statut.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-004 - Gérer les appels complémentaires, avoirs et annulations

- **Exigence source** : COT-004
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux gérer les appels complémentaires, avoirs et annulations. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Chaque correction référence l’appel initial et exige un motif.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-005 - Gérer les échéanciers et paiements partiels

- **Exigence source** : COT-005
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux gérer les échéanciers et paiements partiels. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Le solde et la prochaine échéance sont recalculés en temps réel.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-006 - Appliquer automatiquement la période de grâce et les pénalités

- **Exigence source** : COT-006
- **Acteur** : Responsable financier
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que responsable financier, je veux appliquer automatiquement la période de grâce et les pénalités. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Les règles sont versionnées et visibles dans le détail de calcul.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-007 - Bloquer la modification d’un appel déjà payé sans workflow d’annulation

- **Exigence source** : COT-007
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux bloquer la modification d’un appel déjà payé sans workflow d’annulation. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Une opération corrective génère une écriture compensatrice.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-COT-008 - Produire une situation de compte certifiable à une date donnée

- **Exigence source** : COT-008
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux produire une situation de compte certifiable à une date donnée. afin de sécuriser et fluidifier le processus cotisations et échéanciers.
- **Critère d’acceptation principal** : Le document restitue appels, paiements, soldes et ajustements.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Paiements et rapprochement

### US-PAY-001 - Générer une référence de paiement unique et non prédictible

- **Exigence source** : PAY-001
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux générer une référence de paiement unique et non prédictible. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : La référence permet d’identifier membre, appel et canal sans exposer d’information sensible.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-002 - Recevoir les statuts des opérateurs via API sécurisée

- **Exigence source** : PAY-002
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux recevoir les statuts des opérateurs via API sécurisée. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : Chaque callback est authentifié, idempotent et journalisé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-003 - Importer les relevés bancaires en formats configurables

- **Exigence source** : PAY-003
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux importer les relevés bancaires en formats configurables. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : Le système détecte doublons, incohérences et lignes non imputées.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-004 - Rapprocher automatiquement par référence, montant, date et payeur

- **Exigence source** : PAY-004
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux rapprocher automatiquement par référence, montant, date et payeur. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : Un score explique la proposition; le seuil est paramétrable.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-005 - Présenter une file de rapprochement manuel

- **Exigence source** : PAY-005
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux présenter une file de rapprochement manuel. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : L’agent voit preuve, candidat, écarts et historique avant décision.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-006 - Gérer trop-perçus, sous-paiements, remboursements et rejets

- **Exigence source** : PAY-006
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux gérer trop-perçus, sous-paiements, remboursements et rejets. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : Chaque cas suit un workflow comptable et laisse une piste d’audit.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-007 - Empêcher la double confirmation d’une transaction

- **Exigence source** : PAY-007
- **Acteur** : Comptable CNPM
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que comptable cnpm, je veux empêcher la double confirmation d’une transaction. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : Les clés d’idempotence et contrôles d’unicité bloquent le doublon.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PAY-008 - Alerter sur les anomalies et paiements suspects

- **Exigence source** : PAY-008
- **Acteur** : Comptable CNPM
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que comptable cnpm, je veux alerter sur les anomalies et paiements suspects. afin de sécuriser et fluidifier le processus paiements et rapprochement.
- **Critère d’acceptation principal** : Règles : montant inhabituel, canal incohérent, répétition, modification de compte.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Reçus et attestations

### US-REC-001 - Émettre un reçu uniquement après confirmation CNPM

- **Exigence source** : REC-001
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux émettre un reçu uniquement après confirmation CNPM. afin de sécuriser et fluidifier le processus reçus et attestations.
- **Critère d’acceptation principal** : Aucun reçu officiel ne peut être produit sur paiement non confirmé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REC-002 - Inclure numéro unique, membre, montant, période, canal, date et signature

- **Exigence source** : REC-002
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux inclure numéro unique, membre, montant, période, canal, date et signature. afin de sécuriser et fluidifier le processus reçus et attestations.
- **Critère d’acceptation principal** : Le PDF contient toutes les mentions obligatoires et le logo CNPM.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REC-003 - Signer électroniquement et apposer un QR de vérification

- **Exigence source** : REC-003
- **Acteur** : Responsable financier
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que responsable financier, je veux signer électroniquement et apposer un QR de vérification. afin de sécuriser et fluidifier le processus reçus et attestations.
- **Critère d’acceptation principal** : Le QR valide l’authenticité sans exposer de données confidentielles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REC-004 - Notifier le membre par portail, e-mail, SMS et/ou push

- **Exigence source** : REC-004
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux notifier le membre par portail, e-mail, SMS et/ou push. afin de sécuriser et fluidifier le processus reçus et attestations.
- **Critère d’acceptation principal** : Le statut de livraison est conservé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REC-005 - Annuler/remplacer un reçu via workflow contrôlé

- **Exigence source** : REC-005
- **Acteur** : Responsable financier
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que responsable financier, je veux annuler/remplacer un reçu via workflow contrôlé. afin de sécuriser et fluidifier le processus reçus et attestations.
- **Critère d’acceptation principal** : Le reçu annulé reste archivé et la version de remplacement le référence.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REC-006 - Permettre la vérification publique limitée d’un reçu

- **Exigence source** : REC-006
- **Acteur** : Responsable financier
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que responsable financier, je veux permettre la vérification publique limitée d’un reçu. afin de sécuriser et fluidifier le processus reçus et attestations.
- **Critère d’acceptation principal** : La page confirme authenticité, statut et montant sans données excessives.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Recouvrement et relances

### US-REL-001 - Configurer des séquences par événement, délai, canal et segment

- **Exigence source** : REL-001
- **Acteur** : Agent de recouvrement
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que agent de recouvrement, je veux configurer des séquences par événement, délai, canal et segment. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Exemple : J-15 e-mail, J-7 SMS, J+3 appel, J+15 courrier.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-002 - Personnaliser les messages avec données membre et solde

- **Exigence source** : REL-002
- **Acteur** : Agent de recouvrement
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que agent de recouvrement, je veux personnaliser les messages avec données membre et solde. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Les modèles affichent un aperçu avant envoi.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-003 - Gérer les consentements et préférences de communication

- **Exigence source** : REL-003
- **Acteur** : Agent de recouvrement
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que agent de recouvrement, je veux gérer les consentements et préférences de communication. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Le canal non autorisé n’est jamais utilisé, sauf obligation légale.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-004 - Suspendre automatiquement les relances en cas de litige ou promesse active

- **Exigence source** : REL-004
- **Acteur** : Agent de recouvrement
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que agent de recouvrement, je veux suspendre automatiquement les relances en cas de litige ou promesse active. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : La suspension est visible et datée.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-005 - Créer et suivre les promesses de paiement

- **Exigence source** : REL-005
- **Acteur** : Agent de recouvrement
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que agent de recouvrement, je veux créer et suivre les promesses de paiement. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Montant, date, commentaire et statut tenu/non tenu sont obligatoires.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-006 - Planifier appels, visites et rendez-vous

- **Exigence source** : REL-006
- **Acteur** : Agent de recouvrement
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que agent de recouvrement, je veux planifier appels, visites et rendez-vous. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Les tâches apparaissent dans l’agenda et le portefeuille de l’agent.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-007 - Mesurer performance par campagne, agent, canal et segment

- **Exigence source** : REL-007
- **Acteur** : Agent de recouvrement
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que agent de recouvrement, je veux mesurer performance par campagne, agent, canal et segment. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Taux de contact, conversion, montant récupéré, coût et délai moyen.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REL-008 - Proposer une priorisation assistée par score

- **Exigence source** : REL-008
- **Acteur** : Agent de recouvrement
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que agent de recouvrement, je veux proposer une priorisation assistée par score. afin de sécuriser et fluidifier le processus recouvrement et relances.
- **Critère d’acceptation principal** : Le score est explicable et ne décide pas seul d’une sanction.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Portail et application membre

### US-PRT-001 - Connexion par mot de passe ou OTP avec 2FA selon risque

- **Exigence source** : PRT-001
- **Acteur** : Membre autorisé
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que membre autorisé, je veux connexion par mot de passe ou OTP avec 2FA selon risque. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Le membre peut récupérer son accès sans intervention manuelle abusive.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-002 - Consulter le détail des cotisations et télécharger les appels

- **Exigence source** : PRT-002
- **Acteur** : Membre autorisé
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que membre autorisé, je veux consulter le détail des cotisations et télécharger les appels. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Les calculs et ajustements sont explicités.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-003 - Initier un paiement et suivre son statut

- **Exigence source** : PRT-003
- **Acteur** : Membre autorisé
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que membre autorisé, je veux initier un paiement et suivre son statut. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Le statut est actualisé et les échecs sont expliqués.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-004 - Télécharger reçus, attestations et carte membre

- **Exigence source** : PRT-004
- **Acteur** : Membre autorisé
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que membre autorisé, je veux télécharger reçus, attestations et carte membre. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Les documents sont signés et vérifiables.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-005 - Mettre à jour les informations soumises à validation

- **Exigence source** : PRT-005
- **Acteur** : Membre autorisé
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que membre autorisé, je veux mettre à jour les informations soumises à validation. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Les changements sensibles restent en attente jusqu’à validation.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-006 - Déposer et suivre une requête ou réclamation

- **Exigence source** : PRT-006
- **Acteur** : Membre autorisé
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que membre autorisé, je veux déposer et suivre une requête ou réclamation. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Le membre voit le SLA, les réponses et les pièces demandées.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-007 - Inscrire des représentants aux événements

- **Exigence source** : PRT-007
- **Acteur** : Membre autorisé
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que membre autorisé, je veux inscrire des représentants aux événements. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Confirmation, QR d’accès et rappel automatiques.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-008 - Gérer les utilisateurs délégués de l’entreprise

- **Exigence source** : PRT-008
- **Acteur** : Membre autorisé
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que membre autorisé, je veux gérer les utilisateurs délégués de l’entreprise. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Le représentant principal attribue des droits limités.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-009 - Utiliser l’application en français et préparer d’autres langues

- **Exigence source** : PRT-009
- **Acteur** : Membre autorisé
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que membre autorisé, je veux utiliser l’application en français et préparer d’autres langues. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Tous les libellés sont externalisés et traduisibles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRT-010 - Recevoir des notifications push pertinentes

- **Exigence source** : PRT-010
- **Acteur** : Membre autorisé
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que membre autorisé, je veux recevoir des notifications push pertinentes. afin de sécuriser et fluidifier le processus portail et application membre.
- **Critère d’acceptation principal** : Les préférences sont modifiables et la désinscription respectée.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Requêtes et réclamations

### US-REQ-001 - Attribuer un numéro de dossier unique et un accusé de réception

- **Exigence source** : REQ-001
- **Acteur** : Agent services aux membres
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que agent services aux membres, je veux attribuer un numéro de dossier unique et un accusé de réception. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Le membre reçoit numéro, date et délai cible.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-002 - Qualifier automatiquement ou manuellement la demande

- **Exigence source** : REQ-002
- **Acteur** : Agent services aux membres
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que agent services aux membres, je veux qualifier automatiquement ou manuellement la demande. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Catégorie, priorité, service, confidentialité et responsable sont définis.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-003 - Affecter selon compétence, charge et groupement

- **Exigence source** : REQ-003
- **Acteur** : Agent services aux membres
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que agent services aux membres, je veux affecter selon compétence, charge et groupement. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : L’affectation automatique peut être reprise avec motif.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-004 - Gérer échanges, pièces, commentaires internes et réponses externes

- **Exigence source** : REQ-004
- **Acteur** : Agent services aux membres
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que agent services aux membres, je veux gérer échanges, pièces, commentaires internes et réponses externes. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Les notes internes ne sont jamais visibles du membre.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-005 - Suivre SLA, relances internes et escalades

- **Exigence source** : REQ-005
- **Acteur** : Agent services aux membres
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que agent services aux membres, je veux suivre SLA, relances internes et escalades. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Des alertes sont envoyées avant et après dépassement.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-006 - Permettre au membre de réouvrir dans un délai paramétrable

- **Exigence source** : REQ-006
- **Acteur** : Agent services aux membres
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que agent services aux membres, je veux permettre au membre de réouvrir dans un délai paramétrable. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Le motif de réouverture est obligatoire.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-007 - Mesurer satisfaction et qualité de service

- **Exigence source** : REQ-007
- **Acteur** : Agent services aux membres
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que agent services aux membres, je veux mesurer satisfaction et qualité de service. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Score, verbatim et motif d’insatisfaction sont exploitables en BI.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-REQ-008 - Capitaliser les réponses en base de connaissances

- **Exigence source** : REQ-008
- **Acteur** : Agent services aux membres
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que agent services aux membres, je veux capitaliser les réponses en base de connaissances. afin de sécuriser et fluidifier le processus requêtes et réclamations.
- **Critère d’acceptation principal** : Une réponse validée peut être transformée en article FAQ.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Groupements professionnels

### US-GRP-001 - Créer les groupements, responsables, mandats et zones

- **Exigence source** : GRP-001
- **Acteur** : Référent de groupement
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que référent de groupement, je veux créer les groupements, responsables, mandats et zones. afin de sécuriser et fluidifier le processus groupements professionnels.
- **Critère d’acceptation principal** : Chaque membre est rattaché à un ou plusieurs groupements selon règles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GRP-002 - Attribuer un portefeuille de prospects et membres

- **Exigence source** : GRP-002
- **Acteur** : Référent de groupement
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que référent de groupement, je veux attribuer un portefeuille de prospects et membres. afin de sécuriser et fluidifier le processus groupements professionnels.
- **Critère d’acceptation principal** : Le groupement ne voit que son périmètre autorisé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GRP-003 - Suivre objectifs d’enrôlement, cotisation et réactivation

- **Exigence source** : GRP-003
- **Acteur** : Référent de groupement
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que référent de groupement, je veux suivre objectifs d’enrôlement, cotisation et réactivation. afin de sécuriser et fluidifier le processus groupements professionnels.
- **Critère d’acceptation principal** : Les objectifs et réalisations sont comparables par période.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GRP-004 - Former et habiliter des référents de groupement

- **Exigence source** : GRP-004
- **Acteur** : Référent de groupement
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que référent de groupement, je veux former et habiliter des référents de groupement. afin de sécuriser et fluidifier le processus groupements professionnels.
- **Critère d’acceptation principal** : Le système suit habilitation, date de formation et expiration.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GRP-005 - Gérer les commissions, membres, mandats et documents

- **Exigence source** : GRP-005
- **Acteur** : Référent de groupement
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que référent de groupement, je veux gérer les commissions, membres, mandats et documents. afin de sécuriser et fluidifier le processus groupements professionnels.
- **Critère d’acceptation principal** : L’historique des compositions est conservé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GRP-006 - Produire des tableaux de bord sectoriels

- **Exigence source** : GRP-006
- **Acteur** : Référent de groupement
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que référent de groupement, je veux produire des tableaux de bord sectoriels. afin de sécuriser et fluidifier le processus groupements professionnels.
- **Critère d’acceptation principal** : Encaissements, adhésions, retard et engagement par groupement.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Primes et partage de revenus

### US-PRI-001 - Associer chaque encaissement à une catégorie de mobilisation

- **Exigence source** : PRI-001
- **Acteur** : Commission de vérification
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que commission de vérification, je veux associer chaque encaissement à une catégorie de mobilisation. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : La catégorie est déterminée par règle et peut être corrigée avec validation.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRI-002 - Calculer automatiquement la prime selon taux, base et plafonds

- **Exigence source** : PRI-002
- **Acteur** : Commission de vérification
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que commission de vérification, je veux calculer automatiquement la prime selon taux, base et plafonds. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : Le détail de calcul est explicable et exportable.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRI-003 - Gérer contestations, corrections et rétrocessions

- **Exigence source** : PRI-003
- **Acteur** : Commission de vérification
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que commission de vérification, je veux gérer contestations, corrections et rétrocessions. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : Aucune suppression; les ajustements sont tracés.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRI-004 - Produire un état mensuel soumis à commission de vérification

- **Exigence source** : PRI-004
- **Acteur** : Commission de vérification
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que commission de vérification, je veux produire un état mensuel soumis à commission de vérification. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : État par agent, catégorie, membre, encaissement et montant.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRI-005 - Valider puis figer la période de prime

- **Exigence source** : PRI-005
- **Acteur** : Commission de vérification
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que commission de vérification, je veux valider puis figer la période de prime. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : Une période clôturée ne change que par réouverture autorisée.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRI-006 - Calculer la rémunération du prestataire sur encaissements éligibles

- **Exigence source** : PRI-006
- **Acteur** : Commission de vérification
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que commission de vérification, je veux calculer la rémunération du prestataire sur encaissements éligibles. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : Les cotisants maintenus sur l’ancien système sont exclus.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-PRI-007 - Comparer encaissement brut, frais canal, prime et net CNPM

- **Exigence source** : PRI-007
- **Acteur** : Commission de vérification
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que commission de vérification, je veux comparer encaissement brut, frais canal, prime et net CNPM. afin de sécuriser et fluidifier le processus primes et partage de revenus.
- **Critère d’acceptation principal** : Le rapport de réconciliation détaille chaque composante.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Gestion électronique des documents

### US-GED-001 - Stocker les documents avec type, version, date, auteur et confidentialité

- **Exigence source** : GED-001
- **Acteur** : Utilisateur habilité
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que utilisateur habilité, je veux stocker les documents avec type, version, date, auteur et confidentialité. afin de sécuriser et fluidifier le processus gestion électronique des documents.
- **Critère d’acceptation principal** : Chaque document est rattaché à un objet métier et historisé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GED-002 - Analyser les fichiers par antivirus et contrôler extensions/tailles

- **Exigence source** : GED-002
- **Acteur** : Utilisateur habilité
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que utilisateur habilité, je veux analyser les fichiers par antivirus et contrôler extensions/tailles. afin de sécuriser et fluidifier le processus gestion électronique des documents.
- **Critère d’acceptation principal** : Un fichier dangereux est bloqué et l’incident journalisé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GED-003 - Gérer expiration des pièces et alertes de renouvellement

- **Exigence source** : GED-003
- **Acteur** : Utilisateur habilité
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que utilisateur habilité, je veux gérer expiration des pièces et alertes de renouvellement. afin de sécuriser et fluidifier le processus gestion électronique des documents.
- **Critère d’acceptation principal** : Le membre et le gestionnaire sont alertés avant échéance.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GED-004 - Appliquer des durées de conservation et gel légal

- **Exigence source** : GED-004
- **Acteur** : Utilisateur habilité
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que utilisateur habilité, je veux appliquer des durées de conservation et gel légal. afin de sécuriser et fluidifier le processus gestion électronique des documents.
- **Critère d’acceptation principal** : La suppression respecte la politique et les litiges en cours.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GED-005 - Rechercher par métadonnées et contenu OCR

- **Exigence source** : GED-005
- **Acteur** : Utilisateur habilité
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que utilisateur habilité, je veux rechercher par métadonnées et contenu OCR. afin de sécuriser et fluidifier le processus gestion électronique des documents.
- **Critère d’acceptation principal** : Les scans lisibles deviennent interrogeables.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-GED-006 - Générer les documents depuis des modèles approuvés

- **Exigence source** : GED-006
- **Acteur** : Utilisateur habilité
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que utilisateur habilité, je veux générer les documents depuis des modèles approuvés. afin de sécuriser et fluidifier le processus gestion électronique des documents.
- **Critère d’acceptation principal** : Les données fusionnées sont contrôlées et le modèle versionné.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Événements et formations

### US-EVT-001 - Créer événements, sessions, capacités, lieux et publics cibles

- **Exigence source** : EVT-001
- **Acteur** : Responsable événements
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que responsable événements, je veux créer événements, sessions, capacités, lieux et publics cibles. afin de sécuriser et fluidifier le processus événements et formations.
- **Critère d’acceptation principal** : Les inscriptions sont limitées selon critères et capacité.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-EVT-002 - Permettre l’inscription des représentants du membre

- **Exigence source** : EVT-002
- **Acteur** : Responsable événements
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que responsable événements, je veux permettre l’inscription des représentants du membre. afin de sécuriser et fluidifier le processus événements et formations.
- **Critère d’acceptation principal** : Confirmation et QR individuel générés.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-EVT-003 - Gérer présence, certificat et satisfaction

- **Exigence source** : EVT-003
- **Acteur** : Responsable événements
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que responsable événements, je veux gérer présence, certificat et satisfaction. afin de sécuriser et fluidifier le processus événements et formations.
- **Critère d’acceptation principal** : La participation alimente l’indicateur d’engagement membre.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-EVT-004 - Publier actualités et documents ciblés

- **Exigence source** : EVT-004
- **Acteur** : Responsable événements
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que responsable événements, je veux publier actualités et documents ciblés. afin de sécuriser et fluidifier le processus événements et formations.
- **Critère d’acceptation principal** : Le contenu peut être public, réservé ou limité à un segment.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Décisionnel et reporting

### US-BI-001 - Filtrer par période, exercice, membre, catégorie, secteur, groupement et canal

- **Exigence source** : BI-001
- **Acteur** : Direction CNPM
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que direction cnpm, je veux filtrer par période, exercice, membre, catégorie, secteur, groupement et canal. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : Les filtres s’appliquent à tous les visuels cohérents.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-002 - Naviguer du KPI agrégé jusqu’à la transaction autorisée

- **Exigence source** : BI-002
- **Acteur** : Direction CNPM
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que direction cnpm, je veux naviguer du KPI agrégé jusqu’à la transaction autorisée. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : Le drill-down respecte les habilitations et masque les données sensibles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-003 - Exporter en Excel, PDF et CSV avec horodatage

- **Exigence source** : BI-003
- **Acteur** : Direction CNPM
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que direction cnpm, je veux exporter en Excel, PDF et CSV avec horodatage. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : L’export conserve filtres, auteur et date.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-004 - Programmer l’envoi de rapports aux destinataires autorisés

- **Exigence source** : BI-004
- **Acteur** : Direction CNPM
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que direction cnpm, je veux programmer l’envoi de rapports aux destinataires autorisés. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : Fréquence, format, filtre et durée de validité configurables.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-005 - Définir objectifs et seuils d’alerte

- **Exigence source** : BI-005
- **Acteur** : Direction CNPM
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que direction cnpm, je veux définir objectifs et seuils d’alerte. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : Les alertes montrent écart, cause probable et lien vers détail.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-006 - Afficher tendances, comparaisons N/N-1 et prévisions

- **Exigence source** : BI-006
- **Acteur** : Direction CNPM
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que direction cnpm, je veux afficher tendances, comparaisons N/N-1 et prévisions. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : Les méthodes de prévision et marges d’incertitude sont documentées.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-007 - Maintenir un dictionnaire des KPI

- **Exigence source** : BI-007
- **Acteur** : Direction CNPM
- **Priorité** : Must
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 8 points
- **User story** : En tant que direction cnpm, je veux maintenir un dictionnaire des KPI. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : Définition, formule, source, fréquence et propriétaire accessibles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-BI-008 - Permettre des tableaux de bord personnalisés par rôle

- **Exigence source** : BI-008
- **Acteur** : Direction CNPM
- **Priorité** : Could
- **Release cible** : R3 - Innovation
- **Estimation initiale** : 3 points
- **User story** : En tant que direction cnpm, je veux permettre des tableaux de bord personnalisés par rôle. afin de sécuriser et fluidifier le processus décisionnel et reporting.
- **Critère d’acceptation principal** : L’utilisateur peut enregistrer sa vue sans modifier la vue institutionnelle.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Sécurité et identité

### US-SEC-001 - Imposer 2FA aux administrateurs, financiers et comptes sensibles

- **Exigence source** : SEC-001
- **Acteur** : Administrateur sécurité
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur sécurité, je veux imposer 2FA aux administrateurs, financiers et comptes sensibles. afin de sécuriser et fluidifier le processus sécurité et identité.
- **Critère d’acceptation principal** : TOTP, application d’authentification ou OTP; SMS en secours contrôlé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-SEC-002 - Appliquer une authentification adaptative selon risque

- **Exigence source** : SEC-002
- **Acteur** : Administrateur sécurité
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que administrateur sécurité, je veux appliquer une authentification adaptative selon risque. afin de sécuriser et fluidifier le processus sécurité et identité.
- **Critère d’acceptation principal** : Nouvel appareil, pays inhabituel ou action sensible déclenche une étape supplémentaire.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-SEC-003 - Gérer politique de mot de passe, verrouillage et récupération sécurisée

- **Exigence source** : SEC-003
- **Acteur** : Administrateur sécurité
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur sécurité, je veux gérer politique de mot de passe, verrouillage et récupération sécurisée. afin de sécuriser et fluidifier le processus sécurité et identité.
- **Critère d’acceptation principal** : La récupération ne révèle pas l’existence d’un compte.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-SEC-004 - Révoquer sessions et appareils depuis le profil

- **Exigence source** : SEC-004
- **Acteur** : Administrateur sécurité
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que administrateur sécurité, je veux révoquer sessions et appareils depuis le profil. afin de sécuriser et fluidifier le processus sécurité et identité.
- **Critère d’acceptation principal** : L’utilisateur voit les sessions actives et peut les fermer.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-SEC-005 - Supporter SSO/OIDC pour les agents CNPM

- **Exigence source** : SEC-005
- **Acteur** : Administrateur sécurité
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que administrateur sécurité, je veux supporter SSO/OIDC pour les agents CNPM. afin de sécuriser et fluidifier le processus sécurité et identité.
- **Critère d’acceptation principal** : Intégration à un fournisseur d’identité possible sans refonte.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Audit et conformité

### US-AUD-001 - Journaliser connexions, consultations sensibles, créations, modifications, validations et exports

- **Exigence source** : AUD-001
- **Acteur** : Auditeur habilité
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que auditeur habilité, je veux journaliser connexions, consultations sensibles, créations, modifications, validations et exports. afin de sécuriser et fluidifier le processus audit et conformité.
- **Critère d’acceptation principal** : Événement, auteur, horodatage, objet, avant/après, IP/appareil et résultat.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-AUD-002 - Rendre les journaux inaltérables et consultables par l’auditeur

- **Exigence source** : AUD-002
- **Acteur** : Auditeur habilité
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que auditeur habilité, je veux rendre les journaux inaltérables et consultables par l’auditeur. afin de sécuriser et fluidifier le processus audit et conformité.
- **Critère d’acceptation principal** : Les utilisateurs opérationnels ne peuvent ni modifier ni supprimer.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-AUD-003 - Rechercher et exporter les événements pour une période

- **Exigence source** : AUD-003
- **Acteur** : Auditeur habilité
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que auditeur habilité, je veux rechercher et exporter les événements pour une période. afin de sécuriser et fluidifier le processus audit et conformité.
- **Critère d’acceptation principal** : Export signé/horodaté avec filtres et motif d’accès.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-AUD-004 - Déclencher alertes sur événements critiques

- **Exigence source** : AUD-004
- **Acteur** : Auditeur habilité
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que auditeur habilité, je veux déclencher alertes sur événements critiques. afin de sécuriser et fluidifier le processus audit et conformité.
- **Critère d’acceptation principal** : Exemples : compte privilégié, changement bancaire, export massif, échecs répétés.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-AUD-005 - Définir la durée de conservation par type de journal

- **Exigence source** : AUD-005
- **Acteur** : Auditeur habilité
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que auditeur habilité, je veux définir la durée de conservation par type de journal. afin de sécuriser et fluidifier le processus audit et conformité.
- **Critère d’acceptation principal** : La politique est paramétrable et conforme aux obligations applicables.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Intégrations et interopérabilité

### US-INT-001 - Prévoir un identifiant de correspondance externe par entreprise

- **Exigence source** : INT-001
- **Acteur** : Système partenaire
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que système partenaire, je veux prévoir un identifiant de correspondance externe par entreprise. afin de sécuriser et fluidifier le processus intégrations et interopérabilité.
- **Critère d’acceptation principal** : Plusieurs identifiants externes peuvent être liés sans remplacer l’ID CNPM.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-INT-002 - Versionner les API et contrats d’échange

- **Exigence source** : INT-002
- **Acteur** : Système partenaire
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que système partenaire, je veux versionner les API et contrats d’échange. afin de sécuriser et fluidifier le processus intégrations et interopérabilité.
- **Critère d’acceptation principal** : Une nouvelle version n’interrompt pas les consommateurs existants.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-INT-003 - Gérer consentement et base légale avant tout échange

- **Exigence source** : INT-003
- **Acteur** : Système partenaire
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que système partenaire, je veux gérer consentement et base légale avant tout échange. afin de sécuriser et fluidifier le processus intégrations et interopérabilité.
- **Critère d’acceptation principal** : Chaque flux est documenté et autorisé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-INT-004 - Tracer l’origine, la date et la qualité de chaque donnée importée

- **Exigence source** : INT-004
- **Acteur** : Système partenaire
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que système partenaire, je veux tracer l’origine, la date et la qualité de chaque donnée importée. afin de sécuriser et fluidifier le processus intégrations et interopérabilité.
- **Critère d’acceptation principal** : La provenance reste visible et auditable.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-INT-005 - Résoudre les conflits de données selon règles de confiance

- **Exigence source** : INT-005
- **Acteur** : Système partenaire
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que système partenaire, je veux résoudre les conflits de données selon règles de confiance. afin de sécuriser et fluidifier le processus intégrations et interopérabilité.
- **Critère d’acceptation principal** : Aucune donnée CNPM validée n’est écrasée silencieusement.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-INT-006 - Tester l’intégration dans un environnement sandbox

- **Exigence source** : INT-006
- **Acteur** : Système partenaire
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que système partenaire, je veux tester l’intégration dans un environnement sandbox. afin de sécuriser et fluidifier le processus intégrations et interopérabilité.
- **Critère d’acceptation principal** : Jeux de données fictifs, clés distinctes et journal de tests.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## PostgreSQL et données

### US-DB-001 - Utiliser PostgreSQL comme seul SGBD relationnel de production

- **Exigence source** : DB-001
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux utiliser PostgreSQL comme seul SGBD relationnel de production. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Les bases métier, Keycloak, Flowable et métadonnées BI utilisent PostgreSQL; H2 est limité aux tests locaux.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-002 - Maintenir PostgreSQL sur une version officiellement supportée et le dernier correctif mineur validé

- **Exigence source** : DB-002
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux maintenir PostgreSQL sur une version officiellement supportée et le dernier correctif mineur validé. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : La matrice de versions indique date d'installation, patch, fin de support et plan de montée de version.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-003 - Séparer les domaines par schémas et propriétaires techniques distincts

- **Exigence source** : DB-003
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux séparer les domaines par schémas et propriétaires techniques distincts. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Exemples : member, contribution, payment, recovery, service, governance, integration, audit, reporting.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-004 - Employer des clés techniques UUID et des numéros métiers lisibles séparés

- **Exigence source** : DB-004
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux employer des clés techniques UUID et des numéros métiers lisibles séparés. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Un changement de numéro métier ne modifie jamais la clé ni les relations.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-005 - Stocker les montants en NUMERIC avec code devise et règles d'arrondi explicites

- **Exigence source** : DB-005
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux stocker les montants en NUMERIC avec code devise et règles d'arrondi explicites. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Aucun type flottant n'est utilisé pour une cotisation, prime, commission, frais ou solde.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-006 - Stocker les horodatages en TIMESTAMPTZ et afficher selon Africa/Bamako

- **Exigence source** : DB-006
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux stocker les horodatages en TIMESTAMPTZ et afficher selon Africa/Bamako. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : L'instant UTC, le fuseau d'affichage et la date métier restent non ambigus.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-007 - Imposer clés étrangères, unicité, CHECK et transactions sur les invariants métier

- **Exigence source** : DB-007
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux imposer clés étrangères, unicité, CHECK et transactions sur les invariants métier. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Les incohérences critiques sont rejetées même si elles proviennent d'un import ou d'une API.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-008 - Rendre les écritures financières validées append-only

- **Exigence source** : DB-008
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux rendre les écritures financières validées append-only. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Aucune suppression physique; annulation et correction par écritures compensatrices liées.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-009 - Garantir l'idempotence par contraintes uniques et clés de déduplication

- **Exigence source** : DB-009
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux garantir l'idempotence par contraintes uniques et clés de déduplication. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Une transaction externe, un webhook ou un lot rejoué ne peut être comptabilisé deux fois.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-010 - Limiter JSONB aux métadonnées extensibles non critiques

- **Exigence source** : DB-010
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux limiter JSONB aux métadonnées extensibles non critiques. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Les champs de recherche, calcul, contrôle ou reporting sont modélisés en colonnes typées.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-011 - Indexer et partitionner selon des mesures réelles

- **Exigence source** : DB-011
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que administrateur postgresql, je veux indexer et partitionner selon des mesures réelles. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : B-tree par défaut; GIN/pg_trgm pour recherche; partitionnement des audits, événements et notifications si nécessaire.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-012 - Appliquer les migrations par Flyway dans la CI/CD

- **Exigence source** : DB-012
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux appliquer les migrations par Flyway dans la CI/CD. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Scripts versionnés, revus, testés sur copie représentative et compatibles avec un déploiement progressif.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-013 - Mettre en place sauvegardes chiffrées, archivage WAL et PITR

- **Exigence source** : DB-013
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux mettre en place sauvegardes chiffrées, archivage WAL et PITR. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : RPO 15 min et RTO 4 h démontrés par un test de restauration documenté.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-014 - Prévoir haute disponibilité et lecture décisionnelle séparée

- **Exigence source** : DB-014
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux prévoir haute disponibilité et lecture décisionnelle séparée. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Standby répliqué et bascule testée; BI sur réplique ou vues dédiées, jamais par requêtes lourdes sur le primaire.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-015 - Superviser capacité, verrous, réplication, vacuum et requêtes lentes

- **Exigence source** : DB-015
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux superviser capacité, verrous, réplication, vacuum et requêtes lentes. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Alertes, pg_stat_statements, seuils et runbooks d'intervention disponibles.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-DB-016 - Assurer la réversibilité PostgreSQL complète

- **Exigence source** : DB-016
- **Acteur** : Administrateur PostgreSQL
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que administrateur postgresql, je veux assurer la réversibilité PostgreSQL complète. afin de sécuriser et fluidifier le processus postgresql et données.
- **Critère d’acceptation principal** : Exports SQL et formats ouverts, schéma, dictionnaire, migrations, pièces et contrôles d’intégrité sont remis au CNPM.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

## Architecture technique et exploitation

### US-TEC-001 - Démontrer que PostgreSQL est l'unique source de vérité relationnelle

- **Exigence source** : TEC-001
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux démontrer que PostgreSQL est l'unique source de vérité relationnelle. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Inventaire des stockages et test de reprise prouvent qu'aucune donnée métier ne dépend uniquement d'un cache ou broker.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-002 - Fournir la matrice complète des versions, licences, CVE et fins de support

- **Exigence source** : TEC-002
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux fournir la matrice complète des versions, licences, CVE et fins de support. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Aucun composant en fin de vie ou sans correctif de sécurité dans la version candidate.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-003 - Interdire tout accès direct des applications clientes à PostgreSQL

- **Exigence source** : TEC-003
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux interdire tout accès direct des applications clientes à PostgreSQL. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Web et mobile passent exclusivement par les API authentifiées et autorisées.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-004 - Reproduire un environnement depuis le code et les artefacts versionnés

- **Exigence source** : TEC-004
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux reproduire un environnement depuis le code et les artefacts versionnés. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Installation automatisée sur environnement vierge avec résultat documenté.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-005 - Démontrer SSO, 2FA et séparation des rôles

- **Exigence source** : TEC-005
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux démontrer SSO, 2FA et séparation des rôles. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Scénarios positifs/négatifs pour administrateur, finance, agent, auditeur et membre.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-006 - Restaurer PostgreSQL à un instant choisi

- **Exigence source** : TEC-006
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux restaurer PostgreSQL à un instant choisi. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : RPO/RTO mesurés, contrôles fonctionnels et rapprochement financier après restauration.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-007 - Tester la bascule d'un nœud applicatif et de la base

- **Exigence source** : TEC-007
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux tester la bascule d'un nœud applicatif et de la base. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Aucune perte de transaction confirmée; reprise dans le SLA approuvé.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-008 - Valider les performances et la faible connectivité

- **Exigence source** : TEC-008
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux valider les performances et la faible connectivité. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Les seuils de la section 17.4 sont atteints sur un jeu de données et une charge représentatifs.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-009 - Prouver l'idempotence des paiements et webhooks

- **Exigence source** : TEC-009
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux prouver l'idempotence des paiements et webhooks. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Le même message rejoué plusieurs fois produit un seul effet financier.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-010 - Corréler logs, métriques et traces

- **Exigence source** : TEC-010
- **Acteur** : Équipe exploitation
- **Priorité** : Should
- **Release cible** : R2 - Déploiement élargi
- **Estimation initiale** : 5 points
- **User story** : En tant que équipe exploitation, je veux corréler logs, métriques et traces. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Une transaction de test est suivie de l'interface jusqu'à PostgreSQL et aux intégrations par correlation_id.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-011 - Appliquer les portes de sécurité CI/CD

- **Exigence source** : TEC-011
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux appliquer les portes de sécurité CI/CD. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Un secret de test, une vulnérabilité critique et un test échoué bloquent effectivement la promotion.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.

### US-TEC-012 - Exécuter un exercice de réversibilité

- **Exigence source** : TEC-012
- **Acteur** : Équipe exploitation
- **Priorité** : Must
- **Release cible** : R1 - PoC / socle
- **Estimation initiale** : 8 points
- **User story** : En tant que équipe exploitation, je veux exécuter un exercice de réversibilité. afin de sécuriser et fluidifier le processus architecture technique et exploitation.
- **Critère d’acceptation principal** : Code, images, configuration, schéma, migrations, données et pièces sont exportés puis réinstallés sous contrôle CNPM.
- **Contrôles transverses** : habilitation serveur, journal d’audit, erreurs normalisées, traçabilité et tests de non-régression.
