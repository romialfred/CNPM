-- V1__create_schemas_and_tables.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS ref;
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS member;
CREATE SCHEMA IF NOT EXISTS enrollment;
CREATE SCHEMA IF NOT EXISTS contribution;
CREATE SCHEMA IF NOT EXISTS payment;
CREATE SCHEMA IF NOT EXISTS receipt;
CREATE SCHEMA IF NOT EXISTS recovery;
CREATE SCHEMA IF NOT EXISTS incentive;
CREATE SCHEMA IF NOT EXISTS service;
CREATE SCHEMA IF NOT EXISTS document;
CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS event;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reporting;

CREATE TABLE ref.reference_value (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    domain varchar(80) NOT NULL,
    code varchar(80) NOT NULL,
    label varchar(255) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    valid_from timestamptz,
    valid_to timestamptz,
    CONSTRAINT pk_ref_reference_value PRIMARY KEY (id)
);
COMMENT ON TABLE ref.reference_value IS 'Valeurs de référentiels historisées.';
COMMENT ON COLUMN ref.reference_value.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN ref.reference_value.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN ref.reference_value.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN ref.reference_value.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN ref.reference_value.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN ref.reference_value.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN ref.reference_value.domain IS 'Domaine de référence.';
COMMENT ON COLUMN ref.reference_value.code IS 'Code stable.';
COMMENT ON COLUMN ref.reference_value.label IS 'Libellé affiché.';
COMMENT ON COLUMN ref.reference_value.sort_order IS 'Ordre d’affichage.';
COMMENT ON COLUMN ref.reference_value.active IS 'Activation.';
COMMENT ON COLUMN ref.reference_value.valid_from IS 'Début de validité.';
COMMENT ON COLUMN ref.reference_value.valid_to IS 'Fin de validité.';

CREATE TABLE ref.number_sequence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    sequence_code varchar(80) NOT NULL,
    prefix_pattern varchar(120) NOT NULL,
    current_value bigint DEFAULT 0 NOT NULL,
    reset_period varchar(20) DEFAULT 'NEVER' NOT NULL,
    CONSTRAINT pk_ref_number_sequence PRIMARY KEY (id)
);
COMMENT ON TABLE ref.number_sequence IS 'Séquences de numérotation métier.';
COMMENT ON COLUMN ref.number_sequence.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN ref.number_sequence.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN ref.number_sequence.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN ref.number_sequence.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN ref.number_sequence.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN ref.number_sequence.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN ref.number_sequence.sequence_code IS 'Code de séquence.';
COMMENT ON COLUMN ref.number_sequence.prefix_pattern IS 'Préfixe et variables.';
COMMENT ON COLUMN ref.number_sequence.current_value IS 'Dernière valeur attribuée.';
COMMENT ON COLUMN ref.number_sequence.reset_period IS 'Périodicité de remise à zéro.';

CREATE TABLE iam.user_account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    keycloak_subject uuid NOT NULL,
    email varchar(320) NOT NULL,
    display_name varchar(255) NOT NULL,
    status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
    last_login_at timestamptz,
    CONSTRAINT pk_iam_user_account PRIMARY KEY (id)
);
COMMENT ON TABLE iam.user_account IS 'Compte utilisateur applicatif.';
COMMENT ON COLUMN iam.user_account.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.user_account.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.user_account.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.user_account.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.user_account.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.user_account.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.user_account.keycloak_subject IS 'Identifiant du fournisseur d’identité.';
COMMENT ON COLUMN iam.user_account.email IS 'Adresse de connexion.';
COMMENT ON COLUMN iam.user_account.display_name IS 'Nom affiché.';
COMMENT ON COLUMN iam.user_account.status IS 'État du compte.';
COMMENT ON COLUMN iam.user_account.last_login_at IS 'Dernière authentification.';

CREATE TABLE iam.role (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    code varchar(100) NOT NULL,
    label varchar(255) NOT NULL,
    privileged boolean DEFAULT false NOT NULL,
    CONSTRAINT pk_iam_role PRIMARY KEY (id)
);
COMMENT ON TABLE iam.role IS 'Rôles applicatifs.';
COMMENT ON COLUMN iam.role.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.role.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.role.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.role.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.role.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.role.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.role.code IS 'Code du rôle.';
COMMENT ON COLUMN iam.role.label IS 'Libellé.';
COMMENT ON COLUMN iam.role.privileged IS 'Indique un rôle privilégié.';

CREATE TABLE iam.permission (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    code varchar(120) NOT NULL,
    domain varchar(80) NOT NULL,
    description text NOT NULL,
    CONSTRAINT pk_iam_permission PRIMARY KEY (id)
);
COMMENT ON TABLE iam.permission IS 'Permissions atomiques.';
COMMENT ON COLUMN iam.permission.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.permission.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.permission.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.permission.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.permission.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.permission.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.permission.code IS 'Code de permission.';
COMMENT ON COLUMN iam.permission.domain IS 'Domaine.';
COMMENT ON COLUMN iam.permission.description IS 'Description.';

CREATE TABLE iam.role_permission (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    CONSTRAINT pk_iam_role_permission PRIMARY KEY (id)
);
COMMENT ON TABLE iam.role_permission IS 'Association rôle-permission.';
COMMENT ON COLUMN iam.role_permission.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.role_permission.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.role_permission.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.role_permission.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.role_permission.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.role_permission.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.role_permission.role_id IS 'Rôle.';
COMMENT ON COLUMN iam.role_permission.permission_id IS 'Permission.';

CREATE TABLE iam.user_role (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    scope_type varchar(40) DEFAULT 'GLOBAL' NOT NULL,
    scope_id uuid,
    valid_from timestamptz DEFAULT now() NOT NULL,
    valid_to timestamptz,
    approved_by uuid,
    CONSTRAINT pk_iam_user_role PRIMARY KEY (id)
);
COMMENT ON TABLE iam.user_role IS 'Attribution de rôle contextualisée.';
COMMENT ON COLUMN iam.user_role.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.user_role.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.user_role.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.user_role.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.user_role.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.user_role.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.user_role.user_id IS 'Compte.';
COMMENT ON COLUMN iam.user_role.role_id IS 'Rôle.';
COMMENT ON COLUMN iam.user_role.scope_type IS 'Type de périmètre.';
COMMENT ON COLUMN iam.user_role.scope_id IS 'Identifiant de périmètre.';
COMMENT ON COLUMN iam.user_role.valid_from IS 'Début.';
COMMENT ON COLUMN iam.user_role.valid_to IS 'Fin.';
COMMENT ON COLUMN iam.user_role.approved_by IS 'Second valideur.';

CREATE TABLE iam.mfa_registration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    user_id uuid NOT NULL,
    factor_type varchar(30) NOT NULL,
    credential_ref varchar(255) NOT NULL,
    verified_at timestamptz,
    revoked_at timestamptz,
    CONSTRAINT pk_iam_mfa_registration PRIMARY KEY (id)
);
COMMENT ON TABLE iam.mfa_registration IS 'Facteurs 2FA enregistrés.';
COMMENT ON COLUMN iam.mfa_registration.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.mfa_registration.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.mfa_registration.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.mfa_registration.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.mfa_registration.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.mfa_registration.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.mfa_registration.user_id IS 'Compte.';
COMMENT ON COLUMN iam.mfa_registration.factor_type IS 'TOTP ou WebAuthn.';
COMMENT ON COLUMN iam.mfa_registration.credential_ref IS 'Référence chiffrée, jamais le secret brut.';
COMMENT ON COLUMN iam.mfa_registration.verified_at IS 'Date de vérification.';
COMMENT ON COLUMN iam.mfa_registration.revoked_at IS 'Date de révocation.';

CREATE TABLE iam.access_review (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    review_code varchar(60) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    approved_at timestamptz,
    CONSTRAINT pk_iam_access_review PRIMARY KEY (id)
);
COMMENT ON TABLE iam.access_review IS 'Campagnes de revue d’accès.';
COMMENT ON COLUMN iam.access_review.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN iam.access_review.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN iam.access_review.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN iam.access_review.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN iam.access_review.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN iam.access_review.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN iam.access_review.review_code IS 'Référence.';
COMMENT ON COLUMN iam.access_review.period_start IS 'Début.';
COMMENT ON COLUMN iam.access_review.period_end IS 'Fin.';
COMMENT ON COLUMN iam.access_review.status IS 'État.';
COMMENT ON COLUMN iam.access_review.approved_at IS 'Validation finale.';

CREATE TABLE member.person (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    last_name varchar(150) NOT NULL,
    first_names varchar(200) NOT NULL,
    email varchar(320),
    phone varchar(30),
    job_title varchar(150),
    CONSTRAINT pk_member_person PRIMARY KEY (id)
);
COMMENT ON TABLE member.person IS 'Personnes physiques liées aux membres.';
COMMENT ON COLUMN member.person.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.person.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.person.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.person.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.person.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.person.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.person.last_name IS 'Nom.';
COMMENT ON COLUMN member.person.first_names IS 'Prénoms.';
COMMENT ON COLUMN member.person.email IS 'Courriel.';
COMMENT ON COLUMN member.person.phone IS 'Téléphone.';
COMMENT ON COLUMN member.person.job_title IS 'Fonction.';

CREATE TABLE member.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    legal_name varchar(255) NOT NULL,
    trade_name varchar(255),
    organization_type varchar(40) NOT NULL,
    sector_code varchar(80),
    status varchar(30) DEFAULT 'PROSPECT' NOT NULL,
    risk_level varchar(20) DEFAULT 'NORMAL' NOT NULL,
    CONSTRAINT pk_member_organization PRIMARY KEY (id)
);
COMMENT ON TABLE member.organization IS 'Personnes morales membres ou prospects.';
COMMENT ON COLUMN member.organization.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.organization.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.organization.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.organization.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.organization.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.organization.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.organization.legal_name IS 'Raison sociale.';
COMMENT ON COLUMN member.organization.trade_name IS 'Nom commercial.';
COMMENT ON COLUMN member.organization.organization_type IS 'Type.';
COMMENT ON COLUMN member.organization.sector_code IS 'Secteur.';
COMMENT ON COLUMN member.organization.status IS 'Statut.';
COMMENT ON COLUMN member.organization.risk_level IS 'Niveau de risque.';

