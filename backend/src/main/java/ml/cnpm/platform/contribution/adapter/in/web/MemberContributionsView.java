package ml.cnpm.platform.contribution.adapter.in.web;

import java.math.BigDecimal;
import java.util.List;

/**
 * Situation de cotisation d'un membre : ses appels et le total restant dû.
 *
 * <p>{@code outstandingBalance} est la somme des soldes des appels — le « solde officiel » au
 * sens de RG-008 ne comptabilise que des paiements confirmés et rapprochés (module paiement
 * non livré) : tant qu'aucun encaissement n'est imputé, il vaut le total appelé.
 */
public record MemberContributionsView(
        List<ContributionCallView> items, BigDecimal outstandingBalance, String currency) {}
