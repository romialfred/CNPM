import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '../../../design-system/toast/toast.service';
import { DemoMemberHomeGateway } from './demo-member-home.gateway';
import { MEMBER_HOME_GATEWAY } from './member-home-gateway';
import { MemberHomePage } from './member-home.page';

registerLocaleData(localeFrMl);

describe('MemberHomePage', () => {
  let fixture: ComponentFixture<MemberHomePage>;
  let host: HTMLElement;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MemberHomePage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr-ML' },
        { provide: MEMBER_HOME_GATEWAY, useClass: DemoMemberHomeGateway },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberHomePage);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 240));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('annonce le chargement plutôt qu’une page blanche', () => {
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.textContent).toContain('Chargement de votre espace membre');
  });

  it('rend le shell, un titre h1 unique et la composition MP-001', async () => {
    await settle();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('h1')?.textContent).toContain('Bienvenue');
    expect(host.querySelector('.member-shell__brand img')).not.toBeNull();
    expect(host.querySelectorAll('.member-home__metrics > button')).toHaveLength(4);
    expect(
      host.querySelectorAll(
        '.member-home__dashboard-grid > section, .member-home__side-stack > section',
      ),
    ).toHaveLength(5);
  });

  it('affiche une situation financière de démonstration cohérente et explicitement fictive', async () => {
    await settle();

    const text = host.textContent ?? '';
    const normalizedText = text.replaceAll(/\s/g, ' ');
    expect(text).toContain('Démonstration — données 100 % fictives');
    expect(text).toContain('Sahel Agro SA');
    expect(text).toContain('CNPM-DEMO-0142');
    expect(normalizedText).toContain('1 350 000');
    expect(normalizedText).toContain('dont 450 000 FCFA échus');
    expect(text).toContain('30/09/2026');
  });

  it('n’expose aucun KPI global CNPM ni lien vers une route membre absente', async () => {
    await settle();

    const text = host.textContent ?? '';
    expect(text).not.toContain('Membres actifs');
    expect(text).not.toContain('Taux de recouvrement');
    expect(text).not.toContain('Nouveaux membres');

    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a'));
    expect(links.length).toBeGreaterThan(0);
    expect(new Set(links.map((link) => link.getAttribute('href')))).toEqual(
      new Set([
        '#contenu-principal',
        '/member/home',
        '/member/contributions',
        '/member/payments',
        '/member/receipts',
        '/member/requests',
        '/member/documents',
        '/member/profile',
        '/member/users',
        '/member/showcase/edit',
        '/member/showcase/analytics',
        '/member/directory',
      ]),
    );
  });

  it('rend les indisponibilités explicites au lieu de simuler une opération', async () => {
    const toast = TestBed.inject(ToastService);
    const info = vi.spyOn(toast, 'info');
    await settle();

    const payment = host.querySelector<HTMLButtonElement>('.member-home__payment');
    payment?.click();

    expect(payment?.textContent).toContain('Payer maintenant');
    expect(info).toHaveBeenCalledWith(expect.stringContaining('Aucune opération n’a été initiée'));
  });

  it('personnalise l’accueil et garde la démonstration explicitement signalée sans bandeau structurel', async () => {
    await settle();

    expect(host.querySelector('h1')?.textContent).toContain('Bienvenue, Awa');
    expect(host.querySelector('.member-home__demo-note')?.textContent).toContain(
      'données 100 % fictives',
    );
    expect(host.querySelector('main > cnpm-alert')).toBeNull();
  });

  it('sauvegarde la requête comme brouillon local sans prétendre l’envoyer', async () => {
    await settle();

    const subject = host.querySelector<HTMLInputElement>('#request-subject');
    if (!subject) throw new Error('Champ objet absent');
    subject.value = 'Demande fictive conservée localement';
    subject.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const stored = sessionStorage.getItem('cnpm-demo-member-request-draft');
    expect(stored).toContain('Demande fictive conservée localement');
    expect(host.querySelector('.member-home__draft-status')?.textContent).toContain(
      'aucun envoi au CNPM',
    );
  });

  it('associe les champs de la requête à leurs labels et expose la progression', async () => {
    await settle();

    for (const id of ['request-type', 'request-subject', 'request-message']) {
      expect(host.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(host.querySelector(`#${id}`)).not.toBeNull();
    }

    const progress = host.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute('aria-valuenow')).toBe('80');
    expect(host.querySelector('main#contenu-principal')).not.toBeNull();
  });
});
