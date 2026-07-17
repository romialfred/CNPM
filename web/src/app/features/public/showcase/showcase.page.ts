import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { VerificationBadgeComponent } from '../../../design-system/verification-badge/verification-badge.component';
import {
  DefinitionListComponent,
  type CnpmDefinition,
} from '../../../design-system/definition-list/definition-list.component';
import { ShowcaseProjectCardComponent } from '../../../design-system/showcase-project-card/showcase-project-card.component';
import { PublicShellComponent } from '../public-shell.component';
import { SHOWCASE_GATEWAY, type MemberShowcase, type PublicationStatus } from './showcase-gateway';

type PageState = 'loading' | 'published' | 'not-public' | 'not-found';

/**
 * PUB-006 — Vitrine publique d'un membre.
 *
 * Écran pilote R0 : il valide le langage visuel de la vitrine à partir des fixtures
 * du handoff. Le module vitrine de R4 (API, migrations, modération, éditeur) reste
 * hors périmètre tant que la checklist de promotion et les décisions UX-DEC-004 à
 * UX-DEC-008 ne sont pas fermées.
 *
 * Les sections dépourvues de contenu ne sont pas rendues, conformément à la fiche :
 * une vitrine peu remplie ne doit pas afficher d'espaces morts.
 */
@Component({
  selector: 'cnpm-showcase-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PublicShellComponent,
    VerificationBadgeComponent,
    AlertComponent,
    DefinitionListComponent,
    ShowcaseProjectCardComponent,
  ],
  templateUrl: './showcase.page.html',
  styleUrl: './showcase.page.scss',
})
export class ShowcasePage {
  private readonly gateway = inject(SHOWCASE_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly state = signal<PageState>('loading');
  protected readonly showcase = signal<MemberShowcase | null>(null);
  protected readonly publicationStatus = signal<PublicationStatus | null>(null);
  /**
   * Ancres de la navigation locale.
   *
   * Seules les sections réellement rendues sont proposées : une ancre vers une
   * section absente mènerait nulle part.
   */
  protected readonly sections = computed(() => {
    const data = this.showcase();
    if (!data) {
      return [];
    }
    return [
      { id: 'faits-cles', label: 'Faits clés', shown: this.keyFacts().length > 0 },
      { id: 'activites', label: 'Activités', shown: data.activities.length > 0 },
      { id: 'realisations', label: 'Réalisations', shown: data.projects.length > 0 },
      { id: 'certifications', label: 'Certifications', shown: data.certifications.length > 0 },
      { id: 'contact', label: 'Contact', shown: this.contactFacts().length > 0 },
    ].filter((section) => section.shown);
  });

  /** Faits clés : seules les valeurs réellement renseignées sont exposées. */
  protected readonly keyFacts = computed<CnpmDefinition[]>(() => {
    const data = this.showcase();
    if (!data) {
      return [];
    }
    return [
      { label: 'Secteur', value: data.sector },
      { label: 'Forme juridique', value: data.legalForm },
      { label: 'Création', value: String(data.foundedYear) },
      { label: 'Effectif', value: data.employeeRange },
      { label: 'Implantation', value: data.location },
    ].filter((fact) => !!fact.value);
  });

  /**
   * Coordonnées publiables.
   *
   * Vide tant qu'aucun consentement horodaté n'accompagne la vitrine : le handoff
   * impose « un consentement et une date de vérification » pour publier un contact.
   * Sans eux, la section entière disparaît — publier des coordonnées sans base serait
   * un manquement, pas un détail d'affichage.
   */
  protected readonly contactFacts = computed<CnpmDefinition[]>(() => {
    const data = this.showcase();
    const contacts = data?.contacts;
    if (!contacts || !data?.contactConsent) {
      return [];
    }
    return [
      { label: 'Adresse', value: contacts.address ?? '' },
      { label: 'Téléphone', value: contacts.phone ?? '' },
      { label: 'Courriel', value: contacts.email ?? '' },
      { label: 'Horaires', value: contacts.hours ?? '' },
    ].filter((fact) => !!fact.value);
  });

  /**
   * Explication du badge.
   *
   * N'énonce que ce que le handoff établit : le statut est calculé par le CNPM et le
   * membre ne peut pas l'activer lui-même (`requirements.md`). Les critères, la durée
   * et la portée relèvent d'UX-DEC-004, non tranchée — les décrire ici reviendrait à
   * inventer une garantie institutionnelle.
   */
  protected readonly badgeExplanation = computed(
    () => 'Ce statut est attribué par le CNPM. L’entreprise membre ne peut pas l’activer elle-même.',
  );

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.gateway.findBySlug(slug).subscribe((result) => {
      if (result.outcome === 'published') {
        this.showcase.set(result.showcase);
        this.state.set('published');
        this.applySeo(result.showcase);
        return;
      }
      if (result.outcome === 'not-public') {
        this.publicationStatus.set(result.status);
        this.state.set('not-public');
        this.blockIndexing();
        return;
      }
      this.state.set('not-found');
      this.blockIndexing();
    });
  }

  private applySeo(showcase: MemberShowcase): void {
    this.title.setTitle(showcase.seoTitle);
    this.meta.updateTag({ name: 'description', content: showcase.seoDescription });
    // L'indexation suit la donnée, jamais un défaut implicite.
    this.meta.updateTag({
      name: 'robots',
      content: showcase.allowIndexing ? 'index,follow' : 'noindex,nofollow',
    });
  }

  /** Une vitrine non publique ne doit jamais être indexée. */
  private blockIndexing(): void {
    this.title.setTitle('Vitrine indisponible — CNPM');
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
  }
}
