package ml.cnpm.platform.administration.application;

import ml.cnpm.platform.administration.domain.ReferenceValue;

/**
 * Issue d'une création de valeur de référentiel.
 *
 * @param created {@code true} si une nouvelle valeur a été créée (HTTP 201) ;
 *     {@code false} si une valeur identique existait déjà et a été renvoyée telle quelle
 *     (rejeu idempotent, HTTP 200)
 */
public record ReferenceValueCreation(ReferenceValue value, boolean created) {}