CREATE TABLE member.organization_identifier (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    identifier_type varchar(40) NOT NULL,
    identifier_value varchar(160) NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    verified_at timestamptz,
    CONSTRAINT pk_member_organization_identifier PRIMARY KEY (id)
);
COMMENT ON TABLE member.organization_identifier IS 'Identifiants légaux et fiscaux.';
COMMENT ON COLUMN member.organization_identifier.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.organization_identifier.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.organization_identifier.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.organization_identifier.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.organization_identifier.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.organization_identifier.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.organization_identifier.organization_id IS 'Entreprise.';
COMMENT ON COLUMN member.organization_identifier.identifier_type IS 'NIF, RCCM ou autre.';
COMMENT ON COLUMN member.organization_identifier.identifier_value IS 'Valeur.';
COMMENT ON COLUMN member.organization_identifier.verified IS 'Vérifié.';
COMMENT ON COLUMN member.organization_identifier.verified_at IS 'Date de vérification.';

CREATE TABLE member.address (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid,
    person_id uuid,
    address_type varchar(30) NOT NULL,
    line1 varchar(255) NOT NULL,
    city varchar(120) NOT NULL,
    country_code char(2) DEFAULT 'ML' NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    CONSTRAINT pk_member_address PRIMARY KEY (id)
);
COMMENT ON TABLE member.address IS 'Adresses normalisées.';
COMMENT ON COLUMN member.address.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.address.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.address.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.address.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.address.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.address.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.address.organization_id IS 'Entreprise.';
COMMENT ON COLUMN member.address.person_id IS 'Personne.';
COMMENT ON COLUMN member.address.address_type IS 'Type.';
COMMENT ON COLUMN member.address.line1 IS 'Adresse.';
COMMENT ON COLUMN member.address.city IS 'Ville.';
COMMENT ON COLUMN member.address.country_code IS 'Pays ISO.';
COMMENT ON COLUMN member.address.is_primary IS 'Adresse principale.';

CREATE TABLE member.organization_contact (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    person_id uuid NOT NULL,
    contact_role varchar(50) NOT NULL,
    is_legal_representative boolean DEFAULT false NOT NULL,
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_to date,
    CONSTRAINT pk_member_organization_contact PRIMARY KEY (id)
);
COMMENT ON TABLE member.organization_contact IS 'Contacts et représentants.';
COMMENT ON COLUMN member.organization_contact.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.organization_contact.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.organization_contact.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.organization_contact.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.organization_contact.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.organization_contact.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.organization_contact.organization_id IS 'Entreprise.';
COMMENT ON COLUMN member.organization_contact.person_id IS 'Personne.';
COMMENT ON COLUMN member.organization_contact.contact_role IS 'Rôle du contact.';
COMMENT ON COLUMN member.organization_contact.is_legal_representative IS 'Représentant légal.';
COMMENT ON COLUMN member.organization_contact.valid_from IS 'Début.';
COMMENT ON COLUMN member.organization_contact.valid_to IS 'Fin.';

CREATE TABLE member.membership (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    membership_number varchar(60) NOT NULL,
    category_code varchar(50) NOT NULL,
    status varchar(30) DEFAULT 'PENDING' NOT NULL,
    joined_at date,
    activated_at timestamptz,
    CONSTRAINT pk_member_membership PRIMARY KEY (id)
);
COMMENT ON TABLE member.membership IS 'Adhésion d’une entreprise au CNPM.';
COMMENT ON COLUMN member.membership.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.membership.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.membership.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.membership.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.membership.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.membership.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.membership.organization_id IS 'Entreprise.';
COMMENT ON COLUMN member.membership.membership_number IS 'Numéro métier.';
COMMENT ON COLUMN member.membership.category_code IS 'Actif, dormant, prospect, grand cotisant.';
COMMENT ON COLUMN member.membership.status IS 'État.';
COMMENT ON COLUMN member.membership.joined_at IS 'Date d’adhésion.';
COMMENT ON COLUMN member.membership.activated_at IS 'Activation.';

CREATE TABLE member.membership_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    membership_id uuid NOT NULL,
    from_status varchar(30),
    to_status varchar(30) NOT NULL,
    reason text,
    CONSTRAINT pk_member_membership_status_history PRIMARY KEY (id)
);
COMMENT ON TABLE member.membership_status_history IS 'Historique immuable des statuts d’adhésion.';
COMMENT ON COLUMN member.membership_status_history.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.membership_status_history.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN member.membership_status_history.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN member.membership_status_history.membership_id IS 'Adhésion.';
COMMENT ON COLUMN member.membership_status_history.from_status IS 'Ancien statut.';
COMMENT ON COLUMN member.membership_status_history.to_status IS 'Nouveau statut.';
COMMENT ON COLUMN member.membership_status_history.reason IS 'Motif.';

CREATE TABLE member.professional_group (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    code varchar(60) NOT NULL,
    name varchar(255) NOT NULL,
    sector_code varchar(80),
    status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT pk_member_professional_group PRIMARY KEY (id)
);
COMMENT ON TABLE member.professional_group IS 'Groupements professionnels.';
COMMENT ON COLUMN member.professional_group.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.professional_group.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.professional_group.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.professional_group.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.professional_group.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.professional_group.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.professional_group.code IS 'Code.';
COMMENT ON COLUMN member.professional_group.name IS 'Nom.';
COMMENT ON COLUMN member.professional_group.sector_code IS 'Secteur.';
COMMENT ON COLUMN member.professional_group.status IS 'État.';

CREATE TABLE member.group_membership (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    group_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    joined_at date DEFAULT CURRENT_DATE NOT NULL,
    left_at date,
    CONSTRAINT pk_member_group_membership PRIMARY KEY (id)
);
COMMENT ON TABLE member.group_membership IS 'Rattachement entreprise-groupement.';
COMMENT ON COLUMN member.group_membership.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.group_membership.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.group_membership.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.group_membership.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.group_membership.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.group_membership.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.group_membership.organization_id IS 'Entreprise.';
COMMENT ON COLUMN member.group_membership.group_id IS 'Groupement.';
COMMENT ON COLUMN member.group_membership.is_primary IS 'Groupement principal.';
COMMENT ON COLUMN member.group_membership.joined_at IS 'Date.';
COMMENT ON COLUMN member.group_membership.left_at IS 'Fin.';

CREATE TABLE member.communication_preference (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid,
    person_id uuid,
    channel varchar(20) NOT NULL,
    purpose varchar(50) NOT NULL,
    allowed boolean DEFAULT true NOT NULL,
    captured_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT pk_member_communication_preference PRIMARY KEY (id)
);
COMMENT ON TABLE member.communication_preference IS 'Consentements et préférences de communication.';
COMMENT ON COLUMN member.communication_preference.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN member.communication_preference.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN member.communication_preference.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN member.communication_preference.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN member.communication_preference.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN member.communication_preference.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN member.communication_preference.organization_id IS 'Entreprise.';
COMMENT ON COLUMN member.communication_preference.person_id IS 'Personne.';
COMMENT ON COLUMN member.communication_preference.channel IS 'EMAIL, SMS, PUSH.';
COMMENT ON COLUMN member.communication_preference.purpose IS 'Finalité.';
COMMENT ON COLUMN member.communication_preference.allowed IS 'Autorisation.';
COMMENT ON COLUMN member.communication_preference.captured_at IS 'Date de collecte.';

CREATE TABLE enrollment.prospect (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid,
    source_code varchar(60) NOT NULL,
    assigned_group_id uuid,
    status varchar(30) DEFAULT 'NEW' NOT NULL,
    score numeric(5,2),
    CONSTRAINT pk_enrollment_prospect PRIMARY KEY (id)
);
COMMENT ON TABLE enrollment.prospect IS 'Prospects à convertir.';
COMMENT ON COLUMN enrollment.prospect.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN enrollment.prospect.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN enrollment.prospect.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN enrollment.prospect.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN enrollment.prospect.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN enrollment.prospect.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN enrollment.prospect.organization_id IS 'Entreprise créée.';
COMMENT ON COLUMN enrollment.prospect.source_code IS 'Origine.';
COMMENT ON COLUMN enrollment.prospect.assigned_group_id IS 'Groupement relais.';
COMMENT ON COLUMN enrollment.prospect.status IS 'État.';
COMMENT ON COLUMN enrollment.prospect.score IS 'Score de potentiel.';

CREATE TABLE enrollment.enrollment_case (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    case_number varchar(60) NOT NULL,
    channel varchar(30) NOT NULL,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    submitted_at timestamptz,
    assigned_to uuid,
    CONSTRAINT pk_enrollment_enrollment_case PRIMARY KEY (id)
);
COMMENT ON TABLE enrollment.enrollment_case IS 'Dossier d’enrôlement.';
COMMENT ON COLUMN enrollment.enrollment_case.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN enrollment.enrollment_case.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN enrollment.enrollment_case.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN enrollment.enrollment_case.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN enrollment.enrollment_case.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN enrollment.enrollment_case.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN enrollment.enrollment_case.organization_id IS 'Entreprise.';
COMMENT ON COLUMN enrollment.enrollment_case.case_number IS 'Référence.';
COMMENT ON COLUMN enrollment.enrollment_case.channel IS 'WEB, MOBILE, AGENT, GROUPEMENT.';
COMMENT ON COLUMN enrollment.enrollment_case.status IS 'État.';
COMMENT ON COLUMN enrollment.enrollment_case.submitted_at IS 'Soumission.';
COMMENT ON COLUMN enrollment.enrollment_case.assigned_to IS 'Validateur.';

