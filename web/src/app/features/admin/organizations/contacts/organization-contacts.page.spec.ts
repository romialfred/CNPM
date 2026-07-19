import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../../core/api/api.config';
import { DemoSessionGateway } from '../../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../../layout/admin-shell/session-gateway';
import { OrganizationContactsPage } from './organization-contacts.page';

describe('OrganizationContactsPage — BO-007', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationContactsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CNPM_DATA_MODE, useValue: 'demo' },
        { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      ],
    }).compileComponents();
  });

  it('affiche uniquement des coordonnées explicitement fictives et les rôles structurants', async () => {
    const fixture = TestBed.createComponent(OrganizationContactsPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ateliers Nimba Démonstration');
    expect(fixture.nativeElement.textContent).toContain('Contact principal');
    expect(fixture.nativeElement.textContent).toContain('Contact financier');
    expect(fixture.nativeElement.textContent).toContain('entreprise.example');
  });

  it('neutralise explicitement la création tant que le contrat API manque', async () => {
    const fixture = TestBed.createComponent(OrganizationContactsPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '.cnpm-contacts__disabled-action',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
