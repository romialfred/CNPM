package ml.cnpm.platform.professionalgroup.application;

/**
 * Intention de création d'un groupement professionnel. Le statut n'y figure pas : un
 * groupement naît toujours actif ; sa désactivation relève d'une autre opération.
 */
public record CreateProfessionalGroupCommand(String code, String name, String sectorCode) {}
