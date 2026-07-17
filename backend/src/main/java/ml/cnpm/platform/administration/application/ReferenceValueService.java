package ml.cnpm.platform.administration.application;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.administration.application.port.out.ReferenceValueRepository;
import ml.cnpm.platform.administration.domain.ReferenceValue;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service applicatif du module ADM : lecture et création des valeurs de référentiel.
 *
 * <p>L'autorisation est portée ici, au service applicatif, et non au contrôleur
 * (ADR-008) : lecture et écriture sont réservées au rôle {@code ADMIN_FONCTIONNEL}, seul
 * porteur d'{@code ADMIN.REFERENTIAL.READ}/{@code WRITE} dans
 * {@code V3__seed_roles_permissions_and_references.sql}. Le contrôle est côté serveur et
 * refusé par défaut ; des tests négatifs vérifient les 403.
 *
 * <p>Les transactions sont déclarées ici (couche applicative). La création est
 * idempotente sur l'identité métier (domaine, code) et produit un événement d'audit dans
 * la même transaction : action et trace sont validées ou annulées ensemble.
 */
@Service
public class ReferenceValueService {

    private static final String ENTITY_TYPE = "ref.reference_value";
    private static final String ACTION_CREATED = "REFERENCE_VALUE.CREATED";

    private final ReferenceValueRepository repository;
    private final AuditRecorder auditRecorder;

    public ReferenceValueService(ReferenceValueRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasRole('ADMIN_FONCTIONNEL')")
    @Transactional(readOnly = true)
    public PageResult<ReferenceValue> list(String domain, int page, int size) {
        return repository.list(domain, page, size);
    }

    /**
     * Crée une valeur de référentiel, ou renvoie l'existante si une valeur strictement
     * identique porte déjà le même (domaine, code).
     *
     * @throws StateConflictException si une valeur existe déjà pour ce (domaine, code)
     *     avec un contenu différent
     */
    @PreAuthorize("hasRole('ADMIN_FONCTIONNEL')")
    @Transactional
    public ReferenceValueCreation create(
            ReferenceValueDraft draft, UUID actorUserId, UUID correlationId) {
        Optional<ReferenceValue> existing =
                repository.findByDomainAndCode(draft.domain(), draft.code());
        if (existing.isPresent()) {
            // Idempotence par clé naturelle : même contenu → rejeu sans effet de bord ;
            // contenu divergent → conflit d'état.
            if (sameContent(existing.get(), draft)) {
                return new ReferenceValueCreation(existing.get(), false);
            }
            throw new StateConflictException(
                    "Une valeur de référentiel existe déjà pour ce domaine et ce code.");
        }

        ReferenceValue created = repository.create(draft);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId, ACTION_CREATED, ENTITY_TYPE, created.id(), fingerprint(created),
                        correlationId));
        return new ReferenceValueCreation(created, true);
    }

    private static boolean sameContent(ReferenceValue existing, ReferenceValueDraft draft) {
        return existing.label().equals(draft.label())
                && existing.sortOrder() == draft.sortOrder()
                && existing.active() == draft.active();
    }

    /** Empreinte SHA-256 de l'état, pour l'audit — sans exposer la donnée elle-même. */
    private static String fingerprint(ReferenceValue value) {
        String canonical =
                "domain=" + value.domain()
                        + ";code=" + value.code()
                        + ";label=" + value.label()
                        + ";sortOrder=" + value.sortOrder()
                        + ";active=" + value.active();
        return Hashing.sha256Hex(canonical);
    }
}
