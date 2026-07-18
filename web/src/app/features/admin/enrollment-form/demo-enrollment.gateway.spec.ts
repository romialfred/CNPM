import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoEnrollmentGateway } from './demo-enrollment.gateway';

describe('DemoEnrollmentGateway', () => {
  it('reprend un brouillon visuel entièrement fictif', async () => {
    const gateway = new DemoEnrollmentGateway();
    const context = await firstValueFrom(gateway.load());

    expect(context.draft?.id).toBe('ENR-BROUILLON-DEMO-0001');
    expect(context.draft?.values.legalName).toBe('SOCIÉTÉ MALIENNE DE LOGISTIQUE');
    expect(context.draft?.values.contactEmail).toMatch(/\.example$/);
    expect(context.draft?.savedAt).toBe('2024-05-27T10:15:00Z');
  });

  it('conserve le même identifiant lors de la sauvegarde suivante', async () => {
    const gateway = new DemoEnrollmentGateway();
    const context = await firstValueFrom(gateway.load());
    const draft = context.draft!;

    const saved = await firstValueFrom(
      gateway.saveDraft({ ...draft.values, tradeName: 'SML Démo' }),
    );

    expect(saved.id).toBe(draft.id);
    expect(saved.values.tradeName).toBe('SML Démo');
  });
});
