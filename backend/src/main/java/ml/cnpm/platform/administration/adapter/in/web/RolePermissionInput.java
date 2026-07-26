package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Corps d'octroi d'une permission à un rôle : l'identifiant de la permission et l'état voulu
 * ({@code granted}). Le rôle est porté par le chemin.
 */
public record RolePermissionInput(@NotNull UUID permissionId, @NotNull Boolean granted) {}
