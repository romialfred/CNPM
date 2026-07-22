import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChevronDown,
  LucideCircleHelp,
  LucideLogOut,
  LucideSettings,
  LucideUserRound,
} from '@lucide/angular';

/**
 * Menu du compte connecté — avatar, nom et rôle en déclencheur, déroulé avec « Se
 * déconnecter » (et, en option, un accès au profil).
 *
 * Composant de mise en page partagé par le back-office et l'espace membre : la déconnexion
 * n'existait nulle part, l'utilisateur restait « piégé » connecté. Motif WAI-ARIA
 * « disclosure » : Échap ferme et rend le focus, la tabulation sortante ferme, un clic
 * hors du menu ferme. La déconnexion pointe vers `/auth/logout`.
 */
@Component({
  selector: 'cnpm-account-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LucideChevronDown,
    LucideCircleHelp,
    LucideLogOut,
    LucideSettings,
    LucideUserRound,
  ],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss',
})
export class AccountMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly name = input.required<string>();
  /** Ligne secondaire sous le nom : rôle ou organisation. */
  readonly secondary = input('');
  /** Route facultative « Mon profil » ; masquée si absente. */
  readonly profileLink = input('');
  /** Route facultative « Mes préférences » ; masquée si absente. */
  readonly preferencesLink = input('');
  /** Route facultative « Aides » ; masquée si absente. */
  readonly helpLink = input('');
  /** Identifiant stable pour les liaisons ARIA. */
  readonly menuId = input('account-menu');

  protected readonly open = signal(false);
  protected readonly panelId = computed(() => `${this.menuId()}-panel`);

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/u).filter(Boolean);
    const letters = (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '');
    return letters.toUpperCase() || '?';
  });

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open()) return;
    event.preventDefault();
    this.close();
    this.trigger()?.nativeElement.focus();
  }

  /** La tabulation hors du menu le referme : pattern disclosure, pas un piège de focus. */
  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.close();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: Event): void {
    if (!this.open()) return;
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.close();
  }

  @HostListener('window:resize')
  protected onViewportChange(): void {
    this.close();
  }
}
