package ml.cnpm.platform.professionalgroup.application;

import ml.cnpm.platform.professionalgroup.application.port.out.ProfessionalGroupRepository;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cas d'usage de consultation du référentiel des groupements. */
@Service
public class ProfessionalGroupService {

    private final ProfessionalGroupRepository repository;

    public ProfessionalGroupService(ProfessionalGroupRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_GROUP.READ')")
    @Transactional(readOnly = true)
    public PageResult<ProfessionalGroup> list(int page, int size) {
        return repository.findAll(page, size);
    }
}
