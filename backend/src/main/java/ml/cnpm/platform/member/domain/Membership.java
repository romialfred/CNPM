package ml.cnpm.platform.member.domain;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Adhésion d'une entreprise (module MEMBER) — vue de liste jointe à l'entreprise.
 *
 * <p>Porte le numéro d'adhésion (identité métier « membre »), la catégorie de
 * cotisation, le statut de cycle de vie, la raison sociale de l'entreprise rattachée
 * et son groupement professionnel principal : ce sont les colonnes qu'affiche la liste
 * des membres (BO-002). Le groupement principal peut être absent ({@code null}). Les
 * montants dus/payés appartiennent aux modules cotisation/paiement et restent hors
 * MEMBER tant qu'ADR-006 (read-model) n'est pas promue.
 */
public record Membership(
        UUID id,
        String membershipNumber,
        UUID organizationId,
        String organizationLegalName,
        String categoryCode,
        String status,
        LocalDate joinedAt,
        long version,
        String primaryGroupCode,
        String primaryGroupName) {}
