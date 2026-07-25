package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Corps de {@code POST /payment-references} : la référence se génère POUR un cotisant et un
 * exercice. La borne fine de l'exercice est vérifiée au service ; la forme l'est ici.
 */
public record PaymentReferenceInput(
        @NotNull UUID membershipId, @NotNull @Min(2000) @Max(2100) Integer exercise) {}
