package ml.cnpm.platform.integration.domain;

import java.time.Instant;
import java.util.UUID;

/** Partenaire externe consultable par l'exploitation, sans sa configuration sensible. */
public record IntegrationPartner(
        UUID id,
        String partnerCode,
        String name,
        String partnerType,
        String status,
        Instant createdAt,
        UUID createdBy,
        Instant updatedAt,
        long version) {}
