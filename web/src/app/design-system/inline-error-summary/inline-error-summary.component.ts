import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';

export interface CnpmFieldError {
  /** `id` du champ fautif : le lien du résumé y déplace le focus. */
  readonly fieldId: string;
  readonly message: string;
}

/**
 * Résumé d'erreurs de formulaire — `InlineErrorSummary` (FDB-004).
 *
 * États du catalogue : `hidden`, `visible`. La règle clé : le résumé **reçoit le
 * focus** dès qu'il paraît. À la soumission d'un formulaire invalide, le focus doit
 * atterrir sur la liste des erreurs plutôt que rester sur le bouton d'envoi ; sinon un
 * utilisateur au clavier ou au lecteur d'écran ne sait pas pourquoi rien ne s'est
 * passé.
 *
 * Chaque erreur est un lien vers le champ concerné : l'utilisateur y accède
 * directement au lieu de chercher lequel, dans un long formulaire, est en faute.
 */
@Component({
  selector: 'cnpm-inline-error-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errors().length > 0) {
      <div
        #summary
        class="cnpm-error-summary"
        role="alert"
        tabindex="-1"
        [attr.aria-labelledby]="'error-summary-title'"
      >
        <p class="cnpm-error-summary__title" id="error-summary-title">
          {{ errors().length }}
          {{ errors().length === 1 ? 'erreur à corriger' : 'erreurs à corriger' }}
        </p>
        <ul class="cnpm-error-summary__list">
          @for (error of errors(); track error.fieldId) {
            <li>
              <a class="cnpm-error-summary__link" [href]="'#' + error.fieldId">
                {{ error.message }}
              </a>
            </li>
          }
        </ul>
      </div>
    }
  `,
  styleUrl: './inline-error-summary.component.scss',
})
export class InlineErrorSummaryComponent {
  readonly errors = input.required<readonly CnpmFieldError[]>();

  private readonly summary = viewChild<ElementRef<HTMLElement>>('summary');
  private lastCount = 0;

  constructor() {
    // Le focus n'est déplacé qu'au passage de zéro à au moins une erreur : le déplacer
    // à chaque cycle piégerait le focus sur le résumé pendant que l'utilisateur corrige
    // ses champs.
    //
    // L'effet dépend AUSSI de `summary()` : au tick où les erreurs passent de 0 à N,
    // le `@if` vient tout juste de créer l'élément et le `viewChild` n'est pas encore
    // résolu. On ne consomme donc la transition (avancer `lastCount`) qu'une fois
    // l'élément disponible — sa résolution réveille l'effet, qui pose alors le focus.
    effect(() => {
      const count = this.errors().length;
      const element = this.summary()?.nativeElement;
      if (count === 0) {
        this.lastCount = 0;
        return;
      }
      if (this.lastCount === 0 && element) {
        element.focus();
        this.lastCount = count;
      }
    });
  }
}
