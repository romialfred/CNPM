-- V9__create_organization_status_history_view.sql
--
-- Vue de lecture de l'historique des statuts d'une entreprise (action « Historique » de
-- BO-002). Elle rattache chaque changement de statut d'adhésion
-- (member.membership_status_history, append-only) à l'entreprise via son adhésion, et
-- expose le numéro d'adhésion pour le contexte (une entreprise peut porter plusieurs
-- adhésions dans le temps).
--
-- Vue en LECTURE SEULE : la table sous-jacente reste append-only (protégée par les
-- triggers de V4/V5). Aucune écriture ne passe par la vue.

CREATE VIEW member.organization_status_history AS
SELECT
    msh.id,
    m.organization_id,
    msh.membership_id,
    m.membership_number,
    msh.from_status,
    msh.to_status,
    msh.reason,
    msh.created_at,
    msh.created_by
FROM member.membership_status_history msh
JOIN member.membership m ON m.id = msh.membership_id;

COMMENT ON VIEW member.organization_status_history IS
    'Lecture BO-002 (Historique) : changements de statut des adhésions d''une entreprise, du plus récent au plus ancien.';
COMMENT ON COLUMN member.organization_status_history.organization_id IS 'Entreprise concernée (via son adhésion).';
COMMENT ON COLUMN member.organization_status_history.membership_number IS 'Numéro de l''adhésion dont le statut a changé.';
COMMENT ON COLUMN member.organization_status_history.from_status IS 'Statut avant le changement (NULL pour le statut initial).';
COMMENT ON COLUMN member.organization_status_history.to_status IS 'Statut après le changement.';
