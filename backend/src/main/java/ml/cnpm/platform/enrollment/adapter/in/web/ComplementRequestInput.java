package ml.cnpm.platform.enrollment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corps d'une demande de complément. ENR-005 impose un motif explicite ; l'échéance n'est
 * pas portée ici, sa durée n'étant fixée par aucune source (différée).
 */
public record ComplementRequestInput(@NotBlank @Size(max = 2000) String comment) {}
