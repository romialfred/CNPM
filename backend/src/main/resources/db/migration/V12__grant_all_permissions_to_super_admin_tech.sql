-- Le super-administrateur technique (SUPER_ADMIN_TECH) reçoit TOUTES les permissions :
-- accès sans restriction pour le compte super-admin natif du CNPM (demande explicite).
--
-- Cette migration DÉROGE volontairement à la séparation des tâches qui limitait
-- SUPER_ADMIN_TECH à 4 permissions d'exploitation (DATA.RESTORE, INTEGRATION.REPLAY,
-- OPS.DEPLOY, OPS.MONITOR.READ). La dérogation est tracée dans
-- docs/00-governance/open-decisions.md (AUTH-DEC-021).
--
-- Idempotente : n'insère que les permissions manquantes (pas de doublon), car
-- iam.role_permission n'a d'unicité que sur sa clé technique.
INSERT INTO iam.role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM iam.role r
CROSS JOIN iam.permission p
WHERE r.code = 'SUPER_ADMIN_TECH'
  AND NOT EXISTS (
    SELECT 1
    FROM iam.role_permission rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );
