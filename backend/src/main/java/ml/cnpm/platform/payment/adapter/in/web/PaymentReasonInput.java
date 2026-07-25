package ml.cnpm.platform.payment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Corps des opérations n'exigeant qu'un motif — ici la révocation d'une référence. */
public record PaymentReasonInput(@NotBlank @Size(min = 3, max = 1000) String reason) {}