CREATE TABLE enrollment.enrollment_review (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    case_id uuid NOT NULL,
    review_type varchar(40) NOT NULL,
    result varchar(30) NOT NULL,
    comment text,
    CONSTRAINT pk_enrollment_enrollment_review PRIMARY KEY (id)
);
COMMENT ON TABLE enrollment.enrollment_review IS 'Contrôles et demandes de complément.';
COMMENT ON COLUMN enrollment.enrollment_review.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN enrollment.enrollment_review.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN enrollment.enrollment_review.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN enrollment.enrollment_review.case_id IS 'Dossier.';
COMMENT ON COLUMN enrollment.enrollment_review.review_type IS 'Type de contrôle.';
COMMENT ON COLUMN enrollment.enrollment_review.result IS 'Résultat.';
COMMENT ON COLUMN enrollment.enrollment_review.comment IS 'Observation.';

CREATE TABLE enrollment.enrollment_decision (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    case_id uuid NOT NULL,
    decision varchar(30) NOT NULL,
    reason_code varchar(60),
    comment text,
    decided_by uuid NOT NULL,
    CONSTRAINT pk_enrollment_enrollment_decision PRIMARY KEY (id)
);
COMMENT ON TABLE enrollment.enrollment_decision IS 'Décisions d’enrôlement.';
COMMENT ON COLUMN enrollment.enrollment_decision.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN enrollment.enrollment_decision.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN enrollment.enrollment_decision.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN enrollment.enrollment_decision.case_id IS 'Dossier.';
COMMENT ON COLUMN enrollment.enrollment_decision.decision IS 'APPROVED, REJECTED, RETURNED.';
COMMENT ON COLUMN enrollment.enrollment_decision.reason_code IS 'Motif.';
COMMENT ON COLUMN enrollment.enrollment_decision.comment IS 'Commentaire.';
COMMENT ON COLUMN enrollment.enrollment_decision.decided_by IS 'Décideur.';

CREATE TABLE contribution.fiscal_year (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    year integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status varchar(30) DEFAULT 'OPEN' NOT NULL,
    CONSTRAINT pk_contribution_fiscal_year PRIMARY KEY (id)
);
COMMENT ON TABLE contribution.fiscal_year IS 'Exercices de cotisation.';
COMMENT ON COLUMN contribution.fiscal_year.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN contribution.fiscal_year.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN contribution.fiscal_year.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN contribution.fiscal_year.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN contribution.fiscal_year.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN contribution.fiscal_year.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN contribution.fiscal_year.year IS 'Année.';
COMMENT ON COLUMN contribution.fiscal_year.start_date IS 'Début.';
COMMENT ON COLUMN contribution.fiscal_year.end_date IS 'Fin.';
COMMENT ON COLUMN contribution.fiscal_year.status IS 'État.';

CREATE TABLE contribution.rate_rule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    rule_code varchar(60) NOT NULL,
    category_code varchar(50) NOT NULL,
    calculation_method varchar(40) NOT NULL,
    parameters jsonb DEFAULT '{}'::jsonb NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    approved_by uuid,
    CONSTRAINT pk_contribution_rate_rule PRIMARY KEY (id)
);
COMMENT ON TABLE contribution.rate_rule IS 'Barèmes versionnés.';
COMMENT ON COLUMN contribution.rate_rule.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN contribution.rate_rule.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN contribution.rate_rule.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN contribution.rate_rule.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN contribution.rate_rule.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN contribution.rate_rule.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN contribution.rate_rule.rule_code IS 'Code.';
COMMENT ON COLUMN contribution.rate_rule.category_code IS 'Catégorie.';
COMMENT ON COLUMN contribution.rate_rule.calculation_method IS 'FIXED, PERCENT, TIERED.';
COMMENT ON COLUMN contribution.rate_rule.parameters IS 'Paramètres non relationnels contrôlés.';
COMMENT ON COLUMN contribution.rate_rule.valid_from IS 'Début.';
COMMENT ON COLUMN contribution.rate_rule.valid_to IS 'Fin.';
COMMENT ON COLUMN contribution.rate_rule.status IS 'État.';
COMMENT ON COLUMN contribution.rate_rule.approved_by IS 'Second valideur.';

CREATE TABLE contribution.contribution_call (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    membership_id uuid NOT NULL,
    fiscal_year_id uuid NOT NULL,
    call_number varchar(60) NOT NULL,
    amount_due numeric(19,2) NOT NULL,
    currency char(3) DEFAULT 'XOF' NOT NULL,
    due_date date NOT NULL,
    status varchar(30) DEFAULT 'ISSUED' NOT NULL,
    balance_amount numeric(19,2) NOT NULL,
    CONSTRAINT pk_contribution_contribution_call PRIMARY KEY (id)
);
COMMENT ON TABLE contribution.contribution_call IS 'Appels de cotisation.';
COMMENT ON COLUMN contribution.contribution_call.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN contribution.contribution_call.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN contribution.contribution_call.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN contribution.contribution_call.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN contribution.contribution_call.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN contribution.contribution_call.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN contribution.contribution_call.membership_id IS 'Adhésion.';
COMMENT ON COLUMN contribution.contribution_call.fiscal_year_id IS 'Exercice.';
COMMENT ON COLUMN contribution.contribution_call.call_number IS 'Référence.';
COMMENT ON COLUMN contribution.contribution_call.amount_due IS 'Montant dû.';
COMMENT ON COLUMN contribution.contribution_call.currency IS 'Devise.';
COMMENT ON COLUMN contribution.contribution_call.due_date IS 'Échéance.';
COMMENT ON COLUMN contribution.contribution_call.status IS 'État.';
COMMENT ON COLUMN contribution.contribution_call.balance_amount IS 'Solde.';

CREATE TABLE contribution.installment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    contribution_call_id uuid NOT NULL,
    installment_no integer NOT NULL,
    due_date date NOT NULL,
    amount_due numeric(19,2) NOT NULL,
    amount_paid numeric(19,2) DEFAULT 0 NOT NULL,
    status varchar(30) DEFAULT 'PENDING' NOT NULL,
    CONSTRAINT pk_contribution_installment PRIMARY KEY (id)
);
COMMENT ON TABLE contribution.installment IS 'Échéances d’un appel.';
COMMENT ON COLUMN contribution.installment.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN contribution.installment.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN contribution.installment.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN contribution.installment.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN contribution.installment.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN contribution.installment.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN contribution.installment.contribution_call_id IS 'Appel.';
COMMENT ON COLUMN contribution.installment.installment_no IS 'Numéro.';
COMMENT ON COLUMN contribution.installment.due_date IS 'Échéance.';
COMMENT ON COLUMN contribution.installment.amount_due IS 'Montant.';
COMMENT ON COLUMN contribution.installment.amount_paid IS 'Payé.';
COMMENT ON COLUMN contribution.installment.status IS 'État.';

CREATE TABLE contribution.adjustment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    contribution_call_id uuid NOT NULL,
    adjustment_number varchar(60) NOT NULL,
    adjustment_type varchar(30) NOT NULL,
    amount numeric(19,2) NOT NULL,
    reason_code varchar(60) NOT NULL,
    approved_by uuid,
    CONSTRAINT pk_contribution_adjustment PRIMARY KEY (id)
);
COMMENT ON TABLE contribution.adjustment IS 'Ajustements financiers compensatoires.';
COMMENT ON COLUMN contribution.adjustment.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN contribution.adjustment.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN contribution.adjustment.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN contribution.adjustment.contribution_call_id IS 'Appel.';
COMMENT ON COLUMN contribution.adjustment.adjustment_number IS 'Référence.';
COMMENT ON COLUMN contribution.adjustment.adjustment_type IS 'CREDIT ou DEBIT.';
COMMENT ON COLUMN contribution.adjustment.amount IS 'Montant.';
COMMENT ON COLUMN contribution.adjustment.reason_code IS 'Motif.';
COMMENT ON COLUMN contribution.adjustment.approved_by IS 'Valideur.';

CREATE TABLE payment.payment_reference (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    membership_id uuid NOT NULL,
    reference_value varchar(100) NOT NULL,
    channel varchar(30) NOT NULL,
    status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
    expires_at timestamptz,
    approved_by uuid,
    CONSTRAINT pk_payment_payment_reference PRIMARY KEY (id)
);
COMMENT ON TABLE payment.payment_reference IS 'Références uniques de paiement validées par le CNPM.';
COMMENT ON COLUMN payment.payment_reference.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.payment_reference.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN payment.payment_reference.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN payment.payment_reference.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN payment.payment_reference.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN payment.payment_reference.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN payment.payment_reference.membership_id IS 'Adhésion.';
COMMENT ON COLUMN payment.payment_reference.reference_value IS 'Référence.';
COMMENT ON COLUMN payment.payment_reference.channel IS 'Canal.';
COMMENT ON COLUMN payment.payment_reference.status IS 'État.';
COMMENT ON COLUMN payment.payment_reference.expires_at IS 'Expiration.';
COMMENT ON COLUMN payment.payment_reference.approved_by IS 'Validation CNPM.';

