package ml.cnpm.platform.service.application;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Espace membre — requêtes et réclamations du cotisant.
 *
 * <p><b>Périmètre.</b> Aucun identifiant d'organisation n'est accepté du client : il est résolu
 * depuis le compte authentifié ({@code iam.user_account.member_id → membership.organization_id}).
 * {@code REQUEST.READ}/{@code REQUEST.WRITE} sont aussi portés par des rôles d'administration ; ce
 * n'est pas la permission qui borne, c'est le rattachement du compte à son organisation.
 *
 * <p><b>Souveraineté.</b> Le membre ne lit que les échanges PARTAGÉS. La création est idempotente :
 * rejouer la même soumission (même clé) renvoie la requête déjà créée, sans doublon.
 */
@Service
public class MemberRequestService {

    /** Types ouverts au membre ; toute autre valeur est refusée au bord. */
    private static final Set<String> MEMBER_TYPES =
            Set.of("INFORMATION", "DOCUMENT", "CLAIM", "OTHER");

    private static final String ENTITY_TYPE = "service.request";
    private static final String ACTION_CREATED = "REQUEST.CREATED";
    private static final String ACTION_MESSAGE = "REQUEST.MESSAGE_ADDED";

    private final JdbcTemplate jdbc;
    private final AuditRecorder auditRecorder;

