import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

/**
 * Champ mot de passe avec bascule afficher/masquer accessible.
 *
 * Le bouton de bascule expose son état via `aria-pressed` et un libellé explicite ;
 * la valeur n'est jamais placée dans l'URL, un log ou analytics (responsabilité de la
 * page appelante). Intégré aux formulaires réactifs via `ControlValueAccessor`.
 */
@Component({
  selector: 'cnpm-password-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="cnpm-field">
      <label class="cnpm-field__label" [for]="id">
        {{ label() }}
        @if (required()) {
          <span class="cnpm-field__required" aria-hidden="true">*</span>
        }
      </label>
      <div class="cnpm-password">
        <input
          class="cnpm-field__control cnpm-password__control"
          [id]="id"
          [type]="revealed() ? 'text' : 'password'"
          [attr.name]="name() || null"
          [attr.autocomplete]="autocomplete()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? errorId : null"
          [attr.aria-required]="required() ? 'true' : null"
          [value]="value()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
        <button
          type="button"
          class="cnpm-password__toggle"
          [attr.aria-pressed]="revealed() ? 'true' : 'false'"
          [attr.aria-label]="revealed() ? hideLabel() : showLabel()"
          [disabled]="disabled()"
          (click)="toggle()"
        >
          {{ revealed() ? hideLabel() : showLabel() }}
        </button>
      </div>
      @if (error()) {
        <p class="cnpm-field__error" [id]="errorId">
          <span class="cnpm-field__error-icon" aria-hidden="true">!</span>
          {{ error() }}
        </p>
      }
    </div>
  `,
  styleUrl: './password-input.component.scss',
})
export class PasswordInputComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly name = input<string>();
  readonly autocomplete = input('current-password');
  readonly required = input(false);
  readonly error = input<string>();
  readonly showLabel = input('Afficher le mot de passe');
  readonly hideLabel = input('Masquer le mot de passe');

  protected readonly value = model<string>('');
  protected readonly disabled = signal(false);
  protected readonly revealed = signal(false);

  private readonly instanceId = ++uniqueId;
  protected readonly id = `cnpm-password-${this.instanceId}`;
  protected readonly errorId = `cnpm-password-error-${this.instanceId}`;

  protected onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected toggle(): void {
    this.revealed.update((current) => !current);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
