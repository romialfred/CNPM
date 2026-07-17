package ml.cnpm.platform.member.domain;

import java.util.UUID;

/**
 * Entreprise membre — vue de liste (module MEMBER).
 *
 * <p>Modèle de domaine immuable, indépendant de la persistance et de l'API. Cette
 * projection porte les champs propres à l'entreprise ({@code member.organization}). Le
 * numéro d'adhésion, la catégorie, le groupement et le contact vivent dans d'autres
 * tables du module ({@code membership}, {@code professional_group}, {@code organization_contact})
 * et relèvent d'une vue jointe ultérieure ; les montants de cotisation appartiennent à
 * d'autres modules et restent hors de portée tant qu'ADR-006 (read-model) n'est pas
 * promue — {@code docs/02-architecture/modules.md} interdit à MEMBER de lire leurs tables.
 */
public record Organization(
        UUID id,
        String legalName,
        String tradeName,
        String organizationType,
        String sectorCode,
        String status,
        String riskLevel,
        long version) {}
