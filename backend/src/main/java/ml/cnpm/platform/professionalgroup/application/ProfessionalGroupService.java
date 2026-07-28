package ml.cnpm.platform.professionalgroup.application;

import java.util.Locale;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.professionalgroup.application.port.out.ProfessionalGroupRepository;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.PageResult;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cas d'usage de consultation et d'administration du référentiel des groupements. */
@Service
public class ProfessionalGroupService {

    private static final String ENTITY_TYPE = "member.professional_group";
    private static final String ACTION_CREATED = "PROFESSIONAL_GROUP.CREATED";
    private static final String STATUS_ACTIVE = "ACTIVE";

    private final ProfessionalGroupRepository repository;
    private final AuditRecorder auditRecorder;

    public ProfessionalGroupService(
            ProfessionalGroupRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasAuthority('PERM_GROUP.READ')")
    @Transactional(readOnly = true)
    public PageResult<ProfessionalGroup> list(int page, int size) {
        return repository.findAll(page, size);
    }

    @PreAuthorize("hasAuthority('PERM_GROUP.READ')")
    @Transactional(readOnly = true)
    public ProfessionalGroup get(UUID id) {
        return repository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Groupement professionnel introuvable."));
    }

    /**
     * Crée un groupement professionnel. Le code identifie le groupement de façon unique : il
     * est normalisé en majuscules et un rejeu sur un code déjà pris est un conflit, jamais un
     * doublon silencieux. Le groupement naît {@code ACTIVE}. L'action est auditée sans exposer
     * de secret (le référentiel n'en porte pas).
     *
     * @throws StateConflictException si le code ou la dénomination manque, ou si le code existe
     */
    @PreAuthorize("hasAuthority('PERM_GROUP.WRITE')")
    @Transactional
    public ProfessionalGroup create(
            CreateProfessionalGroupCommand command, UUID actorUserId, UUID correlationId) {
        String code = command.code() == null ? "" : command.code().trim().toUpperCase(Locale.ROOT);
        String name = command.name() == null ? "" : command.name().trim();
        String sectorCode = trimToNull(command.sectorCode());
        if (code.isBlank() || name.isBlank()) {
            throw new StateConflictException("Le code et la dénomination sont obligatoires.");
        }
        if (repository.existsByCode(code)) {
            throw new StateConflictException("Un groupement porte déjà ce code.");
        }

        ProfessionalGroup created = repository.create(code, name, sectorCode, STATUS_ACTIVE);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_CREATED,
                        ENTITY_TYPE,
                        created.id(),
                        Hashing.sha256Hex(
                                String.join(
                                        "|",
                                        created.id().toString(),
                                        code,
                                        name,
                                        String.valueOf(sectorCode))),
                        correlationId));
        return created;
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
