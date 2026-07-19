import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  LucideAward,
  LucideBuilding2,
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideDownload,
  LucideHardHat,
  LucideLayers,
  LucideMapPin,
  LucideRuler,
  LucideScale,
  LucideShieldCheck,
  LucideTrafficCone,
  LucideUsers,
  LucideWrench,
} from '@lucide/angular';
import { ActivatedRoute } from '@angular/router';
import { PageSeoService } from '../../../core/seo/page-seo.service';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import { VerificationBadgeComponent } from '../../../design-system/verification-badge/verification-badge.component';
import {
  PublicShellComponent,
  type PublicFooterContact,
} from '../public-shell.component';
import {
  SHOWCASE_GATEWAY,
  type MemberShowcase,
  type PublicationStatus,
  type ShowcaseKeyFact,
} from './showcase-gateway';

type PageState = 'loading' | 'published' | 'not-public' | 'not-found';

/**
 * PUB-006 — Vitrine publique d'un membre.
 *
 * Écran pilote R0 : il valide le langage visuel de la vitrine. Le module vitrine de R4
 * (API, migrations, modération, éditeur) reste hors périmètre tant que la checklist de
 * promotion et les décisions UX-DEC-004 à UX-DEC-008 ne sont pas fermées.
 *
 * Les sections dépourvues de contenu ne sont pas rendues, conformément à la fiche :
 * une vitrine peu remplie ne doit pas afficher d'espaces morts.
 */
@Component({
  selector: 'cnpm-showcase-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    PublicShellComponent,
    VerificationBadgeComponent,
    AlertComponent,
    ButtonComponent,
    LucideAward,
    LucideBuilding2,
    LucideCalendarDays,
    LucideChevronLeft,
    LucideChevronRight,
    LucideDownload,
    LucideHardHat,
    LucideLayers,
    LucideMapPin,
    LucideRuler,
    LucideScale,
    LucideShieldCheck,
    LucideTrafficCone,
    LucideUsers,
    LucideWrench,
  ],
  templateUrl: './showcase.page.html',
  styleUrls: ['./showcase.page.scss', './showcase.visuals.scss', './showcase.responsive.scss'],
})
export class ShowcasePage {
  private readonly gateway = inject(SHOWCASE_GATEWAY);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(PageSeoService);

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly state = signal<PageState>('loading');
  protected readonly showcase = signal<MemberShowcase | null>(null);
  protected readonly publicationStatus = signal<PublicationStatus | null>(null);
  /** Index du témoignage affiché ; le carrousel n'expose qu'une citation à la fois. */
  protected readonly testimonialIndex = signal(0);


  /**
   * Ancres proposées à la navigation principale.
   *
   * « À propos » désigne l'en-tête de la vitrine et « Contact » le bloc de coordonnées
   * du pied de page — qui n'existe que si les coordonnées sont publiables. Aucune
   * rubrique sans contenu (produits, actualités) n'est annoncée : la maquette les
   * prévoit, mais aucune source ne les alimente et un onglet vide se remarque plus
   * qu'une absence.
   */

  /** Bandeau de faits : seules les valeurs réellement renseignées sont exposées. */
  protected readonly keyFacts = computed<readonly ShowcaseKeyFact[]>(() => {
    const data = this.showcase();
    if (!data) {
      return [];
    }
    return [
      { id: 'secteur', label: 'Secteur d’activité', value: data.sector, icon: 'sector' as const },
      { id: 'lieu', label: 'Localisation', value: data.location, icon: 'location' as const },
      { id: 'effectif', label: 'Effectif', value: data.employeeRange, icon: 'people' as const },
      {
        id: 'creation',
        label: 'Année de création',
        value: String(data.foundedYear),
        icon: 'calendar' as const,
      },
      { id: 'statut', label: 'Statut', value: data.legalForm, icon: 'legal' as const },
      {
        id: 'adhesion',
        label: 'Membre CNPM',
        // Le statut est écrit, jamais porté par la seule couleur du bandeau.
        value: `Membre actif depuis ${data.memberSince}`,
        icon: 'member' as const,
      },
    ].filter((fact) => !!fact.value);
  });

  /** Ligne de méta sous les actions du héros. */
  protected readonly heroMeta = computed<readonly string[]>(() => {
    const data = this.showcase();
    if (!data) {
      return [];
    }
    return [
      data.location,
      data.employeeRange ? `${data.employeeRange} collaborateurs` : '',
      data.foundedYear ? `Depuis ${data.foundedYear}` : '',
    ].filter((entry) => !!entry);
  });

  /**
   * Coordonnées publiables.
   *
   * Vide tant qu'aucun consentement horodaté n'accompagne la vitrine : le handoff
   * impose « un consentement et une date de vérification » pour publier un contact.
   * Sans eux, tout le bloc disparaît — publier des coordonnées sans base serait un
   * manquement, pas un détail d'affichage.
   */
  protected readonly footerContact = computed<PublicFooterContact | null>(() => {
    const data = this.showcase();
    if (!data?.contactConsent) {
      return null;
    }
    const { phone, email, address, hours } = data.contacts;
    if (!phone && !email && !address && !hours) {
      return null;
    }
    return { phone, email, address, hours };
  });

  /** Mention d'adhésion affichée dans l'en-tête public. */
  protected readonly memberBadge = computed(() => {
    const data = this.showcase();
    return data ? `Membre CNPM — Membre actif depuis ${data.memberSince}` : null;
  });

  protected readonly testimonial = computed(() => {
    const list = this.showcase()?.testimonials ?? [];
    return list.length ? list[this.testimonialIndex() % list.length] : null;
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
    () =>
      'Ce statut est attribué par le CNPM. L’entreprise membre ne peut pas l’activer elle-même.',
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
        this.blockIndexing(slug);
        return;
      }
      this.state.set('not-found');
      this.blockIndexing(slug);
    });
  }

  /** Défilement circulaire : le carrousel ne présente jamais de bouton sans effet. */
  protected moveTestimonial(step: number): void {
    const total = this.showcase()?.testimonials.length ?? 0;
    if (total < 2) {
      return;
    }
    this.testimonialIndex.update((index) => (index + step + total) % total);
  }

  private applySeo(showcase: MemberShowcase): void {
    this.seo.apply({
      title: showcase.seoTitle,
      description: showcase.seoDescription,
      // Un contenu non alimenté par l'API R4 n'est jamais indexé, même s'il porte un consentement.
      robots:
        !showcase.isDemoContent && showcase.allowIndexing ? 'index,follow' : 'noindex,nofollow',
      canonicalPath: `/membres/${encodeURIComponent(showcase.slug)}`,
    });
  }

  /** Une vitrine non publique ne doit jamais être indexée. */
  private blockIndexing(slug: string): void {
    this.seo.apply({
      title: 'Vitrine indisponible — CNPM',
      description: 'Cette vitrine membre n’est pas disponible publiquement.',
      robots: 'noindex,nofollow',
      canonicalPath: `/membres/${encodeURIComponent(slug)}`,
    });
  }
}
