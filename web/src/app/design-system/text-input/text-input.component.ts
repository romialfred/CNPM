import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

/**
 * Champ texte du design system avec label et message d'erreur associés.
 *
 * L'erreur est reliée au champ par `aria-describedby` et `aria-invalid` : le statut
 * n'est jamais porté par la seule couleur. Composant de présentation pur, intégré aux
 * formulaires réactifs via `ControlValueAccessor`.
 */
@Component({
  selector: 'cnpm-text-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextInputComponent), multi: true },
  ],
  template: `
    <div class="cnpm-field">
      <label class="cnpm-field__label" [for]="id">
        {{ label() }}
        @if (required()) {
          <span class="cnpm-field__required" aria-hidden="true">*</span>
        }
      </label>
      <input
        #control
        class="cnpm-field__control"
        [id]="id"
        [type]="type()"
        [attr.name]="name() || null"
        [attr.autocomplete]="autocomplete() || null"
        [attr.inputmode]="inputMode() || null"
        [attr.placeholder]="placeholder() || null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? errorId : null"
        [attr.aria-required]="required() ? 'true' : null"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (error()) {
        <p class="cnpm-field__error" [id]="errorId">
          <span class="cnpm-field__error-icon" aria-hidden="true">!</span>
          {{ error() }}
        </p>
      }
    </div>
  `,
  styleUrl: './text-input.component.scss',
})
export class TextInputComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'tel'>('text');
  readonly name = input<string>();
  readonly autocomplete = input<string>();
  readonly inputMode = input<string>();
  readonly placeholder = input<string>();
  readonly required = input(false);
  readonly error = input<string>();

  protected readonly value = model<string>('');
  protected readonly disabled = signal(false);

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  /** Place le focus clavier dans le champ (focus initial d'un écran, par exemple). */
  focusInput(): void {
    this.control()?.nativeElement.focus();
  }

  private readonly instanceId = ++uniqueId;
  protected readonly id = `cnpm-text-${this.instanceId}`;
  protected readonly errorId = `cnpm-text-error-${this.instanceId}`;

  protected onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

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
