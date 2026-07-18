package ml.cnpm.platform.enrollment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corps d'une <strong>approbation</strong> d'enrôlement, qui vaut activation du membre.
 *
 * <p>Le numéro d'adhésion et la catégorie de cotisation sont fournis par le décideur : la
 * règle de catégorisation dépend du barème (DEC-008, ouverte) et le format du numéro n'est
 * fixé par aucune source (ENR-DEC-001). Les calculer serait inventer une règle ; les saisir
 * laisse la responsabilité au décideur jusqu'à ce que le barème soit arrêté.
 *
 * <p>Le commentaire est facultatif — une décision favorable n'a pas à être motivée. Le rejet,
 * lui, utilise {@link RejectionInput} qui exige un motif.
 */
public record DecisionInput(
        @NotBlank @Size(max = 60) String membershipNumber,
        @NotBlank @Size(max = 50) String categoryCode,
        @Size(max = 2000) String comment) {}
