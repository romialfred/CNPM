import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  effect,
  viewChild,
} from '@angular/core';
import { LucideX } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';

let dialogInstanceCount = 0;

/**
 * Dialogue modal accessible — fondation partagée des popups premium (création de
 * compte, enrôlement 2FA…).
 *
 * L'ouverture est CONTRÔLÉE par le parent (`[open]`), jamais un état interne : le parent
 * possède la vérité (une popup forcée d'enrôlement ne doit pas pouvoir se fermer d'un
 * clic si la politique l'interdit). Le composant se contente d'émettre `close` sur les
 * gestes de fermeture ; le parent décide d'obtempérer.
 *
 * Accessibilité (WCAG 2.2) :
 * - `role="dialog"` + `aria-modal="true"`, nom accessible porté par le titre (`aria-labelledby`) ;
 * - piège de focus : Tab et Maj+Tab bouclent dans le dialogue (2.4.3, 2.1.2) ;
 * - Échap ferme (`dismissible` le permet), le focus revient à l'élément qui a ouvert
 *   le dialogue (2.4.3) ;
 * - le corps de page est verrouillé au défilement tant que le dialogue est ouvert ;
 * - le mouvement est neutralisé sous `prefers-reduced-motion`.
 */
@Component({
  selector: 'cnpm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:keydown.tab)': 'trapFocus($event)',
  },
  template: `
    @if (open()) {
      <!-- Le voile ferme au clic hors du panneau, jamais au clic dans le panneau. On
           écoute mousedown sur le voile lui-même, pour qu'un glissement de sélection
           démarré dans le panneau et relâché sur le voile ne ferme pas par erreur. -->
      <div
        class="cnpm-dialog__scrim"
        (mousedown)="onScrim($event)"
        data-cnpm-dialog-scrim
      >
        <div
          #panel
          class="cnpm-dialog__panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="describedBy() || null"
          tabindex="-1"
        >
          <header class="cnpm-dialog__header">
            <div class="cnpm-dialog__heading">
              @if (eyebrow()) {
                <p class="cnpm-dialog__eyebrow">{{ eyebrow() }}</p>
              }
              <h2 class="cnpm-dialog__title" [id]="titleId">{{ title() }}</h2>
            </div>
            @if (dismissible()) {
              <button
                #closeButton
                type="button"
                class="cnpm-dialog__close"
                (click)="dismiss.emit()"
                [attr.aria-label]="closeLabel()"
              >
                <svg lucideX [size]="iconSize.control" aria-hidden="true"></svg>
              </button>
            }
          </header>

          <div class="cnpm-dialog__body">
            <ng-content />
          </div>

          <!-- Pied projeté : actions du dialogue. Rendu seulement s'il est fourni. -->
          <footer class="cnpm-dialog__footer">
            <ng-content select="[cnpm-dialog-footer]" />
          </footer>
        </div>
      </div>
    }
  `,
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  /** Surtitre optionnel, au-dessus du titre. */
  readonly eyebrow = input<string>();
  /** `id` d'un élément décrivant le dialogue, repris par `aria-describedby`. */
  readonly describedBy = input<string>();
  /**
   * Fermeture par Échap, voile et bouton de fermeture. `false` pour une popup forcée
   * (enrôlement 2FA obligatoire) qu'on ne peut pas simplement écarter.
   */
  readonly dismissible = input(true);
  readonly closeLabel = input('Fermer');

  readonly dismiss = output<void>();

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly titleId = `cnpm-dialog-title-${(dialogInstanceCount += 1)}`;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly host = inject(ElementRef<HTMLElement>);

  private previouslyFocused: HTMLElement | null = null;
  private previousBodyOverflow = '';

  constructor() {
    // L'ouverture/fermeture pilote le focus et le verrou de défilement. `effect` réagit
    // à `open()` ; le focus est posé après le rendu du panneau.
    effect(() => {
      const doc = this.host.nativeElement.ownerDocument;
      if (this.open()) {
        this.previouslyFocused = doc.activeElement as HTMLElement | null;
        this.previousBodyOverflow = doc.body.style.overflow;
        doc.body.style.overflow = 'hidden';
        // Le panneau existe au prochain tick : on y place le focus initial.
        queueMicrotask(() => {
          const cible =
            this.closeButton()?.nativeElement ??
            this.firstFocusable() ??
            this.panel()?.nativeElement;
          cible?.focus();
        });
      } else {
        doc.body.style.overflow = this.previousBodyOverflow;
        this.previouslyFocused?.focus();
        this.previouslyFocused = null;
      }
    });
  }

  protected onEscape(): void {
    if (this.open() && this.dismissible()) {
      this.dismiss.emit();
    }
  }

  protected onScrim(event: MouseEvent): void {
    // Uniquement le voile lui-même, pas un enfant : le clic dans le panneau ne ferme pas.
    if (this.dismissible() && (event.target as HTMLElement).hasAttribute('data-cnpm-dialog-scrim')) {
      this.dismiss.emit();
    }
  }

  protected trapFocus(event: Event): void {
    if (!this.open()) {
      return;
    }
    const keyboard = event as KeyboardEvent;
    const focusables = this.focusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      this.panel()?.nativeElement.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.host.nativeElement.ownerDocument.activeElement;
    if (keyboard.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!keyboard.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!this.panel()?.nativeElement.contains(active as Node)) {
      // Le focus a fui hors du dialogue : on le ramène au premier élément.
      event.preventDefault();
      first.focus();
    }
  }

  private firstFocusable(): HTMLElement | null {
    return this.focusableElements()[0] ?? null;
  }

  private focusableElements(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    if (!panel) {
      return [];
    }
    // Pas de filtre `offsetParent` : il vaut `null` pour un contenu en `position: fixed`
    // et exclurait à tort des éléments pourtant visibles. Le sélecteur écarte déjà les
    // contrôles désactivés et `tabindex="-1"` ; le contenu masqué relève du parent.
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(panel.querySelectorAll<HTMLElement>(selector));
  }
}
