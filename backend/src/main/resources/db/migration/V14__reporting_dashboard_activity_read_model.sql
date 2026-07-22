-- Compléments du read model du tableau de bord (BO-001) : série mensuelle, paiements
-- récents, activités et alertes. Vues en lecture seule dans le schéma reporting : le
-- module reporting ne lit que son propre schéma (frontières de modules respectées).

-- Encaissements agrégés par mois (toutes références confondues).
CREATE OR REPLACE VIEW reporting.monthly_collection AS
SELECT date_trunc('month', pt.paid_at)::date AS month_start,
       sum(pt.amount)                         AS collected_amount,
       count(*)                               AS payment_count
FROM payment.payment_transaction pt
GROUP BY date_trunc('month', pt.paid_at);

-- Derniers paiements enregistrés, avec le nom du payeur (organisation membre).
CREATE OR REPLACE VIEW reporting.recent_payments AS
SELECT pt.id,
       pt.transaction_number,
       o.legal_name       AS payer,
       pt.amount,
       pt.channel,
       pt.status,
       pt.paid_at
FROM payment.payment_transaction pt
LEFT JOIN payment.payment_reference pr ON pr.id = pt.payment_reference_id
LEFT JOIN member.membership mb          ON mb.id = pr.membership_id
LEFT JOIN member.organization o          ON o.id = mb.organization_id;

-- Adhésions récentes (fil d'activité).
CREATE OR REPLACE VIEW reporting.recent_memberships AS
SELECT m.id,
       o.legal_name AS organization_legal_name,
       m.status,
       m.joined_at
FROM member.membership m
JOIN member.organization o ON o.id = m.organization_id
WHERE m.joined_at IS NOT NULL;

-- Cotisations en retard par organisation (alertes) : solde restant dû strictement positif.
CREATE OR REPLACE VIEW reporting.overdue_contributions AS
SELECT o.id             AS organization_id,
       o.legal_name     AS organization_legal_name,
       fy.year          AS exercise_year,
       sum(cc.balance_amount) AS outstanding_amount,
       min(cc.due_date)       AS earliest_due_date
FROM contribution.contribution_call cc
JOIN contribution.fiscal_year fy ON fy.id = cc.fiscal_year_id
JOIN member.membership mb        ON mb.id = cc.membership_id
JOIN member.organization o       ON o.id = mb.organization_id
WHERE cc.balance_amount > 0
GROUP BY o.id, o.legal_name, fy.year;
