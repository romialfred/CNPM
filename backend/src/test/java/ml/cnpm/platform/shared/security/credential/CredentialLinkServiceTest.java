package ml.cnpm.platform.shared.security.credential;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ml.cnpm.platform.shared.security.credential.AccountCredentialNotifier.Recipient;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

/** Orchestration : l'émission notifie le titulaire, et un échec d'envoi ne remonte jamais. */
class CredentialLinkServiceTest {

    private final AccountCredentialService credentials = mock(AccountCredentialService.class);
    private final AccountCredentialNotifier notifier = mock(AccountCredentialNotifier.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final CredentialLinkService service =
            new CredentialLinkService(credentials, notifier, jdbc);

    private final UUID accountId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final UUID correlationId = UUID.randomUUID();

    @SuppressWarnings("unchecked")
    private void stubRecipient(Recipient recipient) {
        when(jdbc.query(anyString(), any(RowMapper.class), eq(accountId)))
                .thenReturn(recipient == null ? List.of() : List.of(recipient));
    }

    private AccountCredentialService.IssuedToken stubIssue(boolean activation) {
        AccountCredentialService.IssuedToken issued =
                new AccountCredentialService.IssuedToken(
                        "jeton-abc", OffsetDateTime.parse("2026-01-02T00:00:00Z"), activation);
        when(credentials.issue(accountId, actorId, correlationId)).thenReturn(issued);
        return issued;
    }

    @Test
    void l_emission_notifie_le_titulaire_avec_le_bon_lien() {
        AccountCredentialService.IssuedToken issued = stubIssue(true);
        stubRecipient(new Recipient("awa@example.ml", "Awa"));

        AccountCredentialService.IssuedToken returned =
                service.issueAndNotify(accountId, actorId, correlationId);

        assertThat(returned).isSameAs(issued);
        verify(notifier)
                .sendCredentialLink(
                        eq(new Recipient("awa@example.ml", "Awa")),
                        eq(true),
                        eq("jeton-abc"),
                        eq(issued.expiresAt()));
    }

    @Test
    void un_echec_d_envoi_ne_remonte_pas_et_le_jeton_est_toujours_retourne() {
        AccountCredentialService.IssuedToken issued = stubIssue(false);
        stubRecipient(new Recipient("awa@example.ml", "Awa"));
        doThrow(new RuntimeException("relais injoignable"))
                .when(notifier)
                .sendCredentialLink(any(), eq(false), anyString(), any());

        AccountCredentialService.IssuedToken returned =
                service.issueAndNotify(accountId, actorId, correlationId);

        assertThat(returned).isSameAs(issued);
    }
}
