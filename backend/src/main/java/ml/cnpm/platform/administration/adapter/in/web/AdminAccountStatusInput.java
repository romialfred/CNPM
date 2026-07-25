package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Corps de {@code POST /admin/security/accounts/{accountId}/status}.
 *
 * <p>Le motif est obligatoire : une suspension sans raison consignée est une décision
 * qu'on ne peut ni expliquer ni contester plus tard.
 */
public record AdminAccountStatusInput(
        @NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
        @NotBlank @Size(min = 3, max = 1000) String reason) { }
