-- V24__user_account_avatar.sql
--
-- Photo de profil du compte. Le membre peut la changer depuis son espace.
--
-- L'image est stockée en base (petit format borné côté service), avec son type et l'horodatage
-- du dernier changement. C'est une donnée personnelle non critique ; en attendant la GED
-- (Lot 0), ce stockage direct est le plus simple et reste sous le contrôle du titulaire.

ALTER TABLE iam.user_account ADD COLUMN avatar_content bytea;
ALTER TABLE iam.user_account ADD COLUMN avatar_content_type varchar(60);
ALTER TABLE iam.user_account ADD COLUMN avatar_updated_at timestamptz;

COMMENT ON COLUMN iam.user_account.avatar_content IS
    'Photo de profil (image bornée) ; NULL si aucune photo.';
COMMENT ON COLUMN iam.user_account.avatar_content_type IS
    'Type MIME de la photo (image/png, image/jpeg, image/webp).';
COMMENT ON COLUMN iam.user_account.avatar_updated_at IS
    'Horodatage du dernier changement de photo.';
