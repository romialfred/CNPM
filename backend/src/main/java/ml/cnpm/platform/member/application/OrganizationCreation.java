package ml.cnpm.platform.member.application;

import ml.cnpm.platform.member.domain.Organization;

/**
 * Résultat d'une demande de création d'entreprise.
 *
 * <p>{@code created} distingue une création réelle (201) d'un rejeu idempotent d'une
 * entreprise déjà présente à l'identique (200).
 */
public record OrganizationCreation(Organization value, boolean created) {}
