import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoAuditGateway } from './demo-audit.gateway';

describe('DemoAuditGateway — fixture fermée BO-032', () => {
  it('livre des événements explicitement fictifs, figés et du plus récent au plus ancien', async () => {
    const page = await firstValueFrom(new DemoAuditGateway().search({ page: 1, size: 10 }));

    expect(page.items).toHaveLength(10);
    expect(page.totalElements).toBe(12);
    expect(
      page.items.every(
        (event) =>
          event.actorType.startsWith('DEMO_') &&
          event.actionCode.startsWith('DEMO_') &&
          event.entityType.startsWith('DEMO_'),
      ),
    ).toBe(true);
    expect(page.items.every((event) => Object.isFrozen(event))).toBe(true);
    expect(
      page.items.every(
        (event, index, items) =>
          index === 0 || Date.parse(items[index - 1].createdAt) >= Date.parse(event.createdAt),
      ),
    ).toBe(true);
  });

  it('pagine à la source sans dupliquer les événements de la page précédente', async () => {
    const gateway = new DemoAuditGateway();
    const first = await firstValueFrom(gateway.search({ page: 1, size: 10 }));
    const second = await firstValueFrom(gateway.search({ page: 2, size: 10 }));

    expect(second.page).toBe(1);
    expect(second.items).toHaveLength(2);
    expect(first.items.map((event) => event.id)).not.toContain(second.items[0].id);
  });
});
