package ml.cnpm.platform.integration.adapter.in.web;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import ml.cnpm.platform.integration.domain.IntegrationPartner;

/** Projection HTTP alignee sur le schema OpenAPI generique {@code Resource}. */
public record IntegrationPartnerView(
        UUID id,
        String businessReference,
        String status,
        Map<String, Object> attributes,
        IntegrationPartnerAuditView audit) {

    static IntegrationPartnerView from(IntegrationPartner value) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("name", value.name());
        attributes.put("partnerType", value.partnerType());
        return new IntegrationPartnerView(
                value.id(),
                value.partnerCode(),
                value.status(),
                Map.copyOf(attributes),
                IntegrationPartnerAuditView.from(value));
    }
}
