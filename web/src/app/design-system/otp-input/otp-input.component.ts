import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

/**
 * Saisie d'un code à usage unique : plusieurs cases visuelles, un seul champ logique.
 *
 * Conforme au patron 2FA du handoff : saisie clavier, collage global du code entier
 * dans n'importe quelle case, `autocomplete="one-time-code"`, `inputmode="numeric"`.
 * Le groupe porte un label accessible et chaque case annonce sa position. La valeur
 * concaténée est exposée aux formulaires réactifs via `ControlValueAccessor`.
 */
@Component({
  selector: 'cnpm-otp-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OtpInputComponent), multi: true },
  ],
  template: `
    <div
      class="cnpm-otp"
      role="group"
      [attr.aria-label]="label()"
      [attr.aria-describedby]="error() ? errorId : null"
    >
      @for (cell of cells(); track $index) {
        <input
          #box
          class="cnpm-otp__cell"
          type="text"
          inputmode="numeric"
          maxlength="1"
          [attr.autocomplete]="$index === 0 ? 'one-time-code' : 'off'"
          [attr.aria-label]="cellLabel($index)"
          [attr.aria-invalid]="error() ? 'true' : null"
          [value]="cell"
          [disabled]="disabled()"
          (input)="onInput($index, $event)"
          (keydown)="onKeydown($index, $event)"
          (paste)="onPaste($event)"
          (focus)="onFocus($event)"
          (blur)="onTouched()"
        />
      }
    </div>
    @if (error()) {
      <p class="cnpm-otp__error" [id]="errorId">
        <span class="cnpm-otp__error-icon" aria-hidden="true">!</span>
        {{ error() }}
      </p>
    }
  `,
  styleUrl: './otp-input.component.scss',
})
export class OtpInputComponent implements ControlValueAccessor {
  readonly length = input(6);
  readonly label = input('Code de vérification');
  readonly error = input<string>();

  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  protected readonly cells = signal<string[]>(Array.from({ length: 6 }, () => ''));
  protected readonly disabled = signal(false);

  protected readonly errorId = `cnpm-otp-error-${++uniqueId}`;

  protected onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Aligne le nombre de cases sur la longueur demandée, en préservant les chiffres
    // déjà saisis. Sans cela, une longueur autre que 6 laisserait un décalage entre
    // les cases rendues et la valeur logique.
    effect(() => {
      const target = this.length();
      const current = this.cells();
      if (current.length !== target) {
        this.cells.set(Array.from({ length: target }, (_, i) => current[i] ?? ''));
      }
    });
  }

  protected cellLabel(index: number): string {
    return `Chiffre ${index + 1} sur ${this.length()}`;
  }

  /** Place le focus sur la première case (arrivée sur l'écran, reprise après erreur). */
  focusFirstCell(): void {
    this.focusBox(0);
  }

  protected onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected onInput(index: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const digit = raw.replace(/\D/g, '').slice(-1);
    this.setCell(index, digit);
    if (digit) {
      this.focusBox(index + 1);
    }
  }

  protected onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (this.cells()[index]) {
        this.setCell(index, '');
      } else {
        this.focusBox(index - 1);
        this.setCell(index - 1, '');
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.focusBox(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.focusBox(index + 1);
      event.preventDefault();
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!pasted) {
      return;
    }
    const digits = pasted.slice(0, this.length()).split('');
    const next = Array.from({ length: this.length() }, (_, i) => digits[i] ?? '');
    this.cells.set(next);
    this.emit();
    // Placer le focus sur la première case vide, ou la dernière si le code est complet.
    const firstEmpty = next.findIndex((cell) => !cell);
    this.focusBox(firstEmpty === -1 ? this.length() - 1 : firstEmpty);
  }

  private setCell(index: number, value: string): void {
    if (index < 0 || index >= this.length()) {
      return;
    }
    const next = [...this.cells()];
    next[index] = value;
    this.cells.set(next);
    this.emit();
  }

  private focusBox(index: number): void {
    const boxes = this.boxes();
    if (index >= 0 && index < boxes.length) {
      boxes[index].nativeElement.focus();
    }
  }

  private emit(): void {
    this.onChange(this.cells().join(''));
  }

  writeValue(value: string | null): void {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, this.length()).split('');
    this.cells.set(Array.from({ length: this.length() }, (_, i) => digits[i] ?? ''));
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
