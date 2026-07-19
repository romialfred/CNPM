package ml.cnpm.platform.integration.adapter.in.web;

import java.time.Instant;
import java.util.UUID;
import ml.cnpm.platform.integration.domain.IntegrationPartner;

/** Champs d'audit exposes par le schema OpenAPI {@code AuditFields}. */
public record IntegrationPartnerAuditView(
        Instant createdAt, UUID createdBy, Instant updatedAt, long version) {

    static IntegrationPartnerAuditView from(IntegrationPartner value) {
        return new IntegrationPartnerAuditView(
                value.createdAt(), value.createdBy(), value.updatedAt(), value.version());
    }
}