CREATE TABLE payment.payment_transaction (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    payment_reference_id uuid,
    transaction_number varchar(80) NOT NULL,
    provider_transaction_id varchar(160),
    channel varchar(30) NOT NULL,
    amount numeric(19,2) NOT NULL,
    currency char(3) DEFAULT 'XOF' NOT NULL,
    paid_at timestamptz NOT NULL,
    status varchar(30) DEFAULT 'RECEIVED' NOT NULL,
    idempotency_key varchar(160) NOT NULL,
    raw_payload_hash char(64),
    CONSTRAINT pk_payment_payment_transaction PRIMARY KEY (id)
);
COMMENT ON TABLE payment.payment_transaction IS 'Transactions financières append-only.';
COMMENT ON COLUMN payment.payment_transaction.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.payment_transaction.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN payment.payment_transaction.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN payment.payment_transaction.payment_reference_id IS 'Référence.';
COMMENT ON COLUMN payment.payment_transaction.transaction_number IS 'Référence CNPM.';
COMMENT ON COLUMN payment.payment_transaction.provider_transaction_id IS 'Référence externe.';
COMMENT ON COLUMN payment.payment_transaction.channel IS 'MOBILE_MONEY, BANK, CASH.';
COMMENT ON COLUMN payment.payment_transaction.amount IS 'Montant.';
COMMENT ON COLUMN payment.payment_transaction.currency IS 'Devise.';
COMMENT ON COLUMN payment.payment_transaction.paid_at IS 'Date de paiement.';
COMMENT ON COLUMN payment.payment_transaction.status IS 'État.';
COMMENT ON COLUMN payment.payment_transaction.idempotency_key IS 'Clé anti-doublon.';
COMMENT ON COLUMN payment.payment_transaction.raw_payload_hash IS 'Empreinte de la preuve.';

CREATE TABLE payment.payment_allocation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    payment_transaction_id uuid NOT NULL,
    installment_id uuid NOT NULL,
    allocated_amount numeric(19,2) NOT NULL,
    allocation_type varchar(30) DEFAULT 'AUTOMATIC' NOT NULL,
    CONSTRAINT pk_payment_payment_allocation PRIMARY KEY (id)
);
COMMENT ON TABLE payment.payment_allocation IS 'Affectations paiement-échéance.';
COMMENT ON COLUMN payment.payment_allocation.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.payment_allocation.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN payment.payment_allocation.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN payment.payment_allocation.payment_transaction_id IS 'Paiement.';
COMMENT ON COLUMN payment.payment_allocation.installment_id IS 'Échéance.';
COMMENT ON COLUMN payment.payment_allocation.allocated_amount IS 'Montant affecté.';
COMMENT ON COLUMN payment.payment_allocation.allocation_type IS 'Mode.';

CREATE TABLE payment.provider_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    partner_code varchar(60) NOT NULL,
    external_event_id varchar(160) NOT NULL,
    event_type varchar(80) NOT NULL,
    received_at timestamptz DEFAULT now() NOT NULL,
    signature_valid boolean DEFAULT false NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    processing_status varchar(30) DEFAULT 'PENDING' NOT NULL,
    CONSTRAINT pk_payment_provider_event PRIMARY KEY (id)
);
COMMENT ON TABLE payment.provider_event IS 'Événements entrants des prestataires de paiement.';
COMMENT ON COLUMN payment.provider_event.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.provider_event.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN payment.provider_event.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN payment.provider_event.partner_code IS 'Partenaire.';
COMMENT ON COLUMN payment.provider_event.external_event_id IS 'Identifiant externe.';
COMMENT ON COLUMN payment.provider_event.event_type IS 'Type.';
COMMENT ON COLUMN payment.provider_event.received_at IS 'Réception.';
COMMENT ON COLUMN payment.provider_event.signature_valid IS 'Signature vérifiée.';
COMMENT ON COLUMN payment.provider_event.payload IS 'Message reçu.';
COMMENT ON COLUMN payment.provider_event.processing_status IS 'État.';

CREATE TABLE payment.bank_statement (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    bank_code varchar(60) NOT NULL,
    account_ref_masked varchar(80) NOT NULL,
    statement_ref varchar(120) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status varchar(30) DEFAULT 'IMPORTED' NOT NULL,
    CONSTRAINT pk_payment_bank_statement PRIMARY KEY (id)
);
COMMENT ON TABLE payment.bank_statement IS 'Relevés bancaires importés.';
COMMENT ON COLUMN payment.bank_statement.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.bank_statement.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN payment.bank_statement.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN payment.bank_statement.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN payment.bank_statement.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN payment.bank_statement.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN payment.bank_statement.bank_code IS 'Banque.';
COMMENT ON COLUMN payment.bank_statement.account_ref_masked IS 'Compte masqué.';
COMMENT ON COLUMN payment.bank_statement.statement_ref IS 'Référence.';
COMMENT ON COLUMN payment.bank_statement.period_start IS 'Début.';
COMMENT ON COLUMN payment.bank_statement.period_end IS 'Fin.';
COMMENT ON COLUMN payment.bank_statement.status IS 'État.';

CREATE TABLE payment.bank_statement_line (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    statement_id uuid NOT NULL,
    line_number integer NOT NULL,
    booking_date date NOT NULL,
    value_date date,
    amount numeric(19,2) NOT NULL,
    reference_text text,
    fingerprint char(64) NOT NULL,
    CONSTRAINT pk_payment_bank_statement_line PRIMARY KEY (id)
);
COMMENT ON TABLE payment.bank_statement_line IS 'Lignes de relevé bancaire.';
COMMENT ON COLUMN payment.bank_statement_line.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.bank_statement_line.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN payment.bank_statement_line.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN payment.bank_statement_line.statement_id IS 'Relevé.';
COMMENT ON COLUMN payment.bank_statement_line.line_number IS 'Ligne.';
COMMENT ON COLUMN payment.bank_statement_line.booking_date IS 'Date.';
COMMENT ON COLUMN payment.bank_statement_line.value_date IS 'Valeur.';
COMMENT ON COLUMN payment.bank_statement_line.amount IS 'Montant.';
COMMENT ON COLUMN payment.bank_statement_line.reference_text IS 'Libellé.';
COMMENT ON COLUMN payment.bank_statement_line.fingerprint IS 'Empreinte anti-doublon.';

CREATE TABLE payment.reconciliation_case (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    payment_transaction_id uuid,
    statement_line_id uuid,
    match_score numeric(5,2),
    status varchar(30) DEFAULT 'PROPOSED' NOT NULL,
    override_reason text,
    proposed_by uuid,
    approved_by uuid,
    CONSTRAINT pk_payment_reconciliation_case PRIMARY KEY (id)
);
COMMENT ON TABLE payment.reconciliation_case IS 'Cas de rapprochement automatique ou manuel.';
COMMENT ON COLUMN payment.reconciliation_case.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN payment.reconciliation_case.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN payment.reconciliation_case.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN payment.reconciliation_case.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN payment.reconciliation_case.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN payment.reconciliation_case.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN payment.reconciliation_case.payment_transaction_id IS 'Paiement.';
COMMENT ON COLUMN payment.reconciliation_case.statement_line_id IS 'Ligne bancaire.';
COMMENT ON COLUMN payment.reconciliation_case.match_score IS 'Score.';
COMMENT ON COLUMN payment.reconciliation_case.status IS 'État.';
COMMENT ON COLUMN payment.reconciliation_case.override_reason IS 'Motif de dérogation.';
COMMENT ON COLUMN payment.reconciliation_case.proposed_by IS 'Proposant.';
COMMENT ON COLUMN payment.reconciliation_case.approved_by IS 'Valideur.';

CREATE TABLE receipt.receipt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    payment_transaction_id uuid NOT NULL,
    receipt_number varchar(80) NOT NULL,
    issued_at timestamptz NOT NULL,
    status varchar(30) DEFAULT 'ISSUED' NOT NULL,
    document_id uuid NOT NULL,
    verification_token_hash char(64) NOT NULL,
    supersedes_receipt_id uuid,
    issued_by uuid NOT NULL,
    CONSTRAINT pk_receipt_receipt PRIMARY KEY (id)
);
COMMENT ON TABLE receipt.receipt IS 'Reçus officiels et versions de correction.';
COMMENT ON COLUMN receipt.receipt.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN receipt.receipt.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN receipt.receipt.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN receipt.receipt.payment_transaction_id IS 'Paiement.';
COMMENT ON COLUMN receipt.receipt.receipt_number IS 'Numéro officiel.';
COMMENT ON COLUMN receipt.receipt.issued_at IS 'Émission.';
COMMENT ON COLUMN receipt.receipt.status IS 'État.';
COMMENT ON COLUMN receipt.receipt.document_id IS 'PDF archivé.';
COMMENT ON COLUMN receipt.receipt.verification_token_hash IS 'Empreinte du jeton QR.';
COMMENT ON COLUMN receipt.receipt.supersedes_receipt_id IS 'Reçu remplacé.';
COMMENT ON COLUMN receipt.receipt.issued_by IS 'Émetteur CNPM.';

CREATE TABLE recovery.campaign (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    campaign_code varchar(60) NOT NULL,
    name varchar(255) NOT NULL,
    target_segment jsonb DEFAULT '{}'::jsonb NOT NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    CONSTRAINT pk_recovery_campaign PRIMARY KEY (id)
);
COMMENT ON TABLE recovery.campaign IS 'Campagnes de recouvrement.';
COMMENT ON COLUMN recovery.campaign.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN recovery.campaign.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN recovery.campaign.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN recovery.campaign.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN recovery.campaign.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN recovery.campaign.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN recovery.campaign.campaign_code IS 'Code.';
COMMENT ON COLUMN recovery.campaign.name IS 'Nom.';
COMMENT ON COLUMN recovery.campaign.target_segment IS 'Segment figé.';
COMMENT ON COLUMN recovery.campaign.start_at IS 'Début.';
COMMENT ON COLUMN recovery.campaign.end_at IS 'Fin.';
COMMENT ON COLUMN recovery.campaign.status IS 'État.';

