package ml.cnpm.platform.member.application;

/**
 * Modification partielle d'une entreprise : seuls les champs non {@code null} sont appliqués.
 *
 * <p>Un champ {@code null} signifie « inchangé » (sémantique PATCH du contrat). Ne figurent
 * ici que les champs descriptifs modifiables ; le statut de cycle de vie et le niveau de
 * risque n'y sont pas — ils relèvent de transitions dédiées (historique de statut), pas
 * d'une édition générique. L'identifiant métier, identité de l'entreprise, n'est pas non
 * plus modifiable ici.
 */
public record OrganizationPatch(
        String legalName, String tradeName, String organizationType, String sectorCode) {

    /** Vrai si la modification ne porte réellement aucun changement. */
    public boolean isEmpty() {
        return legalName == null && tradeName == null && organizationType == null && sectorCode == null;
    }
}
