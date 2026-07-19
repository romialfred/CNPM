import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi, type CnpmDataMode } from '../../../core/api/api.config';
import { ContactPage } from './contact.page';

async function setup(dataMode: CnpmDataMode = 'demo') {
  await TestBed.configureTestingModule({
    imports: [ContactPage],
    providers: [
      provideZonelessChangeDetection(),
      provideCnpmApi({ dataMode }),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'le-cnpm', children: [] },
        { path: 'services', children: [] },
        { path: 'membres', children: [] },
        { path: 'actualites', children: [] },
        { path: 'agenda', children: [] },
        { path: 'adhesion', children: [] },
        { path: 'contact', children: [] },
        { path: 'legal/:document', children: [] },
        { path: 'verification/:code', children: [] },
      ]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ContactPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

function submit(host: HTMLElement): void {
  host
    .querySelector('form')
    ?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
}

describe('ContactPage (PUB-014)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('reste fermé en mode HTTP sans destination officielle', async () => {
    const { host } = await setup('http');

    expect(host.querySelector('form')).toBeNull();
    expect(host.textContent).toContain('Canal de contact non raccordé');
    expect(host.textContent).toContain('Aucun message ne peut être envoyé');
  });

  it('expose la sémantique requise et place l’action primaire à droite', async () => {
    const { host } = await setup();
    const requiredFields = ['fullName', 'email', 'subject', 'message'];

    for (const name of requiredFields) {
      const field = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[formcontrolname="${name}"]`,
      );
      expect(field?.hasAttribute('required')).toBe(true);
      expect(field?.getAttribute('aria-required')).toBe('true');
    }
    expect(host.querySelector('[formcontrolname="organization"]')?.hasAttribute('required')).toBe(
      false,
    );

    const actions = Array.from(host.querySelectorAll<HTMLButtonElement>('.contact-actions button'));
    expect(actions.map((button) => button.textContent?.trim())).toEqual([
      'Effacer les champs',
      'Vérifier le message',
    ]);
  });

  it('annonce les erreurs et permet de focaliser le champ concerné', async () => {
    const { fixture, host } = await setup();
    submit(host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const summary = host.querySelector<HTMLElement>('.cnpm-error-summary');
    expect(summary).not.toBeNull();
    expect(document.activeElement).toBe(summary);
    expect(host.querySelector('#contact-fullName')?.getAttribute('aria-invalid')).toBe('true');

    const link = summary?.querySelector<HTMLAnchorElement>('a[href="#contact-fullName"]');
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(document.activeElement?.id).toBe('contact-fullName');
  });

  it('efface toutes les valeurs après le contrôle local sans présenter un envoi', async () => {
    const { fixture, host } = await setup();
    const values = {
      fullName: 'Awa Traoré',
      organization: 'Entreprise Exemple',
      email: 'awa@cnpm.invalid',
      subject: 'Demande de renseignement',
      message: 'Ceci est un message de test.',
    };
    const fields = host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    Object.entries(values).forEach(([name, value]) => {
      const field = Array.from(fields).find(
        (candidate) => candidate.getAttribute('formcontrolname') === name,
      );
      if (!field) throw new Error(`Champ ${name} introuvable`);
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });

    submit(host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const success = host.querySelector<HTMLElement>('.contact-success');
    expect(success?.textContent).toContain('Les valeurs saisies ont été effacées');
    expect(document.activeElement).toBe(success);
    expect(Array.from(fields).every((field) => field.value === '')).toBe(true);
    expect(host.textContent).not.toContain('Message envoyé');
  });
});
