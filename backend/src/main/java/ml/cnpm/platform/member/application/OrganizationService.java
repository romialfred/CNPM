package ml.cnpm.platform.member.application;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.member.application.port.out.MembershipHistoryRepository;
import ml.cnpm.platform.member.application.port.out.OrganizationRepository;
import ml.cnpm.platform.member.domain.MembershipStatusChange;
import ml.cnpm.platform.member.domain.Organization;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.PageResult;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
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

    private static final String ENTITY_TYPE = "member.organization";
    private static final String ACTION_CREATED = "ORGANIZATION.CREATED";

    private final OrganizationRepository repository;
    private final MembershipHistoryRepository historyRepository;
    private final AuditRecorder auditRecorder;

    public OrganizationService(
            OrganizationRepository repository,
            MembershipHistoryRepository historyRepository,
            AuditRecorder auditRecorder) {
        this.repository = repository;
        this.historyRepository = historyRepository;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasAuthority('PERM_MEMBER.READ')")
    @Transactional(readOnly = true)
    public PageResult<Organization> search(OrganizationQuery query) {
        return repository.search(query);
    }

    /**
     * Crée une entreprise, ou renvoie l'existante si une entreprise strictement identique
     * porte déjà le même identifiant métier ({@code identifierType}, {@code identifierValue}).
     *
     * <p>Idempotence par clé naturelle faute de magasin de clés (DATA-DEC-005) : même
     * identifiant et même contenu → rejeu sans effet de bord (200) ; même identifiant et
     * contenu divergent → conflit d'état (409). Un événement d'audit est produit dans la
     * même transaction que la création.
     *
     * @throws StateConflictException si l'identifiant métier est déjà pris par une
     *     entreprise au contenu différent
     */
    @PreAuthorize("hasAuthority('PERM_MEMBER.WRITE')")
    @Transactional
    public OrganizationCreation create(
            OrganizationDraft draft, UUID actorUserId, UUID correlationId) {
        Optional<Organization> existing =
                repository.findByIdentifier(draft.identifierType(), draft.identifierValue());
        if (existing.isPresent()) {
            if (sameContent(existing.get(), draft)) {
                return new OrganizationCreation(existing.get(), false);
            }
            throw new StateConflictException(
                    "Une entreprise différente porte déjà cet identifiant métier.");
        }

        Organization created = repository.create(draft);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_CREATED,
                        ENTITY_TYPE,
                        created.id(),
                        fingerprint(created, draft),
                        correlationId));
        return new OrganizationCreation(created, true);
    }

    private static boolean sameContent(Organization existing, OrganizationDraft draft) {
        return java.util.Objects.equals(existing.legalName(), draft.legalName())
                && java.util.Objects.equals(existing.tradeName(), draft.tradeName())
                && java.util.Objects.equals(existing.organizationType(), draft.organizationType())
                && java.util.Objects.equals(existing.sectorCode(), draft.sectorCode());
    }

    /** Empreinte SHA-256 de l'état créé, pour l'audit — sans exposer la donnée elle-même. */
    private static String fingerprint(Organization value, OrganizationDraft draft) {
        String canonical =
                "legalName=" + value.legalName()
                        + ";tradeName=" + value.tradeName()
                        + ";organizationType=" + value.organizationType()
                        + ";sectorCode=" + value.sectorCode()
                        + ";identifierType=" + draft.identifierType()
                        + ";identifierValue=" + draft.identifierValue();
        return Hashing.sha256Hex(canonical);
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
