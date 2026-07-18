package ml.cnpm.platform.enrollment.adapter.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data des dossiers d'adhésion. */
interface EnrollmentCaseJpaRepository extends JpaRepository<EnrollmentCaseEntity, UUID> {

    Optional<EnrollmentCaseEntity> findByCaseNumber(String caseNumber);
}
