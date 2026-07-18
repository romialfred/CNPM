package ml.cnpm.platform.enrollment.application;

import java.util.UUID;

/**
 * Données de création d'un dossier d'adhésion.
 *
 * <p>{@code caseNumber} est l'identité métier (unique) et sert de clé naturelle
 * d'idempotence. Le statut initial ({@code DRAFT}) n'est pas fourni par le client : c'est
 * la valeur par défaut du schéma et le point d'entrée de la machine à états.
 */
public record EnrollmentCaseDraft(String caseNumber, UUID organizationId, String channel) {}
