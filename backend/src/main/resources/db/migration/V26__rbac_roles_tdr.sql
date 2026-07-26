-- V26__rbac_roles_tdr.sql
--
-- Refonte RBAC : réduire le catalogue de rôles au périmètre réellement demandé par le TDR,
-- augmenté d'un rôle ADMINISTRATEUR (tous droits). Les rôles CONSERVÉS sont :
--   ADMINISTRATEUR (nouveau), AGENT_RECOUVREMENT, RESPONSABLE_GROUPEMENT,
--   REFERENT_GROUPEMENT, MEMBRE_ADMIN, MEMBRE_UTILISATEUR.
-- Les 14 autres rôles de la matrice RBAC de conception sont retirés.
--
-- Les 66 CODES de permission restent inchangés (ils sont câblés dans les @PreAuthorize et le
-- portail membre) : seuls les RÔLES et leurs OCTROIS évoluent. La grille d'octroi de l'écran
-- Sécurité regroupe désormais ces codes par module du sidebar (côté présentation).
--
-- Le compte d'amorçage (NativeAdminBootstrap) voit son rôle réconcilié vers ADMINISTRATEUR au
-- démarrage : la suppression de ses anciens rôles ici est donc sans effet durable sur son accès.

-- 1) Rôle ADMINISTRATEUR + octroi de TOUTES les permissions.
INSERT INTO iam.role (code, label, privileged)
VALUES ('ADMINISTRATEUR', 'Administrateur CNPM', true)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, privileged = true;

INSERT INTO iam.role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM iam.role r
CROSS JOIN iam.permission p
WHERE r.code = 'ADMINISTRATEUR'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 2) Retirer les rôles hors périmètre : d'abord leurs octrois et affectations, puis le rôle.
DELETE FROM iam.role_permission
WHERE role_id IN (
    SELECT id FROM iam.role
    WHERE code NOT IN (
        'ADMINISTRATEUR', 'AGENT_RECOUVREMENT', 'RESPONSABLE_GROUPEMENT',
        'REFERENT_GROUPEMENT', 'MEMBRE_ADMIN', 'MEMBRE_UTILISATEUR'
    )
);

DELETE FROM iam.user_role
WHERE role_id IN (
    SELECT id FROM iam.role
    WHERE code NOT IN (
        'ADMINISTRATEUR', 'AGENT_RECOUVREMENT', 'RESPONSABLE_GROUPEMENT',
        'REFERENT_GROUPEMENT', 'MEMBRE_ADMIN', 'MEMBRE_UTILISATEUR'
    )
);

DELETE FROM iam.role
WHERE code NOT IN (
    'ADMINISTRATEUR', 'AGENT_RECOUVREMENT', 'RESPONSABLE_GROUPEMENT',
    'REFERENT_GROUPEMENT', 'MEMBRE_ADMIN', 'MEMBRE_UTILISATEUR'
);
