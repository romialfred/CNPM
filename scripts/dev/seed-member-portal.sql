-- Jeu de données FICTIVES pour l'espace membre et l'historique de cotisations.
--
-- Complète `scripts/dev/seed-demo-data.sql` (organisations, adhésions, groupements,
-- contacts, exercice 2026), qu'il faut avoir exécuté AVANT celui-ci.
--
-- Aucune entreprise réelle n'est nommée et aucune donnée nominative n'est utilisée
-- (`.claude/rules/testing.md`). Les raisons sociales sont inventées ; seules les GRANDEURS
-- sont calées sur les chiffres publiés dans les TDR, pour que les écrans montrent une
-- situation crédible plutôt que des montants arbitraires :
--
--   * cotisations encaissées 781 MFCFA en 2023, 720 MFCFA en 2024, 361 MFCFA en 2025
--     (TDR § I — « érosion significative du niveau global des cotisations ») ;
--   * les cinq premiers contributeurs pèsent plus de 80 % du total 2024
--     (TDR § I — « forte concentration des cotisations ») ;
--   * les cotisants dormants cotisent en 2023 et 2024 puis cessent : c'est exactement la
--     catégorie « anciens cotisants ayant cessé de payer » du TDR § III.2.4, et c'est ce
--     qui produit l'effondrement de 2025.
--
-- AUCUN MOT DE PASSE n'est semé : les comptes membres créés ici naissent sans secret et
-- sans second facteur, donc « invités ». Un mot de passe se pose hors du dépôt, par le
-- parcours de création de compte de la plateforme — un secret versionné resterait un
-- secret exposé (`.claude/rules/security.md`).
--
-- Rejouable : le bloc de nettoyage retire les lignes portant le marqueur ci-dessous.
--
-- Usage :
--   psql -h 127.0.0.1 -p 5432 -U app_user -d CNPM_DB -f scripts/dev/seed-demo-data.sql
--   psql -h 127.0.0.1 -p 5432 -U app_user -d CNPM_DB -f scripts/dev/seed-member-portal.sql

\set seed '''dddddddd-dddd-dddd-dddd-dddddddddddd'''

BEGIN;

-- ---------------------------------------------------------------------------
-- Nettoyage (idempotence), dans l'ordre des dépendances.
--
-- contribution.adjustment est en AJOUT SEUL (V4) : la protection est désactivée le temps
-- de ce reset de développement, puis RÉACTIVÉE avant COMMIT. Ne jamais faire cela en
-- production — un ajustement financier validé y est immuable et se corrige par une
-- écriture compensatrice.
-- ---------------------------------------------------------------------------
ALTER TABLE contribution.adjustment DISABLE TRIGGER trg_append_only_contribution_adjustment;

DELETE FROM contribution.adjustment a
 USING contribution.contribution_call c
 WHERE a.contribution_call_id = c.id AND c.created_by = :seed;

DELETE FROM contribution.installment i
 USING contribution.contribution_call c
 WHERE i.contribution_call_id = c.id AND c.created_by = :seed;

DELETE FROM contribution.contribution_call WHERE created_by = :seed;
DELETE FROM iam.user_account WHERE created_by = :seed;
DELETE FROM contribution.fiscal_year WHERE created_by = :seed AND year IN (2023, 2024, 2025);

-- ---------------------------------------------------------------------------
-- Exercices antérieurs. L'exercice 2026 est créé par le script de base.
-- ---------------------------------------------------------------------------
INSERT INTO contribution.fiscal_year (created_by, year, start_date, end_date, status) VALUES
 (:seed, 2023, DATE '2023-01-01', DATE '2023-12-31', 'CLOSED'),
 (:seed, 2024, DATE '2024-01-01', DATE '2024-12-31', 'CLOSED'),
 (:seed, 2025, DATE '2025-01-01', DATE '2025-12-31', 'CLOSED');

