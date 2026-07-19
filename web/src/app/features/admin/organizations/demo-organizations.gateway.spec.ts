import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoOrganizationsGateway } from './demo-organizations.gateway';
import { OrganizationConflictError } from './organizations-gateway';

const BASE_QUERY = {
  search: '',
  status: null,
  organizationType: null,
  sectorCode: null,
  sort: { key: 'legalName', direction: 'asc' as const },
  page: 1,
  pageSize: 10,
};

describe('DemoOrganizationsGateway', () => {
  it('filtre avant de paginer et ne renvoie que des données fictives', async () => {
    const gateway = new DemoOrganizationsGateway();
    const page = await firstValueFrom(gateway.search({ ...BASE_QUERY, search: 'Nimba' }));
    expect(page.totalItems).toBe(1);
    expect(page.rows[0]?.legalName).toContain('Démonstration');
  });

  it('incrémente la version après une modification', async () => {
    const gateway = new DemoOrganizationsGateway();
    const page = await firstValueFrom(gateway.search(BASE_QUERY));
    const organization = page.rows[0]!;
    const updated = await firstValueFrom(
      gateway.update(organization.id, organization.version, {
        legalName: `${organization.legalName} révisé`,
        tradeName: organization.tradeName ?? '',
        organizationType: organization.organizationType,
        sectorCode: organization.sectorCode ?? '',
      }),
    );
    expect(updated.version).toBe(organization.version + 1);
    expect(updated.legalName).toContain('révisé');
  });

  it('refuse une version obsolète', async () => {
    const gateway = new DemoOrganizationsGateway();
    const page = await firstValueFrom(gateway.search(BASE_QUERY));
    const organization = page.rows[0]!;
    const result = firstValueFrom(
      gateway.update(organization.id, organization.version - 1, {
        legalName: organization.legalName,
        tradeName: '',
        organizationType: organization.organizationType,
        sectorCode: '',
      }),
    );
    await expect(result).rejects.toBeInstanceOf(OrganizationConflictError);
  });
});
