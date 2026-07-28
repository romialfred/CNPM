-- V28__organization_sector_link.sql
--
-- Multi-secteur d'activité : une entreprise peut relever de PLUSIEURS secteurs. La colonne
-- member.organization.sector_code reste le secteur PRINCIPAL (affiché en liste et utilisé
-- par le filtre) ; la table de liaison ci-dessous porte l'ensemble complet des secteurs.
--
-- Modèle relationnel explicite (jamais de JSONB pour masquer une relation connue, CLAUDE.md).

CREATE TABLE IF NOT EXISTS member.organization_sector (
    organization_id uuid        NOT NULL REFERENCES member.organization (id) ON DELETE CASCADE,
    sector_code     varchar(80) NOT NULL,
    CONSTRAINT pk_member_organization_sector PRIMARY KEY (organization_id, sector_code)
);

COMMENT ON TABLE member.organization_sector IS
    'Secteurs d''activité d''une entreprise (multi-valué). Le secteur principal reste member.organization.sector_code.';
COMMENT ON COLUMN member.organization_sector.organization_id IS 'Entreprise concernée.';
COMMENT ON COLUMN member.organization_sector.sector_code IS 'Code secteur (référentiel ref.reference_value domaine SECTOR).';

-- Recherche « entreprises d'un secteur donné » sans parcourir la table entière.
CREATE INDEX IF NOT EXISTS ix_member_organization_sector_sector
    ON member.organization_sector (sector_code);
