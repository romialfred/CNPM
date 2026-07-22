-- Répartition des encaissements par canal (BO-001) : visuel complémentaire du tableau de bord.
-- Vue en lecture seule dans le schéma reporting ; le module reporting ne lit que ce schéma.
CREATE OR REPLACE VIEW reporting.payment_channel_breakdown AS
SELECT pt.channel                          AS channel,
       count(*)                            AS payment_count,
       sum(pt.amount)::numeric(19, 2)      AS total_amount
FROM payment.payment_transaction pt
GROUP BY pt.channel;