-- ---------------------------------------------------------------------------
-- Appels de cotisation 2023 → 2026.
--
-- `rang` classe les adhésions par numéro d'adhésion : le rang 1 est le premier grand
-- cotisant. Les montants par (exercice, rang) sont explicites plutôt que calculés, pour
-- que les totaux tombent EXACTEMENT sur les chiffres des TDR et restent vérifiables ligne
-- à ligne.
--
-- `solde` porte le reste dû : 0 pour un exercice clos et encaissé, une valeur non nulle
-- seulement sur l'exercice courant.
-- ---------------------------------------------------------------------------
WITH adhesion AS (
    SELECT m.id,
           m.status,
           row_number() OVER (ORDER BY m.membership_number) AS rang
    FROM member.membership m
    WHERE m.created_by = :seed AND m.status IN ('ACTIVE', 'DORMANT')
),
bareme (exercice, rang, montant, solde, echeance) AS (VALUES
    -- 2023 — 781 MFCFA encaissés, douze cotisants (actifs et futurs dormants).
    (2023,  1, 190000000, 0, DATE '2023-03-31'),
    (2023,  2, 158000000, 0, DATE '2023-03-31'),
    (2023,  3, 130000000, 0, DATE '2023-03-31'),
    (2023,  4, 103000000, 0, DATE '2023-03-31'),
    (2023,  5,  65000000, 0, DATE '2023-03-31'),
    (2023,  6,  32000000, 0, DATE '2023-03-31'),
    (2023,  7,  27000000, 0, DATE '2023-03-31'),
    (2023,  8,  24000000, 0, DATE '2023-03-31'),
    (2023,  9,  20000000, 0, DATE '2023-03-31'),
    (2023, 10,  15000000, 0, DATE '2023-03-31'),
    (2023, 11,  11000000, 0, DATE '2023-03-31'),
    (2023, 12,   6000000, 0, DATE '2023-03-31'),
    -- 2024 — 720 MFCFA ; les cinq premiers pèsent 595 MFCFA, soit 82,6 %.
    (2024,  1, 175000000, 0, DATE '2024-03-31'),
    (2024,  2, 145000000, 0, DATE '2024-03-31'),
    (2024,  3, 120000000, 0, DATE '2024-03-31'),
    (2024,  4,  95000000, 0, DATE '2024-03-31'),
    (2024,  5,  60000000, 0, DATE '2024-03-31'),
    (2024,  6,  30000000, 0, DATE '2024-03-31'),
    (2024,  7,  25000000, 0, DATE '2024-03-31'),
    (2024,  8,  22000000, 0, DATE '2024-03-31'),
    (2024,  9,  18000000, 0, DATE '2024-03-31'),
    (2024, 10,  14000000, 0, DATE '2024-03-31'),
    (2024, 11,  10000000, 0, DATE '2024-03-31'),
    (2024, 12,   6000000, 0, DATE '2024-03-31'),
    -- 2025 — 361 MFCFA : les rangs 10 à 12 (dormants) ne cotisent plus.
    (2025,  1,  95000000, 0, DATE '2025-03-31'),
    (2025,  2,  78000000, 0, DATE '2025-03-31'),
    (2025,  3,  62000000, 0, DATE '2025-03-31'),
    (2025,  4,  48000000, 0, DATE '2025-03-31'),
    (2025,  5,  30000000, 0, DATE '2025-03-31'),
    (2025,  6,  16000000, 0, DATE '2025-03-31'),
    (2025,  7,  13000000, 0, DATE '2025-03-31'),
    (2025,  8,  11000000, 0, DATE '2025-03-31'),
    (2025,  9,   8000000, 0, DATE '2025-03-31'),
    -- 2026 — exercice en cours. Le solde et l'échéance couvrent les quatre états de
    -- l'écran membre : réglée, partielle, à échoir, en retard (dont un retard partiel,
    -- qui doit se lire « en retard » et non « partielle ».)
    (2026,  1, 110000000,         0, DATE '2026-03-31'),
    (2026,  2,  90000000,  45000000, DATE '2026-12-31'),
    (2026,  3,  70000000,  70000000, DATE '2026-12-31'),
    (2026,  4,  55000000,  55000000, DATE '2026-03-31'),
    (2026,  5,  35000000,  17500000, DATE '2026-03-31'),
    (2026,  6,  20000000,         0, DATE '2026-03-31'),
    (2026,  7,  16000000,         0, DATE '2026-03-31'),
    (2026,  8,  14000000,         0, DATE '2026-03-31'),
    (2026,  9,  10000000,         0, DATE '2026-03-31')
)
INSERT INTO contribution.contribution_call
    (created_by, membership_id, fiscal_year_id, call_number, amount_due, currency,
     due_date, status, balance_amount)