CREATE TABLE recovery.sequence_template (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    code varchar(60) NOT NULL,
    name varchar(255) NOT NULL,
    category_code varchar(50),
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT pk_recovery_sequence_template PRIMARY KEY (id)
);
COMMENT ON TABLE recovery.sequence_template IS 'Scénarios de relance.';
COMMENT ON COLUMN recovery.sequence_template.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN recovery.sequence_template.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN recovery.sequence_template.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN recovery.sequence_template.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN recovery.sequence_template.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN recovery.sequence_template.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN recovery.sequence_template.code IS 'Code.';
COMMENT ON COLUMN recovery.sequence_template.name IS 'Nom.';
COMMENT ON COLUMN recovery.sequence_template.category_code IS 'Catégorie.';
COMMENT ON COLUMN recovery.sequence_template.active IS 'Actif.';

CREATE TABLE recovery.sequence_step (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    template_id uuid NOT NULL,
    step_no integer NOT NULL,
    delay_days integer NOT NULL,
    channel varchar(20) NOT NULL,
    template_code varchar(80) NOT NULL,
    CONSTRAINT pk_recovery_sequence_step PRIMARY KEY (id)
);
COMMENT ON TABLE recovery.sequence_step IS 'Étapes d’un scénario.';
COMMENT ON COLUMN recovery.sequence_step.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN recovery.sequence_step.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN recovery.sequence_step.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN recovery.sequence_step.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN recovery.sequence_step.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN recovery.sequence_step.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN recovery.sequence_step.template_id IS 'Scénario.';
COMMENT ON COLUMN recovery.sequence_step.step_no IS 'Ordre.';
COMMENT ON COLUMN recovery.sequence_step.delay_days IS 'Délai.';
COMMENT ON COLUMN recovery.sequence_step.channel IS 'Canal.';
COMMENT ON COLUMN recovery.sequence_step.template_code IS 'Modèle.';

CREATE TABLE recovery.recovery_case (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    membership_id uuid NOT NULL,
    fiscal_year_id uuid NOT NULL,
    outstanding_amount numeric(19,2) NOT NULL,
    risk_score numeric(5,2),
    assigned_to uuid,
    status varchar(30) DEFAULT 'OPEN' NOT NULL,
    CONSTRAINT pk_recovery_recovery_case PRIMARY KEY (id)
);
COMMENT ON TABLE recovery.recovery_case IS 'Dossier de recouvrement par adhésion/exercice.';
COMMENT ON COLUMN recovery.recovery_case.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN recovery.recovery_case.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN recovery.recovery_case.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN recovery.recovery_case.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN recovery.recovery_case.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN recovery.recovery_case.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN recovery.recovery_case.membership_id IS 'Adhésion.';
COMMENT ON COLUMN recovery.recovery_case.fiscal_year_id IS 'Exercice.';
COMMENT ON COLUMN recovery.recovery_case.outstanding_amount IS 'Impayé.';
COMMENT ON COLUMN recovery.recovery_case.risk_score IS 'Score.';
COMMENT ON COLUMN recovery.recovery_case.assigned_to IS 'Agent.';
COMMENT ON COLUMN recovery.recovery_case.status IS 'État.';

CREATE TABLE recovery.recovery_action (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    recovery_case_id uuid NOT NULL,
    action_type varchar(40) NOT NULL,
    channel varchar(20),
    outcome_code varchar(60),
    notes text,
    action_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT pk_recovery_recovery_action PRIMARY KEY (id)
);
COMMENT ON TABLE recovery.recovery_action IS 'Journal des actions de recouvrement.';
COMMENT ON COLUMN recovery.recovery_action.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN recovery.recovery_action.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN recovery.recovery_action.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN recovery.recovery_action.recovery_case_id IS 'Dossier.';
COMMENT ON COLUMN recovery.recovery_action.action_type IS 'CALL, SMS, EMAIL, VISIT.';
COMMENT ON COLUMN recovery.recovery_action.channel IS 'Canal.';
COMMENT ON COLUMN recovery.recovery_action.outcome_code IS 'Résultat.';
COMMENT ON COLUMN recovery.recovery_action.notes IS 'Notes.';
COMMENT ON COLUMN recovery.recovery_action.action_at IS 'Date.';

CREATE TABLE recovery.promise_to_pay (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    recovery_case_id uuid NOT NULL,
    promised_amount numeric(19,2) NOT NULL,
    promised_date date NOT NULL,
    status varchar(30) DEFAULT 'OPEN' NOT NULL,
    fulfilled_payment_id uuid,
    CONSTRAINT pk_recovery_promise_to_pay PRIMARY KEY (id)
);
COMMENT ON TABLE recovery.promise_to_pay IS 'Promesses de paiement.';
COMMENT ON COLUMN recovery.promise_to_pay.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN recovery.promise_to_pay.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN recovery.promise_to_pay.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN recovery.promise_to_pay.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN recovery.promise_to_pay.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN recovery.promise_to_pay.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN recovery.promise_to_pay.recovery_case_id IS 'Dossier.';
COMMENT ON COLUMN recovery.promise_to_pay.promised_amount IS 'Montant.';
COMMENT ON COLUMN recovery.promise_to_pay.promised_date IS 'Date.';
COMMENT ON COLUMN recovery.promise_to_pay.status IS 'État.';
COMMENT ON COLUMN recovery.promise_to_pay.fulfilled_payment_id IS 'Paiement associé.';

CREATE TABLE incentive.bonus_rule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    rule_code varchar(60) NOT NULL,
    member_category varchar(50) NOT NULL,
    calculation_method varchar(30) NOT NULL,
    rate numeric(9,6) NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    approved_by uuid,
    CONSTRAINT pk_incentive_bonus_rule PRIMARY KEY (id)
);
COMMENT ON TABLE incentive.bonus_rule IS 'Règles de prime de mobilisation.';
COMMENT ON COLUMN incentive.bonus_rule.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN incentive.bonus_rule.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN incentive.bonus_rule.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN incentive.bonus_rule.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN incentive.bonus_rule.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN incentive.bonus_rule.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN incentive.bonus_rule.rule_code IS 'Code.';
COMMENT ON COLUMN incentive.bonus_rule.member_category IS 'Catégorie.';
COMMENT ON COLUMN incentive.bonus_rule.calculation_method IS 'PERCENT ou FIXED.';
COMMENT ON COLUMN incentive.bonus_rule.rate IS 'Taux.';
COMMENT ON COLUMN incentive.bonus_rule.valid_from IS 'Début.';
COMMENT ON COLUMN incentive.bonus_rule.valid_to IS 'Fin.';
COMMENT ON COLUMN incentive.bonus_rule.status IS 'État.';
COMMENT ON COLUMN incentive.bonus_rule.approved_by IS 'Valideur.';

CREATE TABLE incentive.bonus_calculation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    total_amount numeric(19,2) DEFAULT 0 NOT NULL,
    calculated_by uuid NOT NULL,
    approved_by uuid,
    CONSTRAINT pk_incentive_bonus_calculation PRIMARY KEY (id)
);
COMMENT ON TABLE incentive.bonus_calculation IS 'État mensuel de primes.';
COMMENT ON COLUMN incentive.bonus_calculation.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN incentive.bonus_calculation.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN incentive.bonus_calculation.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN incentive.bonus_calculation.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN incentive.bonus_calculation.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN incentive.bonus_calculation.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN incentive.bonus_calculation.period_start IS 'Début.';
COMMENT ON COLUMN incentive.bonus_calculation.period_end IS 'Fin.';
COMMENT ON COLUMN incentive.bonus_calculation.status IS 'État.';
COMMENT ON COLUMN incentive.bonus_calculation.total_amount IS 'Total.';
COMMENT ON COLUMN incentive.bonus_calculation.calculated_by IS 'Calculateur.';
COMMENT ON COLUMN incentive.bonus_calculation.approved_by IS 'Valideur.';

CREATE TABLE incentive.bonus_line (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    calculation_id uuid NOT NULL,
    payment_transaction_id uuid NOT NULL,
    beneficiary_user_id uuid NOT NULL,
    member_category varchar(50) NOT NULL,
    base_amount numeric(19,2) NOT NULL,
    rate numeric(9,6) NOT NULL,
    bonus_amount numeric(19,2) NOT NULL,
    CONSTRAINT pk_incentive_bonus_line PRIMARY KEY (id)
);
COMMENT ON TABLE incentive.bonus_line IS 'Détail de prime par encaissement.';
COMMENT ON COLUMN incentive.bonus_line.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN incentive.bonus_line.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN incentive.bonus_line.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN incentive.bonus_line.calculation_id IS 'État.';
COMMENT ON COLUMN incentive.bonus_line.payment_transaction_id IS 'Paiement.';
COMMENT ON COLUMN incentive.bonus_line.beneficiary_user_id IS 'Bénéficiaire.';
COMMENT ON COLUMN incentive.bonus_line.member_category IS 'Catégorie.';
COMMENT ON COLUMN incentive.bonus_line.base_amount IS 'Assiette.';
COMMENT ON COLUMN incentive.bonus_line.rate IS 'Taux.';
COMMENT ON COLUMN incentive.bonus_line.bonus_amount IS 'Prime.';

CREATE TABLE incentive.revenue_share_statement (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    provider_code varchar(60) NOT NULL,
    gross_collected numeric(19,2) NOT NULL,
    share_amount numeric(19,2) NOT NULL,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    approved_by uuid,
    CONSTRAINT pk_incentive_revenue_share_statement PRIMARY KEY (id)
);
COMMENT ON TABLE incentive.revenue_share_statement IS 'État de rémunération du prestataire.';
COMMENT ON COLUMN incentive.revenue_share_statement.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN incentive.revenue_share_statement.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN incentive.revenue_share_statement.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN incentive.revenue_share_statement.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN incentive.revenue_share_statement.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN incentive.revenue_share_statement.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN incentive.revenue_share_statement.period_start IS 'Début.';
COMMENT ON COLUMN incentive.revenue_share_statement.period_end IS 'Fin.';
COMMENT ON COLUMN incentive.revenue_share_statement.provider_code IS 'Prestataire.';
COMMENT ON COLUMN incentive.revenue_share_statement.gross_collected IS 'Encaissements éligibles.';
COMMENT ON COLUMN incentive.revenue_share_statement.share_amount IS 'Part.';
COMMENT ON COLUMN incentive.revenue_share_statement.status IS 'État.';
COMMENT ON COLUMN incentive.revenue_share_statement.approved_by IS 'Validation CNPM.';

