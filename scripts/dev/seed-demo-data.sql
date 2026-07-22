-- Jeu de données de DÉMONSTRATION pour la base locale (CNPM_DB).
--
-- Données FICTIVES et non nominatives, destinées à voir les écrans peuplés en mode
-- « connexion réelle » (http). Ne jamais utiliser en production.
--
-- Effaçable et rejouable : toutes les lignes portent le marqueur created_by ci-dessous.
-- Ré-exécuter ce script les remplace ; pour tout supprimer, exécuter seulement le bloc
-- « Nettoyage » (ordre FK-safe).
--
-- Usage :
--   psql -h 127.0.0.1 -p 5432 -U app_user -d CNPM_DB -f scripts/dev/seed-demo-data.sql

\set seed '''dddddddd-dddd-dddd-dddd-dddddddddddd'''

BEGIN;

-- ---------------------------------------------------------------------------
-- Nettoyage (idempotence) — ordre FK-safe : appels -> adhésions -> organisations
-- -> groupements -> exercice.
-- ---------------------------------------------------------------------------
DELETE FROM contribution.contribution_call WHERE created_by = :seed;
DELETE FROM member.membership              WHERE created_by = :seed;
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
INSERT INTO member.professional_group (created_by, code, name, sector_code, status) VALUES
 (:seed, 'GRP-BTP',      'Groupement BTP et Travaux Publics', 'BTP',        'ACTIVE'),
 (:seed, 'GRP-AGRO',     'Groupement Agro-industrie',         'AGRICULTURE','ACTIVE'),
 (:seed, 'GRP-COMMERCE', 'Groupement Commerce et Services',   'COMMERCE',   'ACTIVE'),
 (:seed, 'GRP-MINES',    'Groupement Mines et Énergie',       'MINES',      'ACTIVE'),
 (:seed, 'GRP-BANQUE',   'Groupement Banque et Assurances',   'FINANCE',    'ACTIVE');

-- ---------------------------------------------------------------------------
-- Organisations membres (fictives) + adhésions 1:1
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

INSERT INTO member.membership (created_by, organization_id, membership_number, category_code, status, joined_at) VALUES
 (:seed, 'a1111111-0000-4000-8000-000000000001', 'CNPM-2022-0001', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2022-03-14'),
 (:seed, 'a1111111-0000-4000-8000-000000000002', 'CNPM-2022-0002', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2022-05-02'),
 (:seed, 'a1111111-0000-4000-8000-000000000003', 'CNPM-2022-0003', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2022-06-21'),
 (:seed, 'a1111111-0000-4000-8000-000000000004', 'CNPM-2023-0004', 'PME',               'ACTIVE',   DATE '2023-01-10'),
 (:seed, 'a1111111-0000-4000-8000-000000000005', 'CNPM-2023-0005', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2023-02-18'),
 (:seed, 'a1111111-0000-4000-8000-000000000006', 'CNPM-2023-0006', 'PME',               'ACTIVE',   DATE '2023-04-05'),
 (:seed, 'a1111111-0000-4000-8000-000000000007', 'CNPM-2023-0007', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2023-07-30'),
 (:seed, 'a1111111-0000-4000-8000-000000000008', 'CNPM-2024-0008', 'PME',               'ACTIVE',   DATE '2024-01-22'),
 (:seed, 'a1111111-0000-4000-8000-000000000009', 'CNPM-2024-0009', 'GRANDE_ENTREPRISE', 'ACTIVE',   DATE '2024-03-11'),
 (:seed, 'a1111111-0000-4000-8000-000000000010', 'CNPM-2024-0010', 'PME',               'DORMANT',  DATE '2024-05-19'),
 (:seed, 'a1111111-0000-4000-8000-000000000011', 'CNPM-2024-0011', 'TPE',               'DORMANT',  DATE '2024-08-08'),
 (:seed, 'a1111111-0000-4000-8000-000000000012', 'CNPM-2025-0012', 'PME',               'DORMANT',  DATE '2025-01-27'),
 (:seed, 'a1111111-0000-4000-8000-000000000013', 'CNPM-2025-0013', 'TPE',               'PROSPECT', NULL),
 (:seed, 'a1111111-0000-4000-8000-000000000014', 'CNPM-2025-0014', 'TPE',               'PROSPECT', NULL);

-- ---------------------------------------------------------------------------
-- Appels de cotisation 2026 pour les membres ACTIFS.
-- Montants déterministes ; solde restant (balance_amount) mêlant payé / partiel /
-- impayé pour un taux de recouvrement réaliste.
-- ---------------------------------------------------------------------------
INSERT INTO contribution.contribution_call
    (created_by, membership_id, fiscal_year_id, call_number, amount_due, currency, due_date, status, balance_amount)
SELECT
    :seed,
    m.id,
    fy.id,
    'AC-2026-' || lpad(rn::text, 4, '0'),
    amount_due,
    'XOF',
    DATE '2026-03-31',
    'ISSUED',
    CASE rn % 3 WHEN 0 THEN 0                            -- soldé
                WHEN 1 THEN amount_due                    -- impayé
                ELSE round(amount_due * 0.40) END         -- partiel
FROM (
    SELECT m.id,
           row_number() OVER (ORDER BY m.membership_number) AS rn,
           (1500000 + row_number() OVER (ORDER BY m.membership_number) * 300000)::numeric(19,2) AS amount_due
    FROM member.membership m
    WHERE m.created_by = :seed AND m.status = 'ACTIVE'
) m
CROSS JOIN (SELECT id FROM contribution.fiscal_year WHERE year = 2026 AND created_by = :seed) fy;

COMMIT;

-- ---------------------------------------------------------------------------
-- Contrôle
-- ---------------------------------------------------------------------------
SELECT 'organisations' AS objet, count(*) FROM member.organization       WHERE created_by = :seed
UNION ALL SELECT 'adhésions',      count(*) FROM member.membership         WHERE created_by = :seed
UNION ALL SELECT 'groupements',    count(*) FROM member.professional_group WHERE created_by = :seed
UNION ALL SELECT 'appels 2026',    count(*) FROM contribution.contribution_call WHERE created_by = :seed;
