import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OtpInputComponent } from './otp-input.component';

@Component({
  imports: [ReactiveFormsModule, OtpInputComponent],
  template: `<cnpm-otp-input [formControl]="control" [error]="error()" />`,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
  readonly error = signal<string | undefined>(undefined);
}

describe('OtpInputComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const cells = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('.cnpm-otp__cell'),
      );
    return { fixture, cells };
  }

  function type(cell: HTMLInputElement, value: string): void {
    cell.value = value;
    cell.dispatchEvent(new Event('input'));
  }

  /** jsdom ne fournit pas DataTransfer : on attache la charge du presse-papiers à la main. */
  function paste(cell: HTMLInputElement, text: string): void {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
    cell.dispatchEvent(event);
  }

  it('rend six cases pour un seul champ logique', async () => {
    const { cells } = await setup();
    expect(cells()).toHaveLength(6);
  });

  it('annonce la position de chaque case', async () => {
    const { cells } = await setup();
    expect(cells()[0].getAttribute('aria-label')).toBe('Chiffre 1 sur 6');
    expect(cells()[5].getAttribute('aria-label')).toBe('Chiffre 6 sur 6');
  });

  it('porte autocomplete one-time-code sur la première case', async () => {
    const { cells } = await setup();
    expect(cells()[0].getAttribute('autocomplete')).toBe('one-time-code');
  });

  it('concatène la saisie dans la valeur du formulaire', async () => {
    const { fixture, cells } = await setup();
    type(cells()[0], '1');
    type(cells()[1], '2');
    expect(fixture.componentInstance.control.value).toBe('12');
  });

  it('ignore les caractères non numériques', async () => {
    const { fixture, cells } = await setup();
    type(cells()[0], 'a');
    expect(fixture.componentInstance.control.value).toBe('');
  });

  it('répartit un code collé sur toutes les cases', async () => {
    const { fixture, cells } = await setup();
    paste(cells()[0], '123456');
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe('123456');
    expect(cells().map((cell) => cell.value)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('ignore le texte collé sans chiffre', async () => {
    const { fixture, cells } = await setup();
    paste(cells()[0], 'aucun-chiffre');

    expect(fixture.componentInstance.control.value).toBe('');
  });

  it('efface la case précédente sur retour arrière quand la case est vide', async () => {
    const { fixture, cells } = await setup();
    type(cells()[0], '1');
    fixture.detectChanges();

    cells()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe('');
  });

  it('relie le message d’erreur au groupe', async () => {
    const { fixture } = await setup();
    fixture.componentInstance.error.set('Code invalide.');
    fixture.detectChanges();

    const group = (fixture.nativeElement as HTMLElement).querySelector('.cnpm-otp');
    const describedBy = group?.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const message = (fixture.nativeElement as HTMLElement).querySelector(`#${describedBy}`);
    expect(message?.textContent).toContain('Code invalide.');
  });

  it('reflète une valeur écrite depuis le formulaire', async () => {
    const { fixture, cells } = await setup();
    fixture.componentInstance.control.setValue('987654');
    fixture.detectChanges();

    expect(cells().map((cell) => cell.value)).toEqual(['9', '8', '7', '6', '5', '4']);
  });
});
