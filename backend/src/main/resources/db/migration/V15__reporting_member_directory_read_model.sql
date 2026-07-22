-- Read model du répertoire des membres (BO-002) : agrégats de cotisation par organisation
-- pour les colonnes « Cotisation due / payée » et le volet de synthèse. Vue en lecture seule
-- dans le schéma reporting : le module reporting ne lit que son propre schéma.

-- Cotisation appelée (due) et réglée (payée) par organisation membre, tous exercices confondus.
CREATE OR REPLACE VIEW reporting.member_financials AS
SELECT o.id                                                     AS organization_id,
       coalesce(sum(cc.amount_due), 0)::numeric(19, 2)          AS expected_amount,
       coalesce(sum(cc.amount_due - cc.balance_amount), 0)::numeric(19, 2) AS collected_amount
FROM member.organization o
JOIN member.membership m ON m.organization_id = o.id
LEFT JOIN contribution.contribution_call cc ON cc.membership_id = m.id
GROUP BY o.id;

-- Effectifs par catégorie d'adhésion (dont grands cotisants = grandes entreprises).
CREATE OR REPLACE VIEW reporting.member_category_counts AS
SELECT category_code, count(*) AS member_count
FROM member.membership
GROUP BY category_code;

-- Groupements professionnels actifs (options de filtre du répertoire).
CREATE OR REPLACE VIEW reporting.member_groups AS
SELECT name
FROM member.professional_group
WHERE status = 'ACTIVE';
