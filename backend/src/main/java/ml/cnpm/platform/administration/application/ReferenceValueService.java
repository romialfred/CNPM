package ml.cnpm.platform.administration.application;

import ml.cnpm.platform.administration.application.port.out.ReferenceValueRepository;
import ml.cnpm.platform.administration.domain.ReferenceValue;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service applicatif du module ADM : lecture des valeurs de référentiel.
 *
 * <p>L'autorisation est portée ici, au service applicatif, et non au contrôleur
 * (ADR-008) : {@code ADMIN.REFERENTIAL.READ} n'est accordé qu'au rôle
 * {@code ADMIN_FONCTIONNEL} par {@code V3__seed_roles_permissions_and_references.sql}.
 * Le contrôle est côté serveur et refusé par défaut ; un test négatif vérifie le 403.
 *
 * <p>La transaction est déclarée ici (couche applicative), en lecture seule pour une
 * consultation.
 */
@Service
public class ReferenceValueService {

    private final ReferenceValueRepository repository;

    public ReferenceValueService(ReferenceValueRepository repository) {
        this.repository = repository;
    }

    @PreAuthorize("hasRole('ADMIN_FONCTIONNEL')")
    @Transactional(readOnly = true)
    public PageResult<ReferenceValue> list(String domain, int page, int size) {
        return repository.list(domain, page, size);
    }
}
