package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corps des opérations sensibles n'exigeant qu'un motif — aujourd'hui la
 * réinitialisation d'un second facteur.
 */
public record AdminReasonInput(@NotBlank @Size(min = 3, max = 1000) String reason) { }
