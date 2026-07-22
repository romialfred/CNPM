-- Jeu de données de DÉMONSTRATION pour la base locale (CNPM_DB).
--
-- Données FICTIVES et non nominatives, destinées à voir les écrans peuplés en mode
-- « connexion réelle » (http). Ne jamais utiliser en production.
--
-- Effaçable et rejouable : toutes les lignes portent le marqueur created_by ci-dessous.
-- Ré-exécuter ce script les remplace ; pour tout supprimer, exécuter seulement le bloc
-- « Nettoyage » (ordre FK-safe).
--
-- Contenu : 14 organisations membres + adhésions (9 actives, 3 dormantes, 2 prospects),
-- 5 groupements, contacts (représentants légaux), rattachements aux groupements, exercice
-- 2026 + appels de cotisation, et ~12 mois de paiements pour le graphe du tableau de bord.
--
-- Usage :
--   psql -h 127.0.0.1 -p 5432 -U app_user -d CNPM_DB -f scripts/dev/seed-demo-data.sql

\set seed '''dddddddd-dddd-dddd-dddd-dddddddddddd'''

BEGIN;

-- ---------------------------------------------------------------------------
-- Nettoyage (idempotence) — ordre FK-safe.
--
-- payment.payment_transaction est append-only (trigger d'intégrité financière).
-- POUR CE SEED DE DÉMONSTRATION UNIQUEMENT, on désactive temporairement ce garde-fou
-- afin de pouvoir réinitialiser les paiements fictifs, puis on le RÉACTIVE avant COMMIT.
-- Ne jamais faire cela en production : les écritures financières validées y sont immuables.
-- ---------------------------------------------------------------------------
ALTER TABLE payment.payment_transaction DISABLE TRIGGER trg_append_only_payment_payment_transaction;

DELETE FROM payment.payment_transaction    WHERE created_by = :seed;
DELETE FROM payment.payment_reference      WHERE created_by = :seed;
DELETE FROM contribution.contribution_call WHERE created_by = :seed;
DELETE FROM member.group_membership        WHERE created_by = :seed;
DELETE FROM member.organization_contact    WHERE created_by = :seed;
DELETE FROM member.membership              WHERE created_by = :seed;
DELETE FROM member.person                  WHERE created_by = :seed;
DELETE FROM member.organization            WHERE created_by = :seed;
DELETE FROM member.professional_group      WHERE created_by = :seed;
DELETE FROM contribution.fiscal_year       WHERE created_by = :seed;

-- ---------------------------------------------------------------------------
-- Exercice 2026
-- ---------------------------------------------------------------------------
INSERT INTO contribution.fiscal_year (created_by, year, start_date, end_date, status)
VALUES (:seed, 2026, DATE '2026-01-01', DATE '2026-12-31', 'OPEN');

-- ---------------------------------------------------------------------------
-- Groupements professionnels (fictifs)
-- ---------------------------------------------------------------------------
INSERT INTO member.professional_group (id, created_by, code, name, sector_code, status) VALUES
 ('c0000000-0000-4000-8000-0000000000b1', :seed, 'GRP-BTP',      'Groupement BTP et Travaux Publics', 'BTP',        'ACTIVE'),
 ('c0000000-0000-4000-8000-0000000000b2', :seed, 'GRP-AGRO',     'Groupement Agro-industrie',         'AGRICULTURE','ACTIVE'),
 ('c0000000-0000-4000-8000-0000000000b3', :seed, 'GRP-COMMERCE', 'Groupement Commerce et Services',   'COMMERCE',   'ACTIVE'),
 ('c0000000-0000-4000-8000-0000000000b4', :seed, 'GRP-MINES',    'Groupement Mines et Énergie',       'MINES',      'ACTIVE'),
 ('c0000000-0000-4000-8000-0000000000b5', :seed, 'GRP-BANQUE',   'Groupement Banque et Assurances',   'FINANCE',    'ACTIVE');

-- ---------------------------------------------------------------------------
-- Organisations membres (fictives)  +  adhésions 1:1
-- Statuts : 9 ACTIVE, 3 DORMANT, 2 PROSPECT  -> base = 12, actifs = 9.
-- ---------------------------------------------------------------------------
INSERT INTO member.organization (id, created_by, legal_name, trade_name, organization_type, sector_code, status) VALUES
 ('a1111111-0000-4000-8000-000000000001', :seed, 'Société Malienne de Distribution SARL', 'SOMADIS',   'SARL', 'COMMERCE',    'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000002', :seed, 'Agro-Négoce du Sahel SA',               'AGROSAHEL', 'SA',   'AGRICULTURE', 'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000003', :seed, 'Bâtir Mali Construction SA',            'BAMACO',    'SA',   'BTP',         'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000004', :seed, 'Énergie Solaire du Mali SARL',          'ESOMA',     'SARL', 'ENERGIE',     'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000005', :seed, 'Textile Bamako Industries SA',          'TEXBAMA',   'SA',   'INDUSTRIE',   'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000006', :seed, 'Transports Niger-Sénégal SARL',         'TRANISE',   'SARL', 'TRANSPORT',   'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000007', :seed, 'Or et Ressources du Mandé SA',          'ORMANDE',   'SA',   'MINES',       'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000008', :seed, 'Télécom Services Mali SARL',            'TELSEM',    'SARL', 'TELECOM',     'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000009', :seed, 'Banque Régionale de Développement SA',  'BRD',       'SA',   'FINANCE',     'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000010', :seed, 'Pharmacie Centrale du Faso SARL',       'PHARCEN',   'SARL', 'SANTE',       'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000011', :seed, 'Hôtellerie du Fleuve SARL',             'HOFLEUVE',  'SARL', 'TOURISME',    'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000012', :seed, 'Coton Sud Transformation SA',           'COSUTRA',   'SA',   'AGRICULTURE', 'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000013', :seed, 'Nouvelle Imprimerie du Sahel SARL',     'NISAHEL',   'SARL', 'INDUSTRIE',   'ACTIVE'),
 ('a1111111-0000-4000-8000-000000000014', :seed, 'Conseils et Audit Bamako SARL',         'CABAM',     'SARL', 'SERVICES',    'ACTIVE');

INSERT INTO member.membership (id, created_by, organization_id, membership_number, category_code, status, joined_at) VALUES
 ('b2222222-0000-4000-8000-000000000001', :seed, 'a1111111-0000-4000-8000-000000000001', 'CNPM-2022-0001', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2022-03-14'),
 ('b2222222-0000-4000-8000-000000000002', :seed, 'a1111111-0000-4000-8000-000000000002', 'CNPM-2022-0002', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2022-05-02'),
 ('b2222222-0000-4000-8000-000000000003', :seed, 'a1111111-0000-4000-8000-000000000003', 'CNPM-2022-0003', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2022-06-21'),
 ('b2222222-0000-4000-8000-000000000004', :seed, 'a1111111-0000-4000-8000-000000000004', 'CNPM-2023-0004', 'PME',               'ACTIVE',   DATE '2023-01-10'),
 ('b2222222-0000-4000-8000-000000000005', :seed, 'a1111111-0000-4000-8000-000000000005', 'CNPM-2023-0005', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2023-02-18'),
 ('b2222222-0000-4000-8000-000000000006', :seed, 'a1111111-0000-4000-8000-000000000006', 'CNPM-2023-0006', 'PME',               'ACTIVE',   DATE '2023-04-05'),
 ('b2222222-0000-4000-8000-000000000007', :seed, 'a1111111-0000-4000-8000-000000000007', 'CNPM-2023-0007', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2023-07-30'),
 ('b2222222-0000-4000-8000-000000000008', :seed, 'a1111111-0000-4000-8000-000000000008', 'CNPM-2024-0008', 'PME',               'ACTIVE',   DATE '2024-01-22'),
 ('b2222222-0000-4000-8000-000000000009', :seed, 'a1111111-0000-4000-8000-000000000009', 'CNPM-2024-0009', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2024-03-11'),
 ('b2222222-0000-4000-8000-000000000010', :seed, 'a1111111-0000-4000-8000-000000000010', 'CNPM-2024-0010', 'PME',               'DORMANT',  DATE '2024-05-19'),
 ('b2222222-0000-4000-8000-000000000011', :seed, 'a1111111-0000-4000-8000-000000000011', 'CNPM-2024-0011', 'TPE',               'DORMANT',  DATE '2024-08-08'),
 ('b2222222-0000-4000-8000-000000000012', :seed, 'a1111111-0000-4000-8000-000000000012', 'CNPM-2025-0012', 'PME',               'DORMANT',  DATE '2025-01-27'),
 ('b2222222-0000-4000-8000-000000000013', :seed, 'a1111111-0000-4000-8000-000000000013', 'CNPM-2025-0013', 'TPE',               'PROSPECT', NULL),
 ('b2222222-0000-4000-8000-000000000014', :seed, 'a1111111-0000-4000-8000-000000000014', 'CNPM-2025-0014', 'TPE',               'PROSPECT', NULL);

-- ---------------------------------------------------------------------------
-- Représentants légaux (personnes fictives) + contact d'organisation
-- Alimente la colonne « Contact principal » de la vue membership_list.
-- ---------------------------------------------------------------------------
INSERT INTO member.person (id, created_by, last_name, first_names, email, phone, job_title) VALUES
 ('e3333333-0000-4000-8000-000000000001', :seed, 'Diarra',    'Adama',      'a.diarra@somadis.ml',    '+223 66 12 34 01', 'Directeur Général'),
 ('e3333333-0000-4000-8000-000000000002', :seed, 'Diallo',    'Fatoumata',  'f.diallo@agrosahel.ml',  '+223 66 12 34 02', 'Directrice Générale'),
 ('e3333333-0000-4000-8000-000000000003', :seed, 'Koné',      'Boubacar',   'b.kone@bamaco.ml',       '+223 66 12 34 03', 'PDG'),
 ('e3333333-0000-4000-8000-000000000004', :seed, 'Maïga',     'Aïssata',    'a.maiga@esoma.ml',       '+223 66 12 34 04', 'Gérante'),
 ('e3333333-0000-4000-8000-000000000005', :seed, 'Traoré',    'Souleymane', 's.traore@texbama.ml',    '+223 66 12 34 05', 'Directeur Général'),
 ('e3333333-0000-4000-8000-000000000006', :seed, 'Coulibaly', 'Ibrahima',   'i.coulibaly@tranise.ml', '+223 66 12 34 06', 'Gérant'),
 ('e3333333-0000-4000-8000-000000000007', :seed, 'Sidibé',    'Mariam',     'm.sidibe@ormande.ml',    '+223 66 12 34 07', 'Directrice Générale'),
 ('e3333333-0000-4000-8000-000000000008', :seed, 'Keïta',     'Modibo',     'm.keita@telsem.ml',      '+223 66 12 34 08', 'Gérant'),
 ('e3333333-0000-4000-8000-000000000009', :seed, 'Touré',     'Kadiatou',   'k.toure@brd.ml',         '+223 66 12 34 09', 'Directrice Générale'),
 ('e3333333-0000-4000-8000-000000000010', :seed, 'Cissé',     'Amadou',     'a.cisse@pharcen.ml',     '+223 66 12 34 10', 'Gérant'),
 ('e3333333-0000-4000-8000-000000000011', :seed, 'Sangaré',   'Rokia',      'r.sangare@hofleuve.ml',  '+223 66 12 34 11', 'Gérante'),
 ('e3333333-0000-4000-8000-000000000012', :seed, 'Camara',    'Oumar',      'o.camara@cosutra.ml',    '+223 66 12 34 12', 'Directeur Général'),
 ('e3333333-0000-4000-8000-000000000013', :seed, 'Bah',       'Djénéba',    'd.bah@nisahel.ml',       '+223 66 12 34 13', 'Gérante'),
 ('e3333333-0000-4000-8000-000000000014', :seed, 'Dembélé',   'Seydou',     's.dembele@cabam.ml',     '+223 66 12 34 14', 'Directeur Associé');

INSERT INTO member.organization_contact (created_by, organization_id, person_id, contact_role, is_legal_representative, valid_from)
SELECT :seed,
       ('a1111111-0000-4000-8000-0000000000' || suffix)::uuid,
       ('e3333333-0000-4000-8000-0000000000' || suffix)::uuid,
       'REPRESENTANT_LEGAL', true, DATE '2022-01-01'
FROM (SELECT lpad(g::text, 2, '0') AS suffix FROM generate_series(1, 14) g) s;

-- ---------------------------------------------------------------------------
-- Rattachement de chaque organisation à un groupement (primaire).
-- Alimente la colonne « Groupement » de la vue membership_list.
-- ---------------------------------------------------------------------------
INSERT INTO member.group_membership (created_by, organization_id, group_id, is_primary, joined_at)
SELECT :seed, o.id,
       (CASE o.sector_code
           WHEN 'BTP'         THEN 'c0000000-0000-4000-8000-0000000000b1'
           WHEN 'AGRICULTURE' THEN 'c0000000-0000-4000-8000-0000000000b2'
           WHEN 'MINES'       THEN 'c0000000-0000-4000-8000-0000000000b4'
           WHEN 'ENERGIE'     THEN 'c0000000-0000-4000-8000-0000000000b4'
           WHEN 'FINANCE'     THEN 'c0000000-0000-4000-8000-0000000000b5'
           ELSE 'c0000000-0000-4000-8000-0000000000b3'
        END)::uuid,
       true, DATE '2022-02-01'
FROM member.organization o
WHERE o.created_by = :seed;

-- ---------------------------------------------------------------------------
-- Appels de cotisation 2026 pour les membres ACTIFS.
-- ---------------------------------------------------------------------------
INSERT INTO contribution.contribution_call
    (created_by, membership_id, fiscal_year_id, call_number, amount_due, currency, due_date, status, balance_amount)
SELECT
    :seed, sub.id, fy.id,
    'AC-2026-' || lpad(sub.rn::text, 4, '0'),
    sub.amount_due, 'XOF', DATE '2026-03-31', 'ISSUED',
    CASE sub.rn % 3 WHEN 0 THEN 0
                    WHEN 1 THEN sub.amount_due
                    ELSE round(sub.amount_due * 0.40) END
FROM (
    SELECT m.id,
           row_number() OVER (ORDER BY m.membership_number) AS rn,
           (1500000 + row_number() OVER (ORDER BY m.membership_number) * 300000)::numeric(19,2) AS amount_due
    FROM member.membership m
    WHERE m.created_by = :seed AND m.status = 'ACTIVE'
) sub
CROSS JOIN (SELECT id FROM contribution.fiscal_year WHERE year = 2026 AND created_by = :seed) fy;

-- ---------------------------------------------------------------------------
-- Références de paiement (1 par membre actif) + transactions réparties sur les
-- 12 derniers mois : alimente le graphe « Évolution des cotisations encaissées »
-- et la table « Derniers paiements enregistrés » du tableau de bord.
-- ---------------------------------------------------------------------------
INSERT INTO payment.payment_reference (created_by, membership_id, reference_value, channel, status)
SELECT :seed, m.id, 'PR-' || m.membership_number, 'BANK_TRANSFER', 'ACTIVE'
FROM member.membership m
WHERE m.created_by = :seed AND m.status = 'ACTIVE';

INSERT INTO payment.payment_transaction
    (created_by, payment_reference_id, transaction_number, channel, amount, currency, paid_at, status, idempotency_key)
SELECT
    :seed,
    t.reference_id,
    'PAY-' || to_char(t.paid_at, 'YYYY-MMDD') || '-' || lpad(t.rn::text, 4, '0'),
    (ARRAY['MOBILE_MONEY','BANK_TRANSFER','CASH'])[1 + (t.rn % 3)],
    t.amount,
    'XOF',
    t.paid_at,
    'RECEIVED',
    gen_random_uuid()::text
FROM (
    SELECT
        pr.id AS reference_id,
        (date_trunc('month', mth) + INTERVAL '13 days')::timestamptz AS paid_at,
        (900000 + (extract(month FROM mth)::int * 110000)
                + (row_number() OVER (ORDER BY pr.reference_value, mth) % 5) * 175000)::numeric(19,2) AS amount,
        row_number() OVER (ORDER BY pr.reference_value, mth) AS rn
    FROM payment.payment_reference pr
    CROSS JOIN generate_series(DATE '2025-08-01', DATE '2026-07-01', INTERVAL '1 month') mth
    WHERE pr.created_by = :seed
) t;

-- Réactivation du garde-fou append-only : hors de ce reset de démonstration, les
-- écritures de paiement redeviennent immuables.
ALTER TABLE payment.payment_transaction ENABLE TRIGGER trg_append_only_payment_payment_transaction;

COMMIT;

-- ---------------------------------------------------------------------------
-- Contrôle
-- ---------------------------------------------------------------------------
SELECT 'organisations'  AS objet, count(*) FROM member.organization         WHERE created_by = :seed
UNION ALL SELECT 'adhésions',        count(*) FROM member.membership         WHERE created_by = :seed
UNION ALL SELECT 'personnes/contacts',count(*) FROM member.organization_contact WHERE created_by = :seed
UNION ALL SELECT 'rattach. groupement',count(*) FROM member.group_membership  WHERE created_by = :seed
UNION ALL SELECT 'groupements',      count(*) FROM member.professional_group WHERE created_by = :seed
UNION ALL SELECT 'appels 2026',      count(*) FROM contribution.contribution_call WHERE created_by = :seed
UNION ALL SELECT 'paiements',        count(*) FROM payment.payment_transaction WHERE created_by = :seed;
