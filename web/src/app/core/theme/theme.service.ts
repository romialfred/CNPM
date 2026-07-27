import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

/** Thème d'affichage de l'application. */
export type CnpmTheme = 'light' | 'dark';

const STORAGE_KEY = 'cnpm-theme';

/**
 * Service de thème clair/sombre. Source de vérité = un signal ; un effet reflète l'état sur
 * l'attribut `data-theme` de `<html>` (lu par la couche de tokens `_theme-dark.scss`) et le
 * persiste. Défaut = clair ; au tout premier chargement, sans préférence enregistrée, on
 * suit la préférence système. Toutes les lectures d'environnement sont défensives (rendu
 * hors navigateur, stockage indisponible).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<CnpmTheme>(this.readInitial());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.setAttribute('data-theme', theme);
      try {
        this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Stockage indisponible (mode privé, quota) : le thème reste effectif sur la session.
      }
    });
  }

  toggle(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  set(theme: CnpmTheme): void {
    this.theme.set(theme);
  }

  private readInitial(): CnpmTheme {
    const view = this.document.defaultView;
    try {
      const stored = view?.localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // Ignoré : on retombe sur la préférence système puis sur le clair.
    }
    if (view?.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
}
