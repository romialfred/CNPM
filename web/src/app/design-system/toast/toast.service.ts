import { computed, Injectable, signal } from '@angular/core';
import type { CnpmToast, CnpmToastOptions, CnpmToastTone } from './toast.model';

const DEFAULT_DURATION_MS = 5000;

/**
 * File des toasts — support de `Toast` (FDB-003).
 *
 * `feedback-states.md` : « Un toast ne porte jamais une information financière critique
 * comme unique confirmation. » Le service ne peut pas contrôler le contenu qu'on lui
 * confie ; la règle est rappelée ici et vérifiée en revue. Ce qu'il garantit, en
 * revanche : les erreurs et les toasts porteurs d'une action ne disparaissent jamais
 * seuls, pour ne pas escamoter un message qui appelle une lecture ou un geste.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly CnpmToast[]>([]);
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = this.items.asReadonly();

  /** Toasts annoncés poliment (succès, information) : ils n'interrompent pas la lecture. */
  readonly politeToasts = computed(() => this.items().filter((toast) => toast.tone !== 'error'));
  /** Toasts annoncés avec assertivité (erreur) : ils interrompent, car ils bloquent l'action. */
  readonly assertiveToasts = computed(() => this.items().filter((toast) => toast.tone === 'error'));

  show(message: string, options: CnpmToastOptions = {}): number {
    const tone: CnpmToastTone = options.tone ?? 'info';
    const id = this.nextId++;
    this.items.update((current) => [...current, { id, tone, message, action: options.action }]);

    // Persistant si erreur, si une action est proposée, ou si la durée demandée est 0 :
    // aucun de ces cas ne doit s'effacer sans lecture ni geste.
    const persistent = tone === 'error' || options.action != null || options.durationMs === 0;
    if (!persistent) {
      const duration = options.durationMs ?? DEFAULT_DURATION_MS;
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      );
    }
    return id;
  }

  success(message: string, options: Omit<CnpmToastOptions, 'tone'> = {}): number {
    return this.show(message, { ...options, tone: 'success' });
  }

  error(message: string, options: Omit<CnpmToastOptions, 'tone'> = {}): number {
    return this.show(message, { ...options, tone: 'error' });
  }

  info(message: string, options: Omit<CnpmToastOptions, 'tone'> = {}): number {
    return this.show(message, { ...options, tone: 'info' });
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }
}
