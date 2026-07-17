package ml.cnpm.platform.administration.application;

/**
 * Données de création d'une valeur de référentiel, validées au bord du système.
 *
 * <p>Le domaine et le code forment l'identité métier ; le service en fait la clé
 * d'idempotence, faute de magasin de clés d'idempotence dans le modèle de données
 * (voir DATA-DEC-005).
 */
public record ReferenceValueDraft(
        String domain, String code, String label, int sortOrder, boolean active) {}
