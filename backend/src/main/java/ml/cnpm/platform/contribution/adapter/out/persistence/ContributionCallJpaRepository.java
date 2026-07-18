package ml.cnpm.platform.contribution.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Répertoire Spring Data des appels de cotisation. */
interface ContributionCallJpaRepository extends JpaRepository<ContributionCallEntity, UUID> {

    @Query("select c from ContributionCallEntity c join fetch c.fiscalYear where c.callNumber = :number")
    Optional<ContributionCallEntity> findByCallNumber(@Param("number") String callNumber);

    /** Jointure explicite de l'exercice : évite un N+1 sur la liste des appels d'un membre. */
    @Query(
            "select c from ContributionCallEntity c join fetch c.fiscalYear "
                    + "where c.membershipId = :membershipId order by c.dueDate desc, c.callNumber asc")
    List<ContributionCallEntity> findByMembership(@Param("membershipId") UUID membershipId);
}
