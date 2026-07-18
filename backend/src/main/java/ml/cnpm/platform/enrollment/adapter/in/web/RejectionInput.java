package ml.cnpm.platform.enrollment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corps d'un rejet d'enrôlement.
 *
 * <p>Le motif est <strong>obligatoire</strong> : le contrat intitule l'opération « rejeter
 * avec motif », et une décision défavorable non motivée n'est pas opposable au demandeur.
 * {@code reasonCode} reste en revanche libre — le référentiel des motifs n'est pas fourni par
 * les sources (ENR-DEC-001) ; c'est la nomenclature qui est différée, pas l'exigence de motif.
 */
public record RejectionInput(
        @Size(max = 60) String reasonCode, @NotBlank @Size(max = 2000) String comment) {}
