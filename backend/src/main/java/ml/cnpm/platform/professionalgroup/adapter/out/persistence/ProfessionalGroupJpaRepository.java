package ml.cnpm.platform.professionalgroup.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data interne du module GROUP. */
interface ProfessionalGroupJpaRepository extends JpaRepository<ProfessionalGroupEntity, UUID> {}
