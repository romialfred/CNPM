import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BadgeComponent, type CnpmBadgeTone } from './badge.component';

@Component({
  imports: [BadgeComponent],
  template: `<cnpm-badge [tone]="tone()">Suspendu</cnpm-badge>`,
})
class HostComponent {
  readonly tone = signal<CnpmBadgeTone>('neutral');
}

describe('BadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('applique la classe du ton, alignée sur le vocabulaire des contrats', () => {
    // Non-régression du renommage critical -> error : le ton d'alerte est `error`,
    // conforme à status.contract.ts et FDB-001.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.tone.set('error');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.cnpm-badge') as HTMLElement;
    expect(badge.classList.contains('cnpm-badge--error')).toBe(true);
    expect(badge.classList.contains('cnpm-badge--critical')).toBe(false);
  });

  it('double la couleur d’un repère de forme et d’un libellé textuel', () => {
    // Un statut ne se transmet jamais par la seule couleur.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cnpm-badge__dot')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cnpm-badge')?.textContent).toContain('Suspendu');
  });
});
