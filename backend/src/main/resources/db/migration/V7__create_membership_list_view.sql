-- V7__create_membership_list_view.sql
--
-- Vue de lecture de la liste des membres (BO-002). Elle aplatit, pour chaque adhésion :
-- la raison sociale de l'entreprise et son groupement professionnel PRINCIPAL.
--
-- Le groupement principal est résolu en SQL de façon DÉTERMINISTE : aucune contrainte
-- ne garantit un unique `is_primary` par entreprise (l'index unique porte sur
-- (organization_id, group_id, joined_at)). La sous-requête LATERAL n'en retient donc
-- qu'un seul — le rattachement principal actif le plus récent, départagé par group_id —
-- ce qui évite qu'une donnée incohérente fasse apparaître une adhésion en double dans la
-- liste. Les rattachements clôturés (`left_at` non nul) sont exclus.
--
-- Vue en LECTURE SEULE : une adhésion reste écrite dans member.membership. La pagination
-- de la liste porte sur une ligne par adhésion (pas de relation vers-plusieurs), ce qui
-- élimine le N+1 sans jointure fetch côté application.

CREATE VIEW member.membership_list AS
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
    pg.name               AS primary_group_name
FROM member.membership m
JOIN member.organization o ON o.id = m.organization_id
LEFT JOIN LATERAL (
    SELECT gm.group_id
    FROM member.group_membership gm
    WHERE gm.organization_id = m.organization_id
      AND gm.is_primary
      AND gm.left_at IS NULL
    ORDER BY gm.joined_at DESC, gm.group_id
    LIMIT 1
) primary_gm ON true
LEFT JOIN member.professional_group pg ON pg.id = primary_gm.group_id;

COMMENT ON VIEW member.membership_list IS
    'Lecture BO-002 : adhésion jointe à son entreprise et à son groupement principal résolu (un seul, déterministe).';
COMMENT ON COLUMN member.membership_list.organization_legal_name IS 'Raison sociale de l''entreprise rattachée (aplatie depuis member.organization).';
COMMENT ON COLUMN member.membership_list.primary_group_code IS 'Code du groupement principal actif, ou NULL si aucun.';
COMMENT ON COLUMN member.membership_list.primary_group_name IS 'Dénomination du groupement principal actif, ou NULL si aucun.';
