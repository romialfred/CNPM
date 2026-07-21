import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DialogComponent } from './dialog.component';

@Component({
  imports: [DialogComponent],
  template: `
    <button type="button" class="ouvreur">Ouvrir</button>
    <cnpm-dialog
      [open]="open()"
      [dismissible]="dismissible()"
      title="Nouveau compte"
      eyebrow="Administration"
      (dismiss)="onClose()"
    >
      <input class="premier-champ" />
      <button type="button" cnpm-dialog-footer class="valider">Valider</button>
    </cnpm-dialog>
  `,
})
class HoteDialogue {
  readonly open = signal(false);
  readonly dismissible = signal(true);
  fermetures = 0;
  onClose(): void {
    this.fermetures += 1;
  }
}

async function monter() {
  await TestBed.configureTestingModule({
    imports: [HoteDialogue],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(HoteDialogue);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement, cmp: fixture.componentInstance };
}

describe('DialogComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('ne rend rien tant qu il est fermé', async () => {
    const { host } = await monter();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('expose un dialogue modal nommé par son titre et verrouille le défilement', async () => {
    const { fixture, host, cmp } = await monter();
    cmp.open.set(true);
    fixture.detectChanges();

    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    const titleId = dialog?.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(host.querySelector(`#${titleId}`)?.textContent).toContain('Nouveau compte');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('émet close sur Échap, le bouton de fermeture et le voile quand il est fermable', async () => {
    const { fixture, host, cmp } = await monter();
    cmp.open.set(true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    host.querySelector<HTMLButtonElement>('.cnpm-dialog__close')?.click();
    host.querySelector<HTMLElement>('[data-cnpm-dialog-scrim]')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );

    expect(cmp.fermetures).toBe(3);
  });

  it('n émet pas close sur Échap ni voile quand il n est pas fermable', async () => {
    const { fixture, host, cmp } = await monter();
    cmp.dismissible.set(false);
    cmp.open.set(true);
    fixture.detectChanges();

    // Sans bouton de fermeture, la popup forcée ne peut pas s'écarter d'un simple geste.
    expect(host.querySelector('.cnpm-dialog__close')).toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    host.querySelector<HTMLElement>('[data-cnpm-dialog-scrim]')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    expect(cmp.fermetures).toBe(0);
  });

  it('restitue le défilement du corps à la fermeture', async () => {
    const { fixture, cmp } = await monter();
    cmp.open.set(true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    cmp.open.set(false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });
});
