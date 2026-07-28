-- V27__organization_prospect_profile.sql
--
-- Enrichissement du profil d'une organisation (prospect ou membre) : coordonnées de
-- contact, description, et indicateurs d'activité. Ces champs restent OPTIONNELS — un
-- prospect en début de démarchage n'a pas toujours toutes les informations.
--
-- Les montants (capital, chiffre d'affaires) utilisent numeric(19,2) — jamais float
-- (CLAUDE.md). L'effectif est un entier. Le secteur multi-valué relève d'un incrément
-- ultérieur (table de liaison) ; ici le secteur unique existant est conservé.

ALTER TABLE member.organization
    ADD COLUMN IF NOT EXISTS description   text,
    ADD COLUMN IF NOT EXISTS website       varchar(255),
    ADD COLUMN IF NOT EXISTS email         varchar(320),
    ADD COLUMN IF NOT EXISTS phone         varchar(40),
    ADD COLUMN IF NOT EXISTS address       text,
    ADD COLUMN IF NOT EXISTS employee_count integer,
    ADD COLUMN IF NOT EXISTS capital       numeric(19, 2),
    ADD COLUMN IF NOT EXISTS revenue_n1    numeric(19, 2);

COMMENT ON COLUMN member.organization.description IS 'Présentation libre de l''entreprise.';
COMMENT ON COLUMN member.organization.website IS 'Site web institutionnel.';
COMMENT ON COLUMN member.organization.email IS 'Adresse électronique de contact.';
COMMENT ON COLUMN member.organization.phone IS 'Numéro de téléphone de contact.';
COMMENT ON COLUMN member.organization.address IS 'Adresse physique.';
COMMENT ON COLUMN member.organization.employee_count IS 'Effectif déclaré.';
COMMENT ON COLUMN member.organization.capital IS 'Capital social (FCFA).';
COMMENT ON COLUMN member.organization.revenue_n1 IS 'Chiffre d''affaires de l''exercice N-1 (FCFA).';

-- Intégrité minimale : montants et effectif non négatifs lorsqu'ils sont renseignés.
ALTER TABLE member.organization
    ADD CONSTRAINT ck_member_organization_employee_count
        CHECK (employee_count IS NULL OR employee_count >= 0),
    ADD CONSTRAINT ck_member_organization_capital
        CHECK (capital IS NULL OR capital >= 0),
    ADD CONSTRAINT ck_member_organization_revenue_n1
        CHECK (revenue_n1 IS NULL OR revenue_n1 >= 0);

-- --------------------------------------------------------------------------
-- Référentiel des FORMES JURIDIQUES (Type d'entreprise), pour la liste déroulante.
-- Formes usuelles au Mali (OHADA). Valeurs à confirmer par le CNPM.
-- --------------------------------------------------------------------------
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'SA', 'Société anonyme (SA)', 1, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'SARL', 'Société à responsabilité limitée (SARL)', 2, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'SUARL', 'SARL unipersonnelle (SUARL)', 3, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'SAS', 'Société par actions simplifiée (SAS)', 4, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'GIE', 'Groupement d''intérêt économique (GIE)', 5, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'COOPERATIVE', 'Coopérative', 6, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'ENTREPRISE_INDIVIDUELLE', 'Entreprise individuelle', 7, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'ASSOCIATION', 'Association', 8, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('ORGANIZATION_TYPE', 'AUTRE', 'Autre', 99, true) ON CONFLICT (domain, code) DO NOTHING;

-- --------------------------------------------------------------------------
-- Référentiel des SECTEURS d'activité, pour la sélection (multi-secteur à venir).
-- Nomenclature large ; à affiner par le CNPM.
-- --------------------------------------------------------------------------
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'AGRICULTURE', 'Agriculture et agro-industrie', 1, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'INDUSTRIE', 'Industrie et fabrication', 2, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'MINES', 'Mines et carrières', 3, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'BTP', 'Bâtiment et travaux publics', 4, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'COMMERCE', 'Commerce et distribution', 5, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'TRANSPORT', 'Transport et logistique', 6, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'ENERGIE', 'Énergie', 7, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'FINANCE', 'Banque, finance et assurance', 8, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'NUMERIQUE', 'Numérique et télécommunications', 9, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'TOURISME', 'Tourisme et hôtellerie', 10, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'SERVICES', 'Services aux entreprises', 11, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'SANTE', 'Santé', 12, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'EDUCATION', 'Éducation et formation', 13, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'ARTISANAT', 'Artisanat', 14, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('SECTOR', 'AUTRE', 'Autre', 99, true) ON CONFLICT (domain, code) DO NOTHING;
