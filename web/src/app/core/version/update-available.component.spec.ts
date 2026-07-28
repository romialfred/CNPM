import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateAvailableComponent } from './update-available.component';
import { VersionCheckService } from './version-check.service';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [UpdateAvailableComponent],
    providers: [provideZonelessChangeDetection(), VersionCheckService],
  }).compileComponents();
  const fixture = TestBed.createComponent(UpdateAvailableComponent);
  const service = TestBed.inject(VersionCheckService);
  fixture.detectChanges();
  return { fixture, service, host: fixture.nativeElement as HTMLElement };
}

describe('UpdateAvailableComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('reste masqué tant qu’aucune mise à jour n’est détectée', async () => {
    const { host } = await setup();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });

  it('affiche le popup de marque avec ses deux actions quand une mise à jour est disponible', async () => {
    const { fixture, service, host } = await setup();
    service.updateAvailable.set(true);
    fixture.detectChanges();

    expect(host.querySelector('img.cnpm-update__logo')).not.toBeNull();
    expect(host.textContent).toContain('Une nouvelle version de la plateforme est disponible');
    expect(host.textContent).toContain('Actualiser maintenant');
    expect(host.textContent).toContain('Plus tard');
  });

  it('« Plus tard » referme le popup sans recharger', async () => {
    const { fixture, service, host } = await setup();
    service.updateAvailable.set(true);
    fixture.detectChanges();

    const later = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Plus tard'),
    );
    later?.click();
    fixture.detectChanges();

    expect(service.updateAvailable()).toBe(false);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });
});
