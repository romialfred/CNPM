package ml.cnpm.platform.administration.application;

/**
 * Résultat d'une demande de création de compte.
 *
 * <p>{@code created} distingue une création réelle (201) d'un rejeu idempotent renvoyant
 * le compte déjà en place (200) : l'appelant sait ainsi s'il vient d'agir ou de constater.
 */
public record AdminAccountCreation(AdminSecurityView.Account account, boolean created) { }