CREATE TABLE incentive.financial_dispute (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    object_type varchar(40) NOT NULL,
    object_id uuid NOT NULL,
    reason text NOT NULL,
    status varchar(30) DEFAULT 'OPEN' NOT NULL,
    resolution text,
    CONSTRAINT pk_incentive_financial_dispute PRIMARY KEY (id)
);
COMMENT ON TABLE incentive.financial_dispute IS 'Litiges de calcul.';
COMMENT ON COLUMN incentive.financial_dispute.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN incentive.financial_dispute.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN incentive.financial_dispute.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN incentive.financial_dispute.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN incentive.financial_dispute.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN incentive.financial_dispute.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN incentive.financial_dispute.object_type IS 'BONUS ou REVENUE_SHARE.';
COMMENT ON COLUMN incentive.financial_dispute.object_id IS 'Objet.';
COMMENT ON COLUMN incentive.financial_dispute.reason IS 'Motif.';
COMMENT ON COLUMN incentive.financial_dispute.status IS 'État.';
COMMENT ON COLUMN incentive.financial_dispute.resolution IS 'Résolution.';

CREATE TABLE service.sla_policy (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    request_type varchar(60) NOT NULL,
    first_response_hours integer NOT NULL,
    resolution_hours integer NOT NULL,
    calendar_code varchar(60) NOT NULL,
    CONSTRAINT pk_service_sla_policy PRIMARY KEY (id)
);
COMMENT ON TABLE service.sla_policy IS 'Politiques de délai.';
COMMENT ON COLUMN service.sla_policy.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN service.sla_policy.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN service.sla_policy.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN service.sla_policy.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN service.sla_policy.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN service.sla_policy.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN service.sla_policy.request_type IS 'Type.';
COMMENT ON COLUMN service.sla_policy.first_response_hours IS 'Délai de réponse.';
COMMENT ON COLUMN service.sla_policy.resolution_hours IS 'Délai de résolution.';
COMMENT ON COLUMN service.sla_policy.calendar_code IS 'Calendrier.';

CREATE TABLE service.request (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    request_number varchar(60) NOT NULL,
    request_type varchar(60) NOT NULL,
    subject varchar(255) NOT NULL,
    description text NOT NULL,
    status varchar(30) DEFAULT 'SUBMITTED' NOT NULL,
    priority varchar(20) DEFAULT 'NORMAL' NOT NULL,
    assigned_to uuid,
    due_at timestamptz,
    closed_at timestamptz,
    CONSTRAINT pk_service_request PRIMARY KEY (id)
);
COMMENT ON TABLE service.request IS 'Requêtes et réclamations des membres.';
COMMENT ON COLUMN service.request.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN service.request.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN service.request.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN service.request.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN service.request.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN service.request.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN service.request.organization_id IS 'Entreprise.';
COMMENT ON COLUMN service.request.request_number IS 'Référence.';
COMMENT ON COLUMN service.request.request_type IS 'Type.';
COMMENT ON COLUMN service.request.subject IS 'Objet.';
COMMENT ON COLUMN service.request.description IS 'Description.';
COMMENT ON COLUMN service.request.status IS 'État.';
COMMENT ON COLUMN service.request.priority IS 'Priorité.';
COMMENT ON COLUMN service.request.assigned_to IS 'Responsable.';
COMMENT ON COLUMN service.request.due_at IS 'Échéance SLA.';
COMMENT ON COLUMN service.request.closed_at IS 'Clôture.';

CREATE TABLE service.request_message (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    request_id uuid NOT NULL,
    sender_type varchar(30) NOT NULL,
    body text NOT NULL,
    visibility varchar(20) DEFAULT 'SHARED' NOT NULL,
    CONSTRAINT pk_service_request_message PRIMARY KEY (id)
);
COMMENT ON TABLE service.request_message IS 'Échanges liés à une requête.';
COMMENT ON COLUMN service.request_message.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN service.request_message.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN service.request_message.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN service.request_message.request_id IS 'Requête.';
COMMENT ON COLUMN service.request_message.sender_type IS 'MEMBER ou CNPM.';
COMMENT ON COLUMN service.request_message.body IS 'Message.';
COMMENT ON COLUMN service.request_message.visibility IS 'Visibilité.';

CREATE TABLE document.document (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    document_code varchar(80) NOT NULL,
    category_code varchar(60) NOT NULL,
    title varchar(255) NOT NULL,
    classification varchar(30) DEFAULT 'CONFIDENTIAL' NOT NULL,
    retention_until date,
    status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
    current_version_id uuid,
    CONSTRAINT pk_document_document PRIMARY KEY (id)
);
COMMENT ON TABLE document.document IS 'Métadonnées documentaires.';
COMMENT ON COLUMN document.document.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN document.document.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN document.document.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN document.document.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN document.document.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN document.document.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN document.document.document_code IS 'Référence.';
COMMENT ON COLUMN document.document.category_code IS 'Catégorie.';
COMMENT ON COLUMN document.document.title IS 'Titre.';
COMMENT ON COLUMN document.document.classification IS 'Classification.';
COMMENT ON COLUMN document.document.retention_until IS 'Fin de conservation.';
COMMENT ON COLUMN document.document.status IS 'État.';
COMMENT ON COLUMN document.document.current_version_id IS 'Version courante.';

CREATE TABLE document.document_version (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    document_id uuid NOT NULL,
    version_number integer NOT NULL,
    object_key varchar(500) NOT NULL,
    file_name varchar(255) NOT NULL,
    media_type varchar(120) NOT NULL,
    size_bytes bigint NOT NULL,
    sha256 char(64) NOT NULL,
    malware_scan_status varchar(30) DEFAULT 'PENDING' NOT NULL,
    CONSTRAINT pk_document_document_version PRIMARY KEY (id)
);
COMMENT ON TABLE document.document_version IS 'Versions physiques stockées en objet S3.';
COMMENT ON COLUMN document.document_version.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN document.document_version.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN document.document_version.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN document.document_version.document_id IS 'Document.';
COMMENT ON COLUMN document.document_version.version_number IS 'Version.';
COMMENT ON COLUMN document.document_version.object_key IS 'Clé de stockage.';
COMMENT ON COLUMN document.document_version.file_name IS 'Nom.';
COMMENT ON COLUMN document.document_version.media_type IS 'MIME.';
COMMENT ON COLUMN document.document_version.size_bytes IS 'Taille.';
COMMENT ON COLUMN document.document_version.sha256 IS 'Empreinte.';
COMMENT ON COLUMN document.document_version.malware_scan_status IS 'Résultat antivirus.';

CREATE TABLE document.document_link (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    document_id uuid NOT NULL,
    entity_type varchar(80) NOT NULL,
    entity_id uuid NOT NULL,
    link_type varchar(40) NOT NULL,
    CONSTRAINT pk_document_document_link PRIMARY KEY (id)
);
COMMENT ON TABLE document.document_link IS 'Liens document-objet métier.';
COMMENT ON COLUMN document.document_link.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN document.document_link.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN document.document_link.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN document.document_link.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN document.document_link.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN document.document_link.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN document.document_link.document_id IS 'Document.';
COMMENT ON COLUMN document.document_link.entity_type IS 'Type d’objet.';
COMMENT ON COLUMN document.document_link.entity_id IS 'Objet.';
COMMENT ON COLUMN document.document_link.link_type IS 'Nature du lien.';

CREATE TABLE governance.commission (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    code varchar(60) NOT NULL,
    name varchar(255) NOT NULL,
    status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT pk_governance_commission PRIMARY KEY (id)
);
COMMENT ON TABLE governance.commission IS 'Commissions et organes.';
COMMENT ON COLUMN governance.commission.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN governance.commission.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN governance.commission.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN governance.commission.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN governance.commission.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN governance.commission.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN governance.commission.code IS 'Code.';
COMMENT ON COLUMN governance.commission.name IS 'Nom.';
COMMENT ON COLUMN governance.commission.status IS 'État.';

CREATE TABLE governance.meeting (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    commission_id uuid,
    meeting_number varchar(60) NOT NULL,
    title varchar(255) NOT NULL,
    scheduled_at timestamptz NOT NULL,
    status varchar(30) DEFAULT 'PLANNED' NOT NULL,
    minutes_document_id uuid,
    CONSTRAINT pk_governance_meeting PRIMARY KEY (id)
);
COMMENT ON TABLE governance.meeting IS 'Réunions institutionnelles.';
COMMENT ON COLUMN governance.meeting.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN governance.meeting.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN governance.meeting.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN governance.meeting.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN governance.meeting.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN governance.meeting.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN governance.meeting.commission_id IS 'Commission.';
COMMENT ON COLUMN governance.meeting.meeting_number IS 'Référence.';
COMMENT ON COLUMN governance.meeting.title IS 'Titre.';
COMMENT ON COLUMN governance.meeting.scheduled_at IS 'Date.';
COMMENT ON COLUMN governance.meeting.status IS 'État.';
COMMENT ON COLUMN governance.meeting.minutes_document_id IS 'Procès-verbal.';

