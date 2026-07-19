import { DOCUMENT } from '@angular/common';
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
import { LucideChevronDown } from '@lucide/angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CNPM_ICON_SIZE } from '../icon/icon';

/** Destination d'un menu déroulant : un libellé, une route interne. */
export interface CnpmNavMenuItem {
  readonly label: string;
  readonly routerLink: string;
  /** Précision facultative affichée sous le libellé. */
  readonly hint?: string;
  /** Correspondance exacte requise (routes racines comme « / »). */
  readonly exact?: boolean;
}

/**
 * Menu de navigation déroulant — pattern WAI-ARIA « disclosure navigation ».
 *
 * Composant générique du design system : il ne connaît aucune destination ni aucun
 * service métier, tout lui est fourni en entrée.
 *
 * Le déroulé n'est pas une boîte de dialogue : le focus n'y est donc pas piégé, la
 * tabulation en sort naturellement — et referme le menu, conformément au pattern.
 * Échap referme et rend le focus au déclencheur.
 */
@Component({
  selector: 'cnpm-nav-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideChevronDown],
  template: `
    <div class="cnpm-nav-menu" [class.cnpm-nav-menu--open]="open()">
      <button
        #trigger
        class="cnpm-nav-menu__trigger"
        type="button"
        [id]="triggerId()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="panelId()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        {{ label() }}
        <svg
          class="cnpm-nav-menu__chevron"
          lucideChevronDown
          [size]="iconSize.compact"
          aria-hidden="true"
        ></svg>
      </button>

      @if (open()) {
        <div class="cnpm-nav-menu__panel" [id]="panelId()">
          <ul class="cnpm-nav-menu__list" [attr.aria-labelledby]="triggerId()">
            @for (item of items(); track item.routerLink) {
              <li>
                <a
                  class="cnpm-nav-menu__link"
                  [routerLink]="item.routerLink"
                  routerLinkActive="cnpm-nav-menu__link--active"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  ariaCurrentWhenActive="page"
                  (click)="close()"
                >
                  <span class="cnpm-nav-menu__link-label">{{ item.label }}</span>
                  @if (item.hint) {
                    <span class="cnpm-nav-menu__link-hint">{{ item.hint }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styleUrl: './nav-menu.component.scss',
})
export class NavMenuComponent {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly label = input.required<string>();
  readonly items = input.required<readonly CnpmNavMenuItem[]>();
  /** Identifiant stable, base des liaisons ARIA entre déclencheur et panneau. */
  readonly menuId = input.required<string>();

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly open = signal(false);
  protected readonly triggerId = computed(() => `${this.menuId()}-trigger`);
  protected readonly panelId = computed(() => `${this.menuId()}-panel`);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  /**
   * Échap referme et rend le focus au déclencheur, sans quoi le focus resterait sur un
   * lien devenu invisible.
   *
   * L'écoute est au niveau du document, pas de l'hôte : un menu ouvert alors que le
   * focus se trouve ailleurs dans la page ne recevrait jamais l'événement, et resterait
   * ouvert sous la touche Échap.
   */
  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open()) return;
    event.preventDefault();
    this.close();
    this.trigger()?.nativeElement.focus();
  }

  /** La tabulation hors du menu le referme : c'est le pattern disclosure, pas un piège. */
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

  /** Referme si la page défile sous un menu ouvert, qui resterait sinon détaché. */
  @HostListener('window:resize')
  protected onViewportChange(): void {
    this.close();
  }

  protected get ownerDocument(): Document {
    return this.document;
  }
}
