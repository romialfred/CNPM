package ml.cnpm.platform.recovery.application.port.out;

import ml.cnpm.platform.recovery.domain.CollectionCampaign;
import ml.cnpm.platform.shared.api.PageResult;

/** Port sortant de lecture des campagnes de recouvrement. */
public interface CollectionCampaignRepository {

    PageResult<CollectionCampaign> findAll(int page, int size);
}
