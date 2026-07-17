package ml.cnpm.platform.administration.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Valeur d'un référentiel métier (module ADM).
 *
 * <p>Modèle de domaine immuable, indépendant de la persistance et de l'API : ni
 * l'entité JPA ni le DTO web ne franchissent la frontière du domaine
 * ({@code .claude/rules/backend-java.md}). Les valeurs de référentiel alimentent les
 * listes déroulantes des écrans (catégories, canaux, priorités…) et sont historisées
 * en base.
 */
public record ReferenceValue(
        UUID id,
        String domain,
        String code,
        String label,
        int sortOrder,
        boolean active,
        Instant validFrom,
        Instant validTo) {}
