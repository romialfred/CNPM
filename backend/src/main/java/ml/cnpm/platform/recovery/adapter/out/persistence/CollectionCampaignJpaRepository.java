package ml.cnpm.platform.recovery.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface CollectionCampaignJpaRepository
        extends JpaRepository<CollectionCampaignEntity, UUID> {}
