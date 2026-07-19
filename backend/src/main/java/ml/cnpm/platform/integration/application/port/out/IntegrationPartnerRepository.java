package ml.cnpm.platform.integration.application.port.out;

import ml.cnpm.platform.integration.domain.IntegrationPartner;
import ml.cnpm.platform.shared.api.PageResult;

/** Port sortant de lecture des partenaires d'integration. */
public interface IntegrationPartnerRepository {

    PageResult<IntegrationPartner> findAll(int page, int size);
}