CREATE TABLE governance.meeting_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    meeting_id uuid NOT NULL,
    person_id uuid NOT NULL,
    attendance_status varchar(30) NOT NULL,
    proxy_person_id uuid,
    CONSTRAINT pk_governance_meeting_attendance PRIMARY KEY (id)
);
COMMENT ON TABLE governance.meeting_attendance IS 'Présences et procurations.';
COMMENT ON COLUMN governance.meeting_attendance.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN governance.meeting_attendance.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN governance.meeting_attendance.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN governance.meeting_attendance.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN governance.meeting_attendance.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN governance.meeting_attendance.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN governance.meeting_attendance.meeting_id IS 'Réunion.';
COMMENT ON COLUMN governance.meeting_attendance.person_id IS 'Participant.';
COMMENT ON COLUMN governance.meeting_attendance.attendance_status IS 'Statut.';
COMMENT ON COLUMN governance.meeting_attendance.proxy_person_id IS 'Mandataire.';

CREATE TABLE governance.decision (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    meeting_id uuid,
    decision_number varchar(60) NOT NULL,
    title varchar(255) NOT NULL,
    decision_text text NOT NULL,
    status varchar(30) DEFAULT 'ADOPTED' NOT NULL,
    effective_date date,
    CONSTRAINT pk_governance_decision PRIMARY KEY (id)
);
COMMENT ON TABLE governance.decision IS 'Décisions et résolutions.';
COMMENT ON COLUMN governance.decision.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN governance.decision.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN governance.decision.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN governance.decision.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN governance.decision.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN governance.decision.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN governance.decision.meeting_id IS 'Réunion.';
COMMENT ON COLUMN governance.decision.decision_number IS 'Référence.';
COMMENT ON COLUMN governance.decision.title IS 'Titre.';
COMMENT ON COLUMN governance.decision.decision_text IS 'Contenu.';
COMMENT ON COLUMN governance.decision.status IS 'État.';
COMMENT ON COLUMN governance.decision.effective_date IS 'Effet.';

CREATE TABLE governance.decision_action (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    decision_id uuid NOT NULL,
    action_text text NOT NULL,
    owner_user_id uuid,
    due_date date,
    status varchar(30) DEFAULT 'OPEN' NOT NULL,
    CONSTRAINT pk_governance_decision_action PRIMARY KEY (id)
);
COMMENT ON TABLE governance.decision_action IS 'Actions de mise en œuvre.';
COMMENT ON COLUMN governance.decision_action.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN governance.decision_action.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN governance.decision_action.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN governance.decision_action.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN governance.decision_action.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN governance.decision_action.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN governance.decision_action.decision_id IS 'Décision.';
COMMENT ON COLUMN governance.decision_action.action_text IS 'Action.';
COMMENT ON COLUMN governance.decision_action.owner_user_id IS 'Responsable.';
COMMENT ON COLUMN governance.decision_action.due_date IS 'Échéance.';
COMMENT ON COLUMN governance.decision_action.status IS 'État.';

CREATE TABLE event.event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    event_code varchar(60) NOT NULL,
    title varchar(255) NOT NULL,
    event_type varchar(40) NOT NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz,
    capacity integer,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    CONSTRAINT pk_event_event PRIMARY KEY (id)
);
COMMENT ON TABLE event.event IS 'Événements et formations.';
COMMENT ON COLUMN event.event.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN event.event.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN event.event.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN event.event.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN event.event.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN event.event.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN event.event.event_code IS 'Code.';
COMMENT ON COLUMN event.event.title IS 'Titre.';
COMMENT ON COLUMN event.event.event_type IS 'Type.';
COMMENT ON COLUMN event.event.start_at IS 'Début.';
COMMENT ON COLUMN event.event.end_at IS 'Fin.';
COMMENT ON COLUMN event.event.capacity IS 'Capacité.';
COMMENT ON COLUMN event.event.status IS 'État.';

CREATE TABLE event.registration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    event_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    person_id uuid,
    status varchar(30) DEFAULT 'REGISTERED' NOT NULL,
    registered_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT pk_event_registration PRIMARY KEY (id)
);
COMMENT ON TABLE event.registration IS 'Inscriptions à un événement.';
COMMENT ON COLUMN event.registration.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN event.registration.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN event.registration.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN event.registration.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN event.registration.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN event.registration.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN event.registration.event_id IS 'Événement.';
COMMENT ON COLUMN event.registration.organization_id IS 'Entreprise.';
COMMENT ON COLUMN event.registration.person_id IS 'Participant.';
COMMENT ON COLUMN event.registration.status IS 'État.';
COMMENT ON COLUMN event.registration.registered_at IS 'Date.';

CREATE TABLE notification.template (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    template_code varchar(80) NOT NULL,
    channel varchar(20) NOT NULL,
    locale varchar(10) DEFAULT 'fr' NOT NULL,
    subject_template text,
    body_template text NOT NULL,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    approved_by uuid,
    CONSTRAINT pk_notification_template PRIMARY KEY (id)
);
COMMENT ON TABLE notification.template IS 'Modèles de notifications versionnés.';
COMMENT ON COLUMN notification.template.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN notification.template.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN notification.template.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN notification.template.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN notification.template.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN notification.template.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN notification.template.template_code IS 'Code.';
COMMENT ON COLUMN notification.template.channel IS 'EMAIL, SMS, PUSH.';
COMMENT ON COLUMN notification.template.locale IS 'Langue.';
COMMENT ON COLUMN notification.template.subject_template IS 'Objet.';
COMMENT ON COLUMN notification.template.body_template IS 'Corps.';
COMMENT ON COLUMN notification.template.status IS 'État.';
COMMENT ON COLUMN notification.template.approved_by IS 'Valideur.';

CREATE TABLE notification.notification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    recipient_type varchar(30) NOT NULL,
    recipient_ref varchar(320) NOT NULL,
    channel varchar(20) NOT NULL,
    template_code varchar(80) NOT NULL,
    status varchar(30) DEFAULT 'QUEUED' NOT NULL,
    scheduled_at timestamptz DEFAULT now() NOT NULL,
    correlation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT pk_notification_notification PRIMARY KEY (id)
);
COMMENT ON TABLE notification.notification IS 'Notification à envoyer.';
COMMENT ON COLUMN notification.notification.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN notification.notification.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN notification.notification.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN notification.notification.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN notification.notification.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN notification.notification.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN notification.notification.recipient_type IS 'Type.';
COMMENT ON COLUMN notification.notification.recipient_ref IS 'Destinataire.';
COMMENT ON COLUMN notification.notification.channel IS 'Canal.';
COMMENT ON COLUMN notification.notification.template_code IS 'Modèle.';
COMMENT ON COLUMN notification.notification.status IS 'État.';
COMMENT ON COLUMN notification.notification.scheduled_at IS 'Planification.';
COMMENT ON COLUMN notification.notification.correlation_id IS 'Corrélation.';

CREATE TABLE notification.delivery_attempt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    notification_id uuid NOT NULL,
    attempt_no integer NOT NULL,
    provider_code varchar(60) NOT NULL,
    status varchar(30) NOT NULL,
    provider_message_id varchar(160),
    response_code varchar(60),
    attempted_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT pk_notification_delivery_attempt PRIMARY KEY (id)
);
COMMENT ON TABLE notification.delivery_attempt IS 'Tentatives de livraison.';
COMMENT ON COLUMN notification.delivery_attempt.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN notification.delivery_attempt.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN notification.delivery_attempt.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN notification.delivery_attempt.notification_id IS 'Notification.';
COMMENT ON COLUMN notification.delivery_attempt.attempt_no IS 'Tentative.';
COMMENT ON COLUMN notification.delivery_attempt.provider_code IS 'Prestataire.';
COMMENT ON COLUMN notification.delivery_attempt.status IS 'Résultat.';
COMMENT ON COLUMN notification.delivery_attempt.provider_message_id IS 'Référence externe.';
COMMENT ON COLUMN notification.delivery_attempt.response_code IS 'Code.';
COMMENT ON COLUMN notification.delivery_attempt.attempted_at IS 'Date.';

CREATE TABLE integration.partner (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    partner_code varchar(60) NOT NULL,
    name varchar(255) NOT NULL,
    partner_type varchar(40) NOT NULL,
    status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT pk_integration_partner PRIMARY KEY (id)
);
COMMENT ON TABLE integration.partner IS 'Partenaires et systèmes externes.';
COMMENT ON COLUMN integration.partner.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN integration.partner.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN integration.partner.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN integration.partner.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN integration.partner.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN integration.partner.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN integration.partner.partner_code IS 'Code.';
COMMENT ON COLUMN integration.partner.name IS 'Nom.';
COMMENT ON COLUMN integration.partner.partner_type IS 'MOBILE_MONEY, BANK, SMS, INPS.';
COMMENT ON COLUMN integration.partner.status IS 'État.';

CREATE TABLE integration.endpoint_configuration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    partner_id uuid NOT NULL,
    environment varchar(20) NOT NULL,
    base_url varchar(500) NOT NULL,
    auth_type varchar(40) NOT NULL,
    secret_reference varchar(255) NOT NULL,
    timeout_ms integer DEFAULT 10000 NOT NULL,
    retry_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT pk_integration_endpoint_configuration PRIMARY KEY (id)
);
COMMENT ON TABLE integration.endpoint_configuration IS 'Configuration non secrète des endpoints.';
COMMENT ON COLUMN integration.endpoint_configuration.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN integration.endpoint_configuration.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN integration.endpoint_configuration.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN integration.endpoint_configuration.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN integration.endpoint_configuration.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN integration.endpoint_configuration.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN integration.endpoint_configuration.partner_id IS 'Partenaire.';
COMMENT ON COLUMN integration.endpoint_configuration.environment IS 'Environnement.';
COMMENT ON COLUMN integration.endpoint_configuration.base_url IS 'URL.';
COMMENT ON COLUMN integration.endpoint_configuration.auth_type IS 'Type.';
COMMENT ON COLUMN integration.endpoint_configuration.secret_reference IS 'Référence coffre-fort.';
COMMENT ON COLUMN integration.endpoint_configuration.timeout_ms IS 'Timeout.';
COMMENT ON COLUMN integration.endpoint_configuration.retry_policy IS 'Reprise.';

