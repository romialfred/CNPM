package ml.cnpm.platform.professionalgroup.adapter.in.web;

import java.util.UUID;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;

/** Projection HTTP d'un groupement professionnel. */
public record ProfessionalGroupView(
        UUID id, String code, String name, String sectorCode, String status, long version) {

    static ProfessionalGroupView from(ProfessionalGroup value) {
        return new ProfessionalGroupView(
                value.id(),
                value.code(),
                value.name(),
                value.sectorCode(),
                value.status(),
                value.version());
    }
}
