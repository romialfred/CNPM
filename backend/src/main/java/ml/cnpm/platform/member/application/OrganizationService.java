package ml.cnpm.platform.member.application;

import java.util.UUID;
import ml.cnpm.platform.member.application.port.out.MembershipHistoryRepository;
import ml.cnpm.platform.member.application.port.out.OrganizationRepository;
import ml.cnpm.platform.member.domain.MembershipStatusChange;
import ml.cnpm.platform.member.domain.Organization;
import ml.cnpm.platform.shared.api.PageResult;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
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
    private final MembershipHistoryRepository historyRepository;

    public OrganizationService(
            OrganizationRepository repository, MembershipHistoryRepository historyRepository) {
        this.repository = repository;
        this.historyRepository = historyRepository;
    }

    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public PageResult<Organization> search(OrganizationQuery query) {
        return repository.search(query);
    }

    /**
     * Retourne la fiche d'une entreprise par son identifiant technique.
     *
     * @throws ResourceNotFoundException si aucune entreprise ne porte cet identifiant
     */
    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public Organization get(UUID id) {
        return repository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise introuvable."));
    }

    /**
     * Historique paginé des changements de statut des adhésions d'une entreprise, du plus
     * récent au plus ancien.
     *
     * @throws ResourceNotFoundException si aucune entreprise ne porte cet identifiant — un
     *     historique vide (entreprise existante sans changement) reste un 200 à liste vide
     */
    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public PageResult<MembershipStatusChange> getHistory(UUID id, int page, int size) {
        if (repository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Entreprise introuvable.");
        }
        return historyRepository.findByOrganization(id, page, size);
    }
}