CREATE TABLE integration.outbox_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    aggregate_type varchar(80) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type varchar(120) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status varchar(30) DEFAULT 'NEW' NOT NULL,
    available_at timestamptz DEFAULT now() NOT NULL,
    published_at timestamptz,
    CONSTRAINT pk_integration_outbox_event PRIMARY KEY (id)
);
COMMENT ON TABLE integration.outbox_event IS 'Outbox transactionnelle.';
COMMENT ON COLUMN integration.outbox_event.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN integration.outbox_event.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN integration.outbox_event.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN integration.outbox_event.aggregate_type IS 'Type.';
COMMENT ON COLUMN integration.outbox_event.aggregate_id IS 'Objet.';
COMMENT ON COLUMN integration.outbox_event.event_type IS 'Événement.';
COMMENT ON COLUMN integration.outbox_event.payload IS 'Contenu.';
COMMENT ON COLUMN integration.outbox_event.status IS 'État.';
COMMENT ON COLUMN integration.outbox_event.available_at IS 'Disponibilité.';
COMMENT ON COLUMN integration.outbox_event.published_at IS 'Publication.';

CREATE TABLE integration.webhook_subscription (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    partner_id uuid NOT NULL,
    event_type varchar(120) NOT NULL,
    callback_url varchar(500) NOT NULL,
    secret_reference varchar(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT pk_integration_webhook_subscription PRIMARY KEY (id)
);
COMMENT ON TABLE integration.webhook_subscription IS 'Abonnements sortants.';
COMMENT ON COLUMN integration.webhook_subscription.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN integration.webhook_subscription.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN integration.webhook_subscription.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN integration.webhook_subscription.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN integration.webhook_subscription.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN integration.webhook_subscription.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN integration.webhook_subscription.partner_id IS 'Partenaire.';
COMMENT ON COLUMN integration.webhook_subscription.event_type IS 'Événement.';
COMMENT ON COLUMN integration.webhook_subscription.callback_url IS 'URL.';
COMMENT ON COLUMN integration.webhook_subscription.secret_reference IS 'Référence de secret.';
COMMENT ON COLUMN integration.webhook_subscription.active IS 'Actif.';

CREATE TABLE integration.webhook_delivery (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    subscription_id uuid NOT NULL,
    outbox_event_id uuid NOT NULL,
    attempt_no integer NOT NULL,
    status varchar(30) NOT NULL,
    http_status integer,
    next_attempt_at timestamptz,
    CONSTRAINT pk_integration_webhook_delivery PRIMARY KEY (id)
);
COMMENT ON TABLE integration.webhook_delivery IS 'Livraisons de webhooks.';
COMMENT ON COLUMN integration.webhook_delivery.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN integration.webhook_delivery.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN integration.webhook_delivery.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN integration.webhook_delivery.subscription_id IS 'Abonnement.';
COMMENT ON COLUMN integration.webhook_delivery.outbox_event_id IS 'Événement.';
COMMENT ON COLUMN integration.webhook_delivery.attempt_no IS 'Tentative.';
COMMENT ON COLUMN integration.webhook_delivery.status IS 'Résultat.';
COMMENT ON COLUMN integration.webhook_delivery.http_status IS 'Code HTTP.';
COMMENT ON COLUMN integration.webhook_delivery.next_attempt_at IS 'Prochaine reprise.';

CREATE TABLE audit.audit_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    actor_user_id uuid,
    actor_type varchar(30) NOT NULL,
    action_code varchar(120) NOT NULL,
    entity_type varchar(80) NOT NULL,
    entity_id uuid,
    before_hash char(64),
    after_hash char(64),
    correlation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address inet,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT pk_audit_audit_event PRIMARY KEY (id)
);
COMMENT ON TABLE audit.audit_event IS 'Journal d’audit métier inviolable.';
COMMENT ON COLUMN audit.audit_event.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN audit.audit_event.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN audit.audit_event.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN audit.audit_event.actor_user_id IS 'Acteur.';
COMMENT ON COLUMN audit.audit_event.actor_type IS 'USER ou SYSTEM.';
COMMENT ON COLUMN audit.audit_event.action_code IS 'Action.';
COMMENT ON COLUMN audit.audit_event.entity_type IS 'Type objet.';
COMMENT ON COLUMN audit.audit_event.entity_id IS 'Objet.';
COMMENT ON COLUMN audit.audit_event.before_hash IS 'Empreinte avant.';
COMMENT ON COLUMN audit.audit_event.after_hash IS 'Empreinte après.';
COMMENT ON COLUMN audit.audit_event.correlation_id IS 'Corrélation.';
COMMENT ON COLUMN audit.audit_event.ip_address IS 'Adresse IP.';
COMMENT ON COLUMN audit.audit_event.metadata IS 'Métadonnées sans secret.';

CREATE TABLE audit.security_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    user_id uuid,
    event_type varchar(120) NOT NULL,
    severity varchar(20) NOT NULL,
    source_ip inet,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    status varchar(30) DEFAULT 'OPEN' NOT NULL,
    CONSTRAINT pk_audit_security_event PRIMARY KEY (id)
);
COMMENT ON TABLE audit.security_event IS 'Événements de sécurité.';
COMMENT ON COLUMN audit.security_event.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN audit.security_event.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN audit.security_event.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN audit.security_event.user_id IS 'Compte.';
COMMENT ON COLUMN audit.security_event.event_type IS 'Type.';
COMMENT ON COLUMN audit.security_event.severity IS 'Sévérité.';
COMMENT ON COLUMN audit.security_event.source_ip IS 'IP.';
COMMENT ON COLUMN audit.security_event.details IS 'Détails filtrés.';
COMMENT ON COLUMN audit.security_event.status IS 'État.';

CREATE TABLE audit.data_export (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    requested_by uuid NOT NULL,
    export_type varchar(80) NOT NULL,
    scope jsonb DEFAULT '{}'::jsonb NOT NULL,
    record_count bigint,
    document_id uuid,
    expires_at timestamptz,
    approved_by uuid,
    CONSTRAINT pk_audit_data_export PRIMARY KEY (id)
);
COMMENT ON TABLE audit.data_export IS 'Registre des exports de données.';
COMMENT ON COLUMN audit.data_export.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN audit.data_export.created_at IS 'Horodatage serveur.';
COMMENT ON COLUMN audit.data_export.created_by IS 'Auteur technique ou métier.';
COMMENT ON COLUMN audit.data_export.requested_by IS 'Demandeur.';
COMMENT ON COLUMN audit.data_export.export_type IS 'Type.';
COMMENT ON COLUMN audit.data_export.scope IS 'Périmètre.';
COMMENT ON COLUMN audit.data_export.record_count IS 'Nombre de lignes.';
COMMENT ON COLUMN audit.data_export.document_id IS 'Fichier chiffré.';
COMMENT ON COLUMN audit.data_export.expires_at IS 'Expiration.';
COMMENT ON COLUMN audit.data_export.approved_by IS 'Second valideur.';

CREATE TABLE reporting.report_definition (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    report_code varchar(80) NOT NULL,
    name varchar(255) NOT NULL,
    report_type varchar(40) NOT NULL,
    definition jsonb DEFAULT '{}'::jsonb NOT NULL,
    required_permission varchar(120) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT pk_reporting_report_definition PRIMARY KEY (id)
);
COMMENT ON TABLE reporting.report_definition IS 'Catalogue des rapports.';
COMMENT ON COLUMN reporting.report_definition.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN reporting.report_definition.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN reporting.report_definition.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN reporting.report_definition.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN reporting.report_definition.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN reporting.report_definition.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN reporting.report_definition.report_code IS 'Code.';
COMMENT ON COLUMN reporting.report_definition.name IS 'Nom.';
COMMENT ON COLUMN reporting.report_definition.report_type IS 'OPERATIONAL, EXECUTIVE, AUDIT.';
COMMENT ON COLUMN reporting.report_definition.definition IS 'Configuration.';
COMMENT ON COLUMN reporting.report_definition.required_permission IS 'Permission.';
COMMENT ON COLUMN reporting.report_definition.active IS 'Actif.';

CREATE TABLE reporting.report_execution (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    report_definition_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    parameters jsonb DEFAULT '{}'::jsonb NOT NULL,
    status varchar(30) DEFAULT 'QUEUED' NOT NULL,
    started_at timestamptz,
    completed_at timestamptz,
    document_id uuid,
    CONSTRAINT pk_reporting_report_execution PRIMARY KEY (id)
);
COMMENT ON TABLE reporting.report_execution IS 'Historique d’exécution.';
COMMENT ON COLUMN reporting.report_execution.id IS 'Identifiant technique immuable.';
COMMENT ON COLUMN reporting.report_execution.created_at IS 'Horodatage de création.';
COMMENT ON COLUMN reporting.report_execution.created_by IS 'Compte à l’origine de la création.';
COMMENT ON COLUMN reporting.report_execution.updated_at IS 'Horodatage de dernière modification.';
COMMENT ON COLUMN reporting.report_execution.updated_by IS 'Compte à l’origine de la modification.';
COMMENT ON COLUMN reporting.report_execution.version IS 'Version de verrouillage optimiste.';
COMMENT ON COLUMN reporting.report_execution.report_definition_id IS 'Rapport.';
COMMENT ON COLUMN reporting.report_execution.requested_by IS 'Demandeur.';
COMMENT ON COLUMN reporting.report_execution.parameters IS 'Paramètres.';
COMMENT ON COLUMN reporting.report_execution.status IS 'État.';
COMMENT ON COLUMN reporting.report_execution.started_at IS 'Début.';
COMMENT ON COLUMN reporting.report_execution.completed_at IS 'Fin.';
COMMENT ON COLUMN reporting.report_execution.document_id IS 'Résultat.';
