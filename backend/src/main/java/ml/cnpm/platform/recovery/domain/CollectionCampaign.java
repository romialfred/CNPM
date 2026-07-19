package ml.cnpm.platform.recovery.domain;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Campagne de recouvrement consultable, sans commande de creation ni de lancement. */
public record CollectionCampaign(
        UUID id,
        String campaignCode,
        String name,
        Map<String, Object> targetSegment,
        Instant startAt,
        Instant endAt,
        String status,
        Instant createdAt,
        UUID createdBy,
        Instant updatedAt,
        long version) {}
