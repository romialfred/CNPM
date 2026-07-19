package ml.cnpm.platform.contribution.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Version de bareme consultable, sans operation de publication ni de calcul. */
public record ContributionRule(
        UUID id,
        String ruleCode,
        String categoryCode,
        String calculationMethod,
        Map<String, Object> parameters,
        LocalDate validFrom,
        LocalDate validTo,
        String status,
        Instant createdAt,
        UUID createdBy,
        Instant updatedAt,
        long version) {}
