package ml.cnpm.platform.member.adapter.in.web;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import ml.cnpm.platform.member.application.OrganizationDraft;

/**
 * Corps de création d'une entreprise, aligné sur le schéma {@code OrganizationInput} du
 * contrat. La validation de forme (obligatoires, longueurs, positivité) se fait au bord du
 * système ; le statut initial et le niveau de risque ne sont pas fournis par le client.
 *
 * <p>Les champs de profil (description, coordonnées, indicateurs) sont FACULTATIFS : un
 * prospect en début de démarchage n'a pas toujours toutes les informations.
 */
public record OrganizationInput(
        @NotBlank @Size(max = 255) String legalName,
        @Size(max = 255) String tradeName,
        @NotBlank @Size(max = 40) String organizationType,
        @Size(max = 80) String sectorCode,
        @NotBlank @Size(max = 40) String identifierType,
        @NotBlank @Size(max = 160) String identifierValue,
        @Size(max = 4000) String description,
        @Size(max = 255) String website,
        @Email @Size(max = 320) String email,
        @Size(max = 40) String phone,
        @Size(max = 1000) String address,
        @PositiveOrZero Integer employeeCount,
        @PositiveOrZero @Digits(integer = 17, fraction = 2) BigDecimal capital,
        @PositiveOrZero @Digits(integer = 17, fraction = 2) BigDecimal revenueN1) {

    OrganizationDraft toDraft() {
        return new OrganizationDraft(
                legalName,
                tradeName,
                organizationType,
                sectorCode,
                identifierType,
                identifierValue,
                description,
                website,
                email,
                phone,
                address,
                employeeCount,
                capital,
                revenueN1);
    }
}
