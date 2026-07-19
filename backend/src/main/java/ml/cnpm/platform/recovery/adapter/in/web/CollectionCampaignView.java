package ml.cnpm.platform.recovery.adapter.in.web;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import ml.cnpm.platform.recovery.domain.CollectionCampaign;

/** Projection HTTP alignee sur le schema OpenAPI {@code Resource}. */
public record CollectionCampaignView(
        UUID id,
        String businessReference,
        String status,
        Map<String, Object> attributes,
        AuditView audit) {

    public record AuditView(Instant createdAt, UUID createdBy, Instant updatedAt, long version) {}

    static CollectionCampaignView from(CollectionCampaign value) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("name", value.name());
        attributes.put("targetSegment", value.targetSegment());
        attributes.put("startAt", value.startAt());
        if (value.endAt() != null) {
            attributes.put("endAt", value.endAt());
        }
        return new CollectionCampaignView(
                value.id(),
                value.campaignCode(),
                value.status(),
                Map.copyOf(attributes),
                new AuditView(
                        value.createdAt(), value.createdBy(), value.updatedAt(), value.version()));
    }
}
