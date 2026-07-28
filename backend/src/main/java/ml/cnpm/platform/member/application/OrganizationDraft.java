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
        java.util.List<String> sectorCodes,
        String identifierType,
        String identifierValue,
        String description,
        String website,
        String email,
        String phone,
        String address,
        Integer employeeCount,
        java.math.BigDecimal capital,
        java.math.BigDecimal revenueN1) {

    /**
     * {@code sectorCodes} n'est jamais nul : un draft sans secteur multi-valué porte une
     * liste vide, ce qui évite aux adaptateurs de reprendre le test de nullité.
     */
    public OrganizationDraft {
        sectorCodes = sectorCodes == null ? java.util.List.of() : java.util.List.copyOf(sectorCodes);
    }
}
