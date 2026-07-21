-- Read model du tableau de bord d'administration (BO-001).
--
-- Le module `reporting` ne doit pas lire les tables privées des autres modules. Ces vues,
-- portées par un schéma `reporting` dédié, encapsulent les agrégats en lecture seule : le
-- module reporting ne lit que son propre schéma (pattern read-model / CQRS côté lecture).
CREATE SCHEMA IF NOT EXISTS reporting;

-- Effectifs par statut d'adhésion, dérivés de la vue de liste des adhésions (BO-002).
CREATE OR REPLACE VIEW reporting.member_status_counts AS
SELECT
    count(*) FILTER (WHERE status = 'ACTIVE')   AS active_count,
    count(*) FILTER (WHERE status = 'DORMANT')  AS dormant_count,
    count(*) FILTER (WHERE status = 'PROSPECT') AS prospect_count
FROM member.membership_list;

-- Agrégats de cotisation par exercice (année fiscale). `collected` dérive du solde restant :
-- montant appelé moins solde dû. Une année sans appel produit des sommes NULL (indisponible).
CREATE OR REPLACE VIEW reporting.contribution_totals AS
SELECT
    fy.year                                      AS exercise_year,
    sum(cc.amount_due)                           AS expected_amount,
    sum(cc.amount_due - cc.balance_amount)       AS collected_amount,
    sum(cc.balance_amount)                       AS outstanding_amount
FROM contribution.fiscal_year fy
LEFT JOIN contribution.contribution_call cc ON cc.fiscal_year_id = fy.id
GROUP BY fy.year;
