package ml.cnpm.platform.professionalgroup.application.port.out;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.PageResult;

/** Port sortant de lecture et d'écriture des groupements professionnels. */
public interface ProfessionalGroupRepository {

    PageResult<ProfessionalGroup> findAll(int page, int size);

    Optional<ProfessionalGroup> findById(UUID id);

    /** Vrai si un groupement porte déjà ce code (unicité métier). */
    boolean existsByCode(String code);

    /** Insère un nouveau groupement et restitue sa projection de domaine. */
    ProfessionalGroup create(String code, String name, String sectorCode, String status);
}
