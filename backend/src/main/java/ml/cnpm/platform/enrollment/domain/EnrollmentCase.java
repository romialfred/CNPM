package ml.cnpm.platform.enrollment.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Dossier d'adhésion d'une entreprise (module ENROLLMENT).
 *
 * <p>Modèle de domaine immuable. Le {@code caseNumber} est l'identité métier du dossier
 * (unique en base) et sert de clé naturelle d'idempotence à la création, faute de magasin
 * de clés générique (DATA-DEC-005). {@code submittedAt} et {@code assignedTo} sont nuls
 * tant que le dossier n'a pas été soumis / pris en charge.
 */
public record EnrollmentCase(
        UUID id,
        String caseNumber,
        UUID organizationId,
        String channel,
        EnrollmentStatus status,
        Instant submittedAt,
        UUID assignedTo,
        long version) {}
