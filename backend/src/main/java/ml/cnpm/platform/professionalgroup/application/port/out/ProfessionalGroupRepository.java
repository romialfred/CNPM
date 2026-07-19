package ml.cnpm.platform.professionalgroup.application.port.out;

import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.PageResult;

/** Port sortant de lecture des groupements professionnels. */
public interface ProfessionalGroupRepository {

    PageResult<ProfessionalGroup> findAll(int page, int size);
}
