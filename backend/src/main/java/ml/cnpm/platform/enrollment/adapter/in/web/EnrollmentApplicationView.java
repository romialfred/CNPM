package ml.cnpm.platform.enrollment.adapter.in.web;

import java.time.Instant;
import java.util.UUID;
import ml.cnpm.platform.enrollment.domain.EnrollmentCase;

/** Projection de sortie d'un dossier d'adhésion, alignée sur le schéma du contrat. */
public record EnrollmentApplicationView(
        UUID id,
        String caseNumber,
        UUID organizationId,
        String channel,
        String status,
        Instant submittedAt,
        UUID assignedTo,
        long version) {

    static EnrollmentApplicationView from(EnrollmentCase value) {
        return new EnrollmentApplicationView(
                value.id(),
                value.caseNumber(),
                value.organizationId(),
                value.channel(),
                value.status().name(),
                value.submittedAt(),
                value.assignedTo(),
                value.version());
    }
}
