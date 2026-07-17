-- V8__add_primary_contact_to_membership_list_view.sql
--
-- Ajoute le CONTACT PRINCIPAL de l'entreprise à la vue de lecture BO-002.
--
-- Règle de sélection (HYPOTHÈSE à valider — DATA-DEC-007) : le contact principal est le
-- REPRÉSENTANT LÉGAL actif de l'entreprise. Le schéma ne porte aucun flag `is_primary` sur
-- member.organization_contact ; `is_legal_representative` est le seul marqueur distinctif,
-- et le représentant légal est le contact institutionnel canonique. En l'absence de
-- représentant légal actif, le contact principal est NULL (on ne « devine » pas un contact
-- parmi les autres rôles). « Actif » = mandat déjà pris d'effet ET non expiré, soit
-- valid_from <= aujourd'hui ET (valid_to nul OU >= aujourd'hui) : un mandat à effet futur
-- ne compte pas encore.
--
-- Cette redéfinition applique la MÊME correction de borne basse au groupement principal
-- (rattachement déjà pris d'effet : joined_at <= aujourd'hui), pour la cohérence.
--
-- Comme pour le groupement principal, la sous-requête LATERAL n'en retient qu'UN seul
-- (le plus récent par valid_from, départagé par id) : aucune contrainte ne garantit
-- l'unicité du représentant légal, et la liste ne doit jamais dupliquer une adhésion.
--
-- Données personnelles : nom/téléphone/courriel proviennent de member.person. Cette vue
-- ne sert qu'un écran d'administration protégé par la permission MEMBER.READ ; elle n'est
-- pas exposée publiquement (la vitrine publique R4 relève d'un consentement distinct,
-- UX-DEC-013). Les tests n'emploient que des personnes synthétiques.
--
-- CREATE OR REPLACE : les colonnes existantes de V7 sont conservées dans le même ordre,
-- les colonnes de contact sont ajoutées en fin (contrainte de PostgreSQL).

CREATE OR REPLACE VIEW member.membership_list AS
SELECT
    m.id,
    m.membership_number,
    m.organization_id,
    o.legal_name          AS organization_legal_name,
    m.category_code,
    m.status,
    m.joined_at,
    m.version,
    pg.code               AS primary_group_code,
    pg.name               AS primary_group_name,
    person.first_names || ' ' || person.last_name AS primary_contact_name,
    person.email          AS primary_contact_email,
    person.phone          AS primary_contact_phone
FROM member.membership m
JOIN member.organization o ON o.id = m.organization_id
LEFT JOIN LATERAL (
    SELECT gm.group_id
    FROM member.group_membership gm
    WHERE gm.organization_id = m.organization_id
      AND gm.is_primary
      AND gm.joined_at <= CURRENT_DATE
      AND gm.left_at IS NULL
    ORDER BY gm.joined_at DESC, gm.group_id
    LIMIT 1
) primary_gm ON true
LEFT JOIN member.professional_group pg ON pg.id = primary_gm.group_id
LEFT JOIN LATERAL (
    SELECT oc.person_id
    FROM member.organization_contact oc
    WHERE oc.organization_id = m.organization_id
      AND oc.is_legal_representative
      AND oc.valid_from <= CURRENT_DATE
      AND (oc.valid_to IS NULL OR oc.valid_to >= CURRENT_DATE)
    ORDER BY oc.valid_from DESC, oc.id
    LIMIT 1
) primary_contact ON true
LEFT JOIN member.person person ON person.id = primary_contact.person_id;

COMMENT ON VIEW member.membership_list IS
    'Lecture BO-002 : adhésion jointe à son entreprise, son groupement principal et son contact principal (représentant légal actif), tous résolus de façon déterministe.';
COMMENT ON COLUMN member.membership_list.primary_contact_name IS 'Nom complet du représentant légal actif, ou NULL si aucun.';
COMMENT ON COLUMN member.membership_list.primary_contact_email IS 'Courriel du représentant légal actif, ou NULL.';
COMMENT ON COLUMN member.membership_list.primary_contact_phone IS 'Téléphone du représentant légal actif, ou NULL.';
