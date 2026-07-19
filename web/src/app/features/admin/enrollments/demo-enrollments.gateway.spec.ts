import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { EnrollmentConflictError, EnrollmentNotFoundError } from './enrollments-gateway';
import { DemoEnrollmentsGateway } from './demo-enrollments.gateway';

describe('DemoEnrollmentsGateway', () => {
  it('pagine le même jeu déterministe que la fiche détail', async () => {
    const gateway = new DemoEnrollmentsGateway();
    const page = await firstValueFrom(gateway.list({ page: 2, pageSize: 10 }));

    expect(page.totalItems).toBe(12);
    expect(page.totalPages).toBe(2);
    expect(page.rows).toHaveLength(2);
    await expect(firstValueFrom(gateway.get(page.rows[0].id))).resolves.toEqual(page.rows[0]);
  });

  it('respecte SUBMITTED → UNDER_REVIEW → COMPLEMENT_REQUIRED', async () => {
    const gateway = new DemoEnrollmentsGateway();
    const submitted = (await firstValueFrom(gateway.list({ page: 1, pageSize: 20 }))).rows.find(
      (item) => item.status === 'SUBMITTED',
    );
    expect(submitted).toBeDefined();

    const underReview = await firstValueFrom(gateway.startReview(submitted?.id ?? ''));
    expect(underReview.status).toBe('UNDER_REVIEW');
    expect(underReview.assignedTo).not.toBeNull();

    const complement = await firstValueFrom(
      gateway.requestComplement(underReview.id, 'Motif de démonstration'),
    );
    expect(complement.status).toBe('COMPLEMENT_REQUIRED');
    await expect(
      firstValueFrom(
        gateway.approve(complement.id, {
          membershipNumber: 'CNPM-DEMO',
          categoryCode: 'DEMO',
        }),
      ),
    ).rejects.toBeInstanceOf(EnrollmentConflictError);
  });

  it('signale un identifiant inconnu sans créer un dossier implicite', async () => {
    await expect(
      firstValueFrom(new DemoEnrollmentsGateway().get('00000000-0000-4000-8000-000000000000')),
    ).rejects.toBeInstanceOf(EnrollmentNotFoundError);
  });
});
