package ml.cnpm.platform.payment.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Instructions de paiement de l'espace membre ({@code GET /portal/payment-instructions}).
 *
 * <p><b>Périmètre.</b> Aucun identifiant d'adhésion n'est accepté du client : il est résolu
 * depuis le compte authentifié ({@code iam.user_account.member_id}). Un compte sans adhésion —
 * un compte professionnel — n'a pas d'espace membre et se voit refusé, plutôt que servi d'une
 * page vide qui laisserait croire à une adhésion sans référence.
 *
 * <p><b>Souveraineté.</b> Le membre ne voit que le diffusable : ses références VALIDÉES et les
 * comptes d'encaissement ACTIFS. Une référence en attente ou un compte non validé ne franchit
 * jamais cette frontière, quelle que soit l'habilitation de l'appelant.
 */
@Service
public class MemberPaymentQueryService {

    private final JdbcTemplate jdbc;

    MemberPaymentQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PreAuthorize("hasAuthority('PERM_PAYMENT.READ')")
    @Transactional(readOnly = true)
    public MemberPaymentInstructionsView.Instructions instructions(UUID accountId) {
        UUID membershipId = requireMembership(accountId);

        List<MemberPaymentInstructionsView.ReferenceLine> references =
                jdbc.query(
                        "SELECT id, reference_value, exercise FROM payment.payment_reference"
                                + " WHERE membership_id = ? AND status = 'VALIDATED'"
                                + " ORDER BY exercise DESC NULLS LAST, created_at DESC",
                        (rs, i) ->
                                new MemberPaymentInstructionsView.ReferenceLine(
                                        rs.getString("id"),
                                        rs.getString("reference_value"),
                                        rs.getObject("exercise", Integer.class)),
                        membershipId);

        List<MemberPaymentInstructionsView.AccountLine> accounts =
                jdbc.query(
                        "SELECT id, channel, label, account_holder, account_identifier, bank_name,"
                                + " instructions FROM payment.collection_account"
                                + " WHERE status = 'ACTIVE' ORDER BY channel, label",
                        (rs, i) ->
                                new MemberPaymentInstructionsView.AccountLine(
                                        rs.getString("id"),
                                        rs.getString("channel"),
                                        rs.getString("label"),
                                        rs.getString("account_holder"),
                                        rs.getString("account_identifier"),
                                        rs.getString("bank_name"),
                                        rs.getString("instructions")));

        return new MemberPaymentInstructionsView.Instructions(references, accounts);
    }

    /** Adhésion du compte connecté, ou refus si le compte n'en porte aucune. */
    private UUID requireMembership(UUID accountId) {
        return Optional.ofNullable(accountId)
                .flatMap(
                        id ->
                                jdbc
                                        .query(
                                                "SELECT member_id FROM iam.user_account"
                                                        + " WHERE id = ? AND member_id IS NOT NULL",
                                                (rs, i) -> rs.getObject("member_id", UUID.class),
                                                id)
                                        .stream()
                                        .findFirst())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Aucune adhésion n’est rattachée à ce compte."));
    }
}
