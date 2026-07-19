package ml.cnpm.platform.contribution.adapter.in.web;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import ml.cnpm.platform.contribution.domain.ContributionRule;

/** Projection HTTP alignee sur le schema OpenAPI {@code Resource}. */
public record ContributionRuleView(
        UUID id,
        String businessReference,
        String status,
        Map<String, Object> attributes,
        AuditView audit) {

    public record AuditView(Instant createdAt, UUID createdBy, Instant updatedAt, long version) {}

    static ContributionRuleView from(ContributionRule value) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("categoryCode", value.categoryCode());
        attributes.put("calculationMethod", value.calculationMethod());
        attributes.put("parameters", value.parameters());
        attributes.put("validFrom", value.validFrom());
        if (value.validTo() != null) {
            attributes.put("validTo", value.validTo());
        }
        return new ContributionRuleView(
                value.id(),
                value.ruleCode(),
                value.status(),
                Map.copyOf(attributes),
                new AuditView(
                        value.createdAt(), value.createdBy(), value.updatedAt(), value.version()));
    }
}
