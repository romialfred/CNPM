-- V17__user_account_profile_and_type.sql
--
-- Module Utilisateurs : le compte ne portait qu'un `display_name`. L'écran de gestion
-- des utilisateurs demande une identité décomposée (prénom, nom) et un profil
-- professionnel (téléphone, fonction, organisation, département), ainsi que la nature du
-- compte (agent de la plateforme ou adhérent).
--
-- Aucune donnée existante n'est perdue : `display_name` reste la source d'affichage et
-- les nouvelles colonnes sont facultatives. Les comptes historiques sont donc valides
-- tels quels, et `account_type` prend la valeur par défaut PROFESSIONAL, qui décrit
-- exactement ce qu'ils sont aujourd'hui.
--
-- La photo de profil n'est PAS ajoutée ici : un média suppose stockage objet, contrôle
-- de type et analyse antivirus (`.claude/rules/security.md`). Une colonne d'URL sans ce
-- pipeline promettrait une fonctionnalité que rien ne sert.

ALTER TABLE iam.user_account
    ADD COLUMN first_name varchar(120),
    ADD COLUMN last_name varchar(120),
    ADD COLUMN phone varchar(40),
    ADD COLUMN job_title varchar(150),
    ADD COLUMN organization varchar(255),
    ADD COLUMN department varchar(150),
    ADD COLUMN account_type varchar(20) DEFAULT 'PROFESSIONAL' NOT NULL,
    ADD COLUMN member_id uuid;

-- Le jeu de valeurs est fermé côté base : un statut de compte inconnu du code ne peut pas
-- s'écrire, même par une écriture directe hors application.
ALTER TABLE iam.user_account
    ADD CONSTRAINT ck_iam_user_account_account_type
        CHECK (account_type IN ('PROFESSIONAL', 'MEMBER'));

-- Un compte MEMBRE désigne une adhésion ; un compte PROFESSIONNEL n'en désigne aucune.
-- La contrainte empêche les deux incohérences symétriques.
ALTER TABLE iam.user_account
    ADD CONSTRAINT ck_iam_user_account_member_link
        CHECK ((account_type = 'MEMBER' AND member_id IS NOT NULL)
            OR (account_type = 'PROFESSIONAL' AND member_id IS NULL));

-- Une adhésion ne porte qu'un seul compte membre. L'unicité tolère plusieurs NULL
-- (sémantique PostgreSQL), donc les comptes professionnels ne se gênent pas entre eux.
CREATE UNIQUE INDEX IF NOT EXISTS uq_iam_user_account_member_id
    ON iam.user_account (member_id);

CREATE INDEX IF NOT EXISTS idx_iam_user_account_account_type
    ON iam.user_account (account_type);

COMMENT ON COLUMN iam.user_account.first_name IS 'Prénom de la personne titulaire du compte.';
COMMENT ON COLUMN iam.user_account.last_name IS 'Nom de la personne titulaire du compte.';
COMMENT ON COLUMN iam.user_account.phone IS 'Téléphone professionnel de contact.';
COMMENT ON COLUMN iam.user_account.job_title IS 'Fonction occupée.';
COMMENT ON COLUMN iam.user_account.organization IS 'Organisation de rattachement, en clair.';
COMMENT ON COLUMN iam.user_account.department IS 'Direction ou département de rattachement.';
COMMENT ON COLUMN iam.user_account.account_type IS
    'PROFESSIONAL (agent de la plateforme) ou MEMBER (adhérent).';
COMMENT ON COLUMN iam.user_account.member_id IS
    'Adhésion désignée pour un compte MEMBER : identifiant de member.membership. '
    'Référence inter-module par identifiant, sans clé étrangère : le module IAM ne '
    'dépend pas du schéma privé du module MEMBER (.claude/rules/architecture.md).';