SELECT :seed,
       a.id,
       fy.id,
       'AC-' || b.exercice || '-' || lpad(b.rang::text, 4, '0'),
       b.montant::numeric(19,2),
       'XOF',
       b.echeance,
       CASE WHEN b.solde = 0 THEN 'SETTLED' ELSE 'ISSUED' END,
       b.solde::numeric(19,2)
FROM bareme b
JOIN adhesion a ON a.rang = b.rang
JOIN contribution.fiscal_year fy ON fy.year = b.exercice;

-- ---------------------------------------------------------------------------
-- Échéancier : deux échéances par appel, la seconde portant le reste dû.
-- Le montant réglé se déduit du solde de l'appel — l'échéancier ne peut donc pas
-- contredire le total affiché juste au-dessus de lui.
-- ---------------------------------------------------------------------------
INSERT INTO contribution.installment
    (created_by, contribution_call_id, installment_no, due_date, amount_due, amount_paid, status)
SELECT :seed, c.id, 1,
       c.due_date - INTERVAL '60 days',
       round(c.amount_due / 2, 2),
       least(round(c.amount_due / 2, 2), c.amount_due - c.balance_amount),
       CASE WHEN c.amount_due - c.balance_amount >= round(c.amount_due / 2, 2)
            THEN 'SETTLED' ELSE 'PENDING' END
FROM contribution.contribution_call c
WHERE c.created_by = :seed;

INSERT INTO contribution.installment
    (created_by, contribution_call_id, installment_no, due_date, amount_due, amount_paid, status)
SELECT :seed, c.id, 2,
       c.due_date,
       c.amount_due - round(c.amount_due / 2, 2),
       greatest((c.amount_due - c.balance_amount) - round(c.amount_due / 2, 2), 0),
       CASE WHEN c.balance_amount = 0 THEN 'SETTLED' ELSE 'PENDING' END
FROM contribution.contribution_call c
WHERE c.created_by = :seed;

-- ---------------------------------------------------------------------------
-- Ajustements sur l'exercice courant : une remise accordée et une régularisation.
-- Le vocabulaire CREDIT/DEBIT est celui du modèle de données (V1).
-- ---------------------------------------------------------------------------
INSERT INTO contribution.adjustment
    (created_by, contribution_call_id, adjustment_number, adjustment_type, amount, reason_code)
SELECT :seed, c.id, 'AJ-2026-0001', 'CREDIT', 2500000.00, 'REMISE_COMMERCIALE'
FROM contribution.contribution_call c
WHERE c.created_by = :seed AND c.call_number = 'AC-2026-0002';

INSERT INTO contribution.adjustment
    (created_by, contribution_call_id, adjustment_number, adjustment_type, amount, reason_code)
SELECT :seed, c.id, 'AJ-2026-0002', 'DEBIT', 1200000.00, 'REGULARISATION_BAREME'
FROM contribution.contribution_call c
WHERE c.created_by = :seed AND c.call_number = 'AC-2026-0005';

-- ---------------------------------------------------------------------------
-- Comptes membres rattachés à une adhésion.
--
-- Sans ce rattachement (`member_id`, V17), l'espace membre ne peut résoudre aucun
-- périmètre et répond 404 : c'est la clé de voûte du cloisonnement entre adhérents.
-- Trois comptes suffisent à éprouver le cloisonnement : deux adhérents distincts et un
-- agent professionnel qui ne doit voir aucun portail membre.
--
-- Adresses en `.test` (TLD réservé, jamais routable) : aucun message ne peut partir vers
-- une boîte réelle depuis un environnement de développement.
-- ---------------------------------------------------------------------------
INSERT INTO iam.user_account
    (created_by, email, display_name, first_name, last_name, account_type, member_id, status)
SELECT :seed,
       'membre' || a.rang || '@cnpm-portail.test',
       'Adhérent de test ' || a.rang,
       'Adhérent',
       'Test ' || a.rang,
       'MEMBER',
       a.id,
       'ACTIVE'
