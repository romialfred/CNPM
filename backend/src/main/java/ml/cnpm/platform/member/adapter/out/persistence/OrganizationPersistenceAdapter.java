package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.member.application.OrganizationQuery;
import ml.cnpm.platform.member.application.port.out.OrganizationRepository;
import ml.cnpm.platform.member.domain.Organization;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur de persistance : filtres dynamiques, tri borné et pagination via Spring
 * Data, puis traduction de l'entité vers le domaine.
 *
 * <p>Le tri n'accepte que des champs explicitement autorisés : accepter un nom de colonne
 * arbitraire depuis la requête exposerait le modèle interne et ouvrirait une injection
 * par nom de propriété. Un identifiant technique complète toujours l'ordre, faute de quoi
 * deux valeurs de même clé de tri se répartiraient de façon instable entre les pages.
 */
@Repository
class OrganizationPersistenceAdapter implements OrganizationRepository {

    /** Clés de tri exposées → propriété d'entité correspondante. */
    private static final Map<String, String> SORTABLE =
            Map.of("legalName", "legalName", "status", "status");

    private final OrganizationJpaRepository jpaRepository;

    OrganizationPersistenceAdapter(OrganizationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PageResult<Organization> search(OrganizationQuery query) {
        Pageable pageable = PageRequest.of(query.page(), query.size(), sort(query.sort()));
        Page<OrganizationEntity> result = jpaRepository.findAll(toSpecification(query), pageable);
        return new PageResult<>(
                result.getContent().stream().map(OrganizationPersistenceAdapter::toDomain).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Override
    public Optional<Organization> findById(UUID id) {
        return jpaRepository.findById(id).map(OrganizationPersistenceAdapter::toDomain);
    }

    private static Specification<OrganizationEntity> toSpecification(OrganizationQuery query) {
        return (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (hasText(query.status())) {
                predicates.add(builder.equal(root.get("status"), query.status()));
            }
            if (hasText(query.organizationType())) {
                predicates.add(builder.equal(root.get("organizationType"), query.organizationType()));
            }
            if (hasText(query.sectorCode())) {
                predicates.add(builder.equal(root.get("sectorCode"), query.sectorCode()));
            }
            if (hasText(query.search())) {
                // Les métacaractères LIKE de la saisie sont échappés : sans cela, « 100% »
                // ou « a_b » verraient leurs `%`/`_` interprétés comme jokers, et la
                // recherche ne ferait pas ce que l'utilisateur demande.
                String pattern = "%" + escapeLike(query.search().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(
                        builder.or(
                                builder.like(builder.lower(root.get("legalName")), pattern, '\\'),
                                builder.like(builder.lower(root.get("tradeName")), pattern, '\\')));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Sort sort(String requested) {
        Sort.Order tieBreaker = Sort.Order.asc("id");
        if (!hasText(requested)) {
            return Sort.by(Sort.Order.asc("legalName"), tieBreaker);
        }
        String[] parts = requested.split(",", 2);
        String field = SORTABLE.get(parts[0].trim());
        if (field == null) {
            // Clé de tri non autorisée : ordre stable par défaut plutôt qu'une erreur.
            return Sort.by(Sort.Order.asc("legalName"), tieBreaker);
        }
        boolean descending = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
        Sort.Order primary = descending ? Sort.Order.desc(field) : Sort.Order.asc(field);
        return Sort.by(primary, tieBreaker);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    /** Échappe les métacaractères LIKE (\, %, _) avec l'antislash comme caractère d'échappement. */
    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static Organization toDomain(OrganizationEntity entity) {
        return new Organization(
                entity.getId(),
                entity.getLegalName(),
                entity.getTradeName(),
                entity.getOrganizationType(),
                entity.getSectorCode(),
                entity.getStatus(),
                entity.getRiskLevel(),
                entity.getVersion());
    }
}
