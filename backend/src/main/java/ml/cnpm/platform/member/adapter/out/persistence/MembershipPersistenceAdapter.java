package ml.cnpm.platform.member.adapter.out.persistence;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import ml.cnpm.platform.member.application.MembershipQuery;
import ml.cnpm.platform.member.application.port.out.MembershipRepository;
import ml.cnpm.platform.member.domain.Membership;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

/**
 * Adaptateur de persistance des adhésions : filtres dynamiques, recherche sur le numéro
 * ou la raison sociale (métacaractères LIKE échappés), tri borné, pagination.
 *
 * <p>L'entreprise est jointe explicitement (fetch) sur les requêtes de contenu pour éviter
 * un N+1, mais pas sur la requête de comptage — un fetch dans un {@code count(...)}
 * échouerait. Le tri par nom d'entreprise passe par la relation.
 */
@Repository
class MembershipPersistenceAdapter implements MembershipRepository {

    /** Clés de tri exposées → chemin de propriété. */
    private static final Map<String, String> SORTABLE =
            Map.of(
                    "membershipNumber", "membershipNumber",
                    "status", "status",
                    "organizationLegalName", "organization.legalName");

    private final MembershipJpaRepository jpaRepository;

    MembershipPersistenceAdapter(MembershipJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PageResult<Membership> search(MembershipQuery query) {
        Pageable pageable = PageRequest.of(query.page(), query.size(), sort(query.sort()));
        Page<MembershipEntity> result = jpaRepository.findAll(toSpecification(query), pageable);
        return new PageResult<>(
                result.getContent().stream().map(MembershipPersistenceAdapter::toDomain).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static Specification<MembershipEntity> toSpecification(MembershipQuery query) {
        return (root, criteriaQuery, builder) -> {
            // Jointure explicite vers l'entreprise. Sur la requête de comptage, un fetch
            // n'a pas de sens (et échoue) : on se contente alors d'une jointure ordinaire.
            Join<MembershipEntity, OrganizationEntity> organization;
            boolean counting = Long.class.equals(criteriaQuery.getResultType());
            if (counting) {
                organization = root.join("organization", JoinType.INNER);
            } else {
                // Le Fetch renvoyé par Hibernate EST un Join, mais les signatures
                // génériques imposent le passage par Object.
                @SuppressWarnings("unchecked")
                Join<MembershipEntity, OrganizationEntity> fetched =
                        (Join<MembershipEntity, OrganizationEntity>)
                                (Object) root.fetch("organization", JoinType.INNER);
                organization = fetched;
            }

            List<Predicate> predicates = new ArrayList<>();
            if (hasText(query.status())) {
                predicates.add(builder.equal(root.get("status"), query.status()));
            }
            if (hasText(query.categoryCode())) {
                predicates.add(builder.equal(root.get("categoryCode"), query.categoryCode()));
            }
            if (hasText(query.search())) {
                String pattern = "%" + escapeLike(query.search().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(
                        builder.or(
                                builder.like(builder.lower(root.get("membershipNumber")), pattern, '\\'),
                                builder.like(builder.lower(organization.get("legalName")), pattern, '\\')));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Sort sort(String requested) {
        Sort.Order tieBreaker = Sort.Order.asc("id");
        if (!hasText(requested)) {
            return Sort.by(Sort.Order.asc("membershipNumber"), tieBreaker);
        }
        String[] parts = requested.split(",", 2);
        String field = SORTABLE.get(parts[0].trim());
        if (field == null) {
            return Sort.by(Sort.Order.asc("membershipNumber"), tieBreaker);
        }
        boolean descending = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
        Sort.Order primary = descending ? Sort.Order.desc(field) : Sort.Order.asc(field);
        return Sort.by(primary, tieBreaker);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static Membership toDomain(MembershipEntity entity) {
        OrganizationEntity organization = entity.getOrganization();
        return new Membership(
                entity.getId(),
                entity.getMembershipNumber(),
                organization.getId(),
                organization.getLegalName(),
                entity.getCategoryCode(),
                entity.getStatus(),
                entity.getJoinedAt(),
                entity.getVersion());
    }
}