FROM (
    SELECT m.id, row_number() OVER (ORDER BY m.membership_number) AS rang
    FROM member.membership m
    WHERE m.created_by = :seed AND m.status = 'ACTIVE'
) a
WHERE a.rang <= 2;

INSERT INTO iam.user_account
    (created_by, email, display_name, first_name, last_name, account_type, status)
VALUES (:seed, 'agent@cnpm-portail.test', 'Agent de recouvrement', 'Agent', 'Recouvrement',
        'PROFESSIONAL', 'ACTIVE');

-- Rôle des comptes membres : lecture de leurs propres cotisations (V3, MEMBRE_UTILISATEUR).
INSERT INTO iam.user_role (created_by, user_id, role_id)
SELECT :seed, u.id, r.id
FROM iam.user_account u
CROSS JOIN iam.role r
WHERE u.created_by = :seed AND u.account_type = 'MEMBER' AND r.code = 'MEMBRE_UTILISATEUR';

-- ---------------------------------------------------------------------------
-- Deux adhésions de l'année en cours (2026), pour illustrer la tuile « Nouveaux
-- membres » du répertoire. Nouvelles entreprises fictives, jamais nominatives.
-- Idempotent : réinsère seulement si l'entreprise n'existe pas déjà.
-- ---------------------------------------------------------------------------
INSERT INTO member.organization (created_by, legal_name, trade_name, organization_type, sector_code, status)
SELECT :seed, v.legal_name, v.trade_name, 'SARL', v.sector, 'ACTIVE'
FROM (VALUES
  ('Fintech Sahel Services SARL', 'FINSAHEL',  'SERVICES'),
  ('Agro-Transformation Kayes SARL', 'AGROKAYES', 'AGRICULTURE')
) AS v(legal_name, trade_name, sector)
WHERE NOT EXISTS (SELECT 1 FROM member.organization o WHERE o.legal_name = v.legal_name);

INSERT INTO member.membership (created_by, organization_id, membership_number, category_code, status, joined_at)
SELECT :seed, o.id,
       'CNPM-2026-' || lpad((900 + row_number() OVER (ORDER BY o.legal_name))::text, 4, '0'),
       'PME', 'ACTIVE', DATE '2026-02-15'
FROM member.organization o
WHERE o.legal_name IN ('Fintech Sahel Services SARL', 'Agro-Transformation Kayes SARL')
  AND NOT EXISTS (SELECT 1 FROM member.membership m WHERE m.organization_id = o.id);

ALTER TABLE contribution.adjustment ENABLE TRIGGER trg_append_only_contribution_adjustment;

COMMIT;

-- ---------------------------------------------------------------------------
-- Contrôle — les totaux doivent reproduire les chiffres des TDR.
-- ---------------------------------------------------------------------------
SELECT fy.year AS exercice,
       count(*) AS appels,
       to_char(sum(c.amount_due), 'FM999G999G999G999') AS total_appele,
       to_char(sum(c.amount_due - c.balance_amount), 'FM999G999G999G999') AS total_encaisse
FROM contribution.contribution_call c
JOIN contribution.fiscal_year fy ON fy.id = c.fiscal_year_id
WHERE c.created_by = :seed
GROUP BY fy.year
ORDER BY fy.year;

SELECT 'part des 5 premiers en 2024 (%)' AS controle,
       round(100.0 * sum(top5.amount_due) / (
           SELECT sum(c2.amount_due) FROM contribution.contribution_call c2
           JOIN contribution.fiscal_year f2 ON f2.id = c2.fiscal_year_id
           WHERE c2.created_by = :seed AND f2.year = 2024), 1) AS valeur
FROM (
    SELECT c.amount_due
    FROM contribution.contribution_call c
    JOIN contribution.fiscal_year fy ON fy.id = c.fiscal_year_id
    WHERE c.created_by = :seed AND fy.year = 2024
    ORDER BY c.amount_due DESC
    LIMIT 5
) top5;

SELECT 'comptes membres rattachés' AS controle, count(*) AS valeur
FROM iam.user_account WHERE created_by = :seed AND member_id IS NOT NULL;
