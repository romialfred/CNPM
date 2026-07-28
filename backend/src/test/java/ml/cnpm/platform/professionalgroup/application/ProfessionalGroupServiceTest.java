package ml.cnpm.platform.professionalgroup.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.professionalgroup.application.port.out.ProfessionalGroupRepository;
import ml.cnpm.platform.professionalgroup.domain.ProfessionalGroup;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.junit.jupiter.api.Test;

/** Règles de création d'un groupement : normalisation, unicité du code, audit, validation. */
class ProfessionalGroupServiceTest {

    private final ProfessionalGroupRepository repository = mock(ProfessionalGroupRepository.class);
    private final AuditRecorder audit = mock(AuditRecorder.class);
    private final ProfessionalGroupService service =
            new ProfessionalGroupService(repository, audit);

    private final UUID actor = UUID.randomUUID();
    private final UUID correlation = UUID.randomUUID();

    @Test
    void cree_en_normalisant_le_code_et_audite() {
        when(repository.existsByCode("APBEF")).thenReturn(false);
        ProfessionalGroup created =
                new ProfessionalGroup(UUID.randomUUID(), "APBEF", "Assoc", null, "ACTIVE", 0);
        when(repository.create("APBEF", "Assoc", null, "ACTIVE")).thenReturn(created);

        ProfessionalGroup result =
                service.create(
                        new CreateProfessionalGroupCommand("  apbef ", "  Assoc ", "   "),
                        actor,
                        correlation);

        assertThat(result).isSameAs(created);
        verify(repository).create("APBEF", "Assoc", null, "ACTIVE");
        verify(audit).record(any(AuditEntry.class));
    }

    @Test
    void refuse_un_code_deja_pris() {
        when(repository.existsByCode("APBEF")).thenReturn(true);

        assertThatThrownBy(
                        () ->
                                service.create(
                                        new CreateProfessionalGroupCommand("apbef", "Assoc", null),
                                        actor,
                                        correlation))
                .isInstanceOf(StateConflictException.class);
        verify(repository, never()).create(any(), any(), any(), any());
    }

    @Test
    void refuse_un_code_ou_une_denomination_vide() {
        assertThatThrownBy(
                        () ->
                                service.create(
                                        new CreateProfessionalGroupCommand("  ", "Assoc", null),
                                        actor,
                                        correlation))
                .isInstanceOf(StateConflictException.class);
        assertThatThrownBy(
                        () ->
                                service.create(
                                        new CreateProfessionalGroupCommand("CODE", "  ", null),
                                        actor,
                                        correlation))
                .isInstanceOf(StateConflictException.class);
    }
}
