package ml.cnpm.platform.professionalgroup.domain;

import java.util.UUID;

/** Référentiel d'un groupement professionnel CNPM. */
public record ProfessionalGroup(
        UUID id, String code, String name, String sectorCode, String status, long version) {}
