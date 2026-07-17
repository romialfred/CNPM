package ml.cnpm.platform.member.application;

/**
 * Données de création d'une entreprise membre.
 *
 * <p>Le couple ({@code identifierType}, {@code identifierValue}) est l'identifiant métier
 * de l'entreprise : son unicité ({@code uq_member_identifier_type_value}) sert de clé
 * naturelle d'idempotence, faute de magasin de clés générique (DATA-DEC-005). Le statut
 * initial (PROSPECT) et le niveau de risque (NORMAL) ne sont pas fournis par le client :
 * ce sont les valeurs par défaut du schéma, posées par l'adaptateur.
 */
public record OrganizationDraft(
        String legalName,
        String tradeName,
        String organizationType,
        String sectorCode,
        String identifierType,
        String identifierValue) {}
