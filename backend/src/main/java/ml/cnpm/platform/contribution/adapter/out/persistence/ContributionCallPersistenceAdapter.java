package ml.cnpm.platform.contribution.adapter.out.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.contribution.application.ContributionCallDraft;
import ml.cnpm.platform.contribution.application.port.out.ContributionCallRepository;
import ml.cnpm.platform.contribution.domain.ContributionCall;
import org.springframework.stereotype.Repository;

/** Adaptateur de persistance du module COTISATION. */
@Repository
class ContributionCallPersistenceAdapter implements ContributionCallRepository {

    private static final String CURRENCY_XOF = "XOF";
    private static final String STATUS_ISSUED = "ISSUED";
    private static final String FISCAL_YEAR_OPEN = "OPEN";

    private final ContributionCallJpaRepository callRepository;
    private final FiscalYearJpaRepository fiscalYearRepository;

    ContributionCallPersistenceAdapter(
            ContributionCallJpaRepository callRepository,
            FiscalYearJpaRepository fiscalYearRepository) {
        this.callRepository = callRepository;
        this.fiscalYearRepository = fiscalYearRepository;
    }

    @Override
    public Optional<ContributionCall> findByCallNumber(String callNumber) {
        return callRepository
                .findByCallNumber(callNumber)
                .map(ContributionCallPersistenceAdapter::toDomain);
    }

    @Override
    public List<ContributionCall> findByMembership(UUID membershipId) {
        return callRepository.findByMembership(membershipId).stream()
                .map(ContributionCallPersistenceAdapter::toDomain)
                .toList();
    }

    @Override
    public ContributionCall issue(ContributionCallDraft draft) {
        FiscalYearEntity fiscalYear = findOrOpenFiscalYear(draft.fiscalYear());
        ContributionCallEntity entity =
                new ContributionCallEntity(
                        UUID.randomUUID(),
                        draft.membershipId(),
                        fiscalYear,
                        draft.callNumber(),
                        draft.amountDue(),
                        CURRENCY_XOF,
                        draft.dueDate(),
                        STATUS_ISSUED);
        return toDomain(callRepository.save(entity));
    }

    /**
     * Ouvre l'exercice à la volée s'il n'existe pas encore.
     *
     * <p>Hypothèse consignée : aucune source ne définit les dates d'exercice du CNPM ; l'année
     * civile (1er janvier – 31 décembre) est retenue par défaut. Une définition différente se
     * corrigera par simple mise à jour de la ligne, sans toucher aux appels émis.
     */
    private FiscalYearEntity findOrOpenFiscalYear(int year) {
        return fiscalYearRepository
                .findByYear(year)
                .orElseGet(
                        () ->
                                fiscalYearRepository.save(
                                        new FiscalYearEntity(
                                                UUID.randomUUID(),
                                                year,
                                                LocalDate.of(year, 1, 1),
                                                LocalDate.of(year, 12, 31),
                                                FISCAL_YEAR_OPEN)));
    }

    private static ContributionCall toDomain(ContributionCallEntity entity) {
        return new ContributionCall(
                entity.getId(),
                entity.getCallNumber(),
                entity.getMembershipId(),
                entity.getFiscalYear().getYear(),
                entity.getAmountDue(),
                entity.getBalanceAmount(),
                entity.getCurrency(),
                entity.getDueDate(),
                entity.getStatus(),
                entity.getVersion());
    }
}
