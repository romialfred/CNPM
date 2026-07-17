import { ChangeDetectionStrategy, Component, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

/** Case à cocher du design system, intégrée aux formulaires réactifs. */
@Component({
  selector: 'cnpm-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true },
  ],
  template: `
    <label class="cnpm-checkbox">
      <input
        type="checkbox"
        class="cnpm-checkbox__control"
        [id]="id"
        [attr.name]="name() || null"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="cnpm-checkbox__label"><ng-content /></span>
    </label>
  `,
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly name = input<string>();

  protected readonly checked = model<boolean>(false);
  protected readonly disabled = signal(false);

  protected readonly id = `cnpm-checkbox-${++uniqueId}`;

  protected onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onToggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
