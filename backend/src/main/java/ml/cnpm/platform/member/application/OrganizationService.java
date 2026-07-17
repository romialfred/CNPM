package ml.cnpm.platform.member.application;

import ml.cnpm.platform.member.application.port.out.OrganizationRepository;
import ml.cnpm.platform.member.domain.Organization;
import ml.cnpm.platform.shared.api.PageResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service applicatif du module MEMBER : recherche des entreprises.
 *
 * <p>L'autorisation s'appuie sur la <em>permission</em> {@code MEMBER.READ} plutôt que
 * sur une énumération de rôles : le seed l'accorde à une dizaine de rôles, que
 * {@link ml.cnpm.platform.shared.security.PermissionDirectory} dérive en autorités
 * {@code PERM_MEMBER.READ}. Le contrôle est côté serveur et refusé par défaut ; un test
 * négatif vérifie le 403.
 *
 * <p><strong>Limite connue (ADR-008) :</strong> l'autorisation est ici purement RBAC par
 * permission ; le <em>périmètre</em> organisation/groupement (ABAC) n'est pas appliqué.
 * Un rôle scopé à son groupement (ex. {@code REFERENT_GROUPEMENT}) voit donc toutes les
 * entreprises. L'ABAC suppose que le jeton porte le périmètre de l'utilisateur, ce qui
 * dépend du provisionnement Keycloak non encore réalisé — à câbler avant l'exposition en
 * production. Suivi dans {@code quality-scorecard.md}.
 */
@Service
public class OrganizationService {

    private final OrganizationRepository repository;

    public OrganizationService(OrganizationRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public PageResult<Organization> search(OrganizationQuery query) {
        return repository.search(query);
    }
}
