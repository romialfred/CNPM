package ml.cnpm.platform.member.adapter.out.persistence;

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
 * Adaptateur de persistance des adhésions, sur la vue {@code member.membership_list}.
 *
 * <p>La vue résout déjà, par ligne, la raison sociale de l'entreprise et le groupement
 * principal : l'adaptateur n'a donc qu'à filtrer, trier (en liste blanche) et paginer sur
 * des colonnes scalaires. Une ligne par adhésion : ni jointure fetch, ni N+1. Les
 * métacaractères LIKE de la recherche sont échappés.
 */
@Repository
class MembershipPersistenceAdapter implements MembershipRepository {

    /** Clés de tri exposées → propriété de l'entité de vue. */
    private static final Map<String, String> SORTABLE =
            Map.of(
                    "membershipNumber", "membershipNumber",
                    "status", "status",
                    "organizationLegalName", "organizationLegalName",
                    "primaryGroupName", "primaryGroupName");

    private final MembershipListJpaRepository jpaRepository;

    MembershipPersistenceAdapter(MembershipListJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PageResult<Membership> search(MembershipQuery query) {
        Pageable pageable = PageRequest.of(query.page(), query.size(), sort(query.sort()));
        Page<MembershipListEntity> result = jpaRepository.findAll(toSpecification(query), pageable);
        return new PageResult<>(
                result.getContent().stream().map(MembershipPersistenceAdapter::toDomain).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static Specification<MembershipListEntity> toSpecification(MembershipQuery query) {
        return (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (hasText(query.status())) {
                predicates.add(builder.equal(root.get("status"), query.status()));
            }
            if (hasText(query.categoryCode())) {
                predicates.add(builder.equal(root.get("categoryCode"), query.categoryCode()));
            }
            if (hasText(query.groupCode())) {
                predicates.add(builder.equal(root.get("primaryGroupCode"), query.groupCode()));
            }
            if (hasText(query.search())) {
                String pattern = "%" + escapeLike(query.search().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(
                        builder.or(
                                builder.like(builder.lower(root.get("membershipNumber")), pattern, '\\'),
                                builder.like(
                                        builder.lower(root.get("organizationLegalName")), pattern, '\\')));
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

    private static Membership toDomain(MembershipListEntity entity) {
        return new Membership(
                entity.getId(),
                entity.getMembershipNumber(),
                entity.getOrganizationId(),
                entity.getOrganizationLegalName(),
                entity.getCategoryCode(),
                entity.getStatus(),
                entity.getJoinedAt(),
                entity.getVersion(),
                entity.getPrimaryGroupCode(),
                entity.getPrimaryGroupName());
    }
}