    MemberRequestService(JdbcTemplate jdbc, AuditRecorder auditRecorder) {
        this.jdbc = jdbc;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasAuthority('PERM_REQUEST.READ')")
    @Transactional(readOnly = true)
    public MemberRequestView.Page list(UUID accountId, int page, int size) {
        UUID organizationId = requireOrganization(accountId);
        Long total =
                jdbc.queryForObject(
                        "SELECT count(*) FROM service.request WHERE organization_id = ?",
                        Long.class,
                        organizationId);
        long totalElements = total == null ? 0L : total;

        List<MemberRequestView.Summary> items =
                jdbc.query(
                        "SELECT id, request_number, request_type, subject, status, priority,"
                                + " to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS created_at,"
                                + " to_char(updated_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS updated_at"
                                + " FROM service.request WHERE organization_id = ?"
                                + " ORDER BY updated_at DESC, id ASC LIMIT ? OFFSET ?",
                        (rs, i) ->
                                new MemberRequestView.Summary(
                                        rs.getString("id"),
                                        rs.getString("request_number"),
                                        rs.getString("request_type"),
                                        rs.getString("subject"),
                                        rs.getString("status"),
                                        rs.getString("priority"),
                                        rs.getString("created_at"),
                                        rs.getString("updated_at")),
                        organizationId,
                        size,
                        page * size);

        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new MemberRequestView.Page(items, page, size, totalElements, totalPages);
    }

    @PreAuthorize("hasAuthority('PERM_REQUEST.READ')")
    @Transactional(readOnly = true)
    public MemberRequestView.Detail detail(UUID accountId, UUID requestId) {
        UUID organizationId = requireOrganization(accountId);
        return loadDetail(organizationId, requestId);
    }

    @PreAuthorize("hasAuthority('PERM_REQUEST.WRITE')")
    @Transactional
    public MemberRequestView.Detail create(
            UUID accountId,
            String type,
            String subject,
            String description,
            String idempotencyKey,
            UUID actorUserId,
            UUID correlationId) {
        UUID organizationId = requireOrganization(accountId);
        String normalizedType = normalizeType(type);

        // Idempotence : une clé déjà vue renvoie la requête existante, sans en créer une seconde.
        UUID existing =
                jdbc
                        .query(
                                "SELECT id FROM service.request"
                                        + " WHERE organization_id = ? AND idempotency_key = ?",
                                (rs, i) -> rs.getObject("id", UUID.class),
                                organizationId,
                                idempotencyKey)
                        .stream()
                        .findFirst()
                        .orElse(null);
        if (existing != null) {
            return loadDetail(organizationId, existing);
        }

        UUID id =
                jdbc
                        .query(
                                "INSERT INTO service.request (organization_id, request_number,"
                                        + " request_type, subject, description, status, priority,"
                                        + " created_by, idempotency_key)"
                                        + " VALUES (?, 'CNPM-REQ-'"
                                        + "   || lpad(nextval('service.request_number_seq')::text, 6, '0'),"
                                        + "   ?, ?, ?, 'SUBMITTED', 'NORMAL', ?, ?)"
                                        + " ON CONFLICT (idempotency_key)"
                                        + "   WHERE idempotency_key IS NOT NULL"
                                        + "   DO NOTHING RETURNING id",
                                (rs, i) -> rs.getObject("id", UUID.class),
                                organizationId,
                                normalizedType,
                                subject,
                                description,
                                actorUserId,
                                idempotencyKey)
                        .stream()
                        .findFirst()
                        .orElseGet(
                                () ->
                                        jdbc.queryForObject(
                                                "SELECT id FROM service.request"
                                                        + " WHERE organization_id = ?"
                                                        + "   AND idempotency_key = ?",
                                                UUID.class,
                                                organizationId,
                                                idempotencyKey));

        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_CREATED,
                        ENTITY_TYPE,
                        id,
                        Hashing.sha256Hex(String.join("|", id.toString(), normalizedType, subject)),
                        correlationId));
        return loadDetail(organizationId, id);
    }

    @PreAuthorize("hasAuthority('PERM_REQUEST.WRITE')")
    @Transactional
    public MemberRequestView.Detail addMessage(
            UUID accountId,
            UUID requestId,
            String body,
            UUID actorUserId,
            UUID correlationId) {
        UUID organizationId = requireOrganization(accountId);
        // Le rattachement de la requête à l'organisation est vérifié ici : un membre ne peut
        // écrire que sur une requête de SA propre organisation.
        UUID confirmedId =
                jdbc
                        .query(
                                "SELECT id FROM service.request"
                                        + " WHERE id = ? AND organization_id = ?",
                                (rs, i) -> rs.getObject("id", UUID.class),
                                requestId,
                                organizationId)
                        .stream()
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Requête introuvable."));

        UUID messageId =
                jdbc.queryForObject(
                        "INSERT INTO service.request_message (request_id, sender_type, body,"
                                + " visibility, created_by)"
                                + " VALUES (?, 'MEMBER', ?, 'SHARED', ?) RETURNING id",
                        UUID.class,
                        confirmedId,
                        body,
                        actorUserId);
        // La conversation avance : l'horodatage de la requête suit son dernier échange.
        jdbc.update(
                "UPDATE service.request SET updated_at = now(), updated_by = ? WHERE id = ?",
                actorUserId,
                confirmedId);

        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_MESSAGE,
                        ENTITY_TYPE,
                        confirmedId,
                        Hashing.sha256Hex(String.join("|", confirmedId.toString(), messageId.toString())),
                        correlationId));
        return loadDetail(organizationId, confirmedId);
    }

    private MemberRequestView.Detail loadDetail(UUID organizationId, UUID requestId) {
        MemberRequestView.Detail head =
                jdbc
                        .query(
                                "SELECT id, request_number, request_type, subject, description,"
                                        + " status, priority,"
                                        + " to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS created_at,"
                                        + " to_char(updated_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS updated_at"
                                        + " FROM service.request"
                                        + " WHERE id = ? AND organization_id = ?",
                                (rs, i) ->
                                        new MemberRequestView.Detail(
                                                rs.getString("id"),
                                                rs.getString("request_number"),
                                                rs.getString("request_type"),
                                                rs.getString("subject"),
                                                rs.getString("description"),
                                                rs.getString("status"),
                                                rs.getString("priority"),
                                                rs.getString("created_at"),
                                                rs.getString("updated_at"),
                                                List.of()),
                                requestId,
                                organizationId)
                        .stream()
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Requête introuvable."));

        List<MemberRequestView.Message> conversation =
                jdbc.query(
                        "SELECT id, sender_type, body,"
                                + " to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') AS created_at"
                                + " FROM service.request_message"
                                + " WHERE request_id = ? AND visibility = 'SHARED'"
                                + " ORDER BY created_at ASC, id ASC",
                        (rs, i) ->
                                new MemberRequestView.Message(
                                        rs.getString("id"),
                                        senderLabel(rs.getString("sender_type")),
                                        rs.getString("body"),
                                        rs.getString("created_at")),
                        requestId);

        return new MemberRequestView.Detail(
                head.id(),
                head.reference(),
                head.type(),
                head.subject(),
                head.description(),
                head.status(),
                head.priority(),
                head.createdAt(),
                head.updatedAt(),
                conversation);
    }

    /** MEMBER si l'échange vient du cotisant, AGENT pour tout envoi de la CNPM. */
    private static String senderLabel(String senderType) {
        return "MEMBER".equalsIgnoreCase(senderType) ? "MEMBER" : "AGENT";
    }

    private static String normalizeType(String type) {
        String candidate = type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
        if (!MEMBER_TYPES.contains(candidate)) {
            throw new IllegalArgumentException("Type de requête inconnu : " + type);
        }
        return candidate;
    }

    /**
     * Organisation de l'adhésion du compte connecté.
     *
     * @throws ResourceNotFoundException si le compte n'est rattaché à aucune adhésion : un compte
     *     professionnel n'a pas d'espace membre.
     */
    private UUID requireOrganization(UUID accountId) {
        return Optional.ofNullable(accountId)
                .flatMap(
                        id ->
                                jdbc
                                        .query(
                                                "SELECT m.organization_id FROM iam.user_account u"
                                                        + " JOIN member.membership m ON m.id = u.member_id"
                                                        + " WHERE u.id = ? AND u.member_id IS NOT NULL",
                                                (rs, i) -> rs.getObject("organization_id", UUID.class),
                                                id)
                                        .stream()
                                        .findFirst())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Aucune adhésion n’est rattachée à ce compte."));
    }
}
