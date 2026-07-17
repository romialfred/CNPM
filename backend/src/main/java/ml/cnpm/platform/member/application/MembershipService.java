package ml.cnpm.platform.member.application;

import ml.cnpm.platform.member.application.port.out.MembershipRepository;
import ml.cnpm.platform.member.domain.Membership;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service applicatif du module MEMBER : recherche des adhésions (vue « membre » de BO-002).
 *
 * <p>Autorisé par la permission {@code MEMBER.READ} (dérivée en {@code PERM_MEMBER.READ}) ;
 * refus par défaut, test négatif du 403. Même limite ABAC que
 * {@link OrganizationService} : le périmètre organisation/groupement n'est pas appliqué
 * (ADR-008), à câbler avant exposition en production.
 */
@Service
public class MembershipService {

    private final MembershipRepository repository;

    public MembershipService(MembershipRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public PageResult<Membership> search(MembershipQuery query) {
        return repository.search(query);
    }
}
