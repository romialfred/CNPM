package ml.cnpm.platform.contribution.adapter.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Répertoire Spring Data des exercices. */
interface FiscalYearJpaRepository extends JpaRepository<FiscalYearEntity, UUID> {

    Optional<FiscalYearEntity> findByYear(int year);
}
