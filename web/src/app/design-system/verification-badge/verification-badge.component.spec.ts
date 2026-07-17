import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type CnpmVerificationStatus,
  VerificationBadgeComponent,
} from './verification-badge.component';

@Component({
  imports: [VerificationBadgeComponent],
  template: `
    <cnpm-verification-badge [status]="status()" explanation="Statut constaté par le CNPM." />
    <cnpm-verification-badge [status]="status()" explanation="Second badge sur la même page." />
  `,
})
class HostComponent {
  readonly status = signal<CnpmVerificationStatus>('VERIFIED');
}

describe('VerificationBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('rend un membre suspendu avec le ton d’alerte error', () => {
    // Statut de conformité : une régression du mapping (SUSPENDED retombant sur un ton
    // neutre) afficherait un membre suspendu comme banal, sans que rien n'échoue.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.status.set('SUSPENDED');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.cnpm-badge') as HTMLElement;
    expect(badge.classList.contains('cnpm-badge--error')).toBe(true);
    expect(badge.textContent).toContain('suspendu');
  });

  it('donne à chaque instance un identifiant de panneau unique', () => {
    // Deux badges sur une page ne doivent pas produire d'id dupliqué : aria-controls
    // serait ambigu (WCAG 4.1.1/4.1.2).
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const panels = fixture.nativeElement.querySelectorAll(
      '.cnpm-verification__panel',
    ) as NodeListOf<HTMLElement>;
    expect(panels).toHaveLength(2);
    const ids = Array.from(panels).map((p) => p.id);
    expect(ids[0]).not.toBe(ids[1]);
    // Chaque déclencheur pilote bien son propre panneau.
    const triggers = fixture.nativeElement.querySelectorAll(
      '.cnpm-verification__trigger',
    ) as NodeListOf<HTMLElement>;
    expect(triggers[0].getAttribute('aria-controls')).toBe(ids[0]);
    expect(triggers[1].getAttribute('aria-controls')).toBe(ids[1]);
  });
});
