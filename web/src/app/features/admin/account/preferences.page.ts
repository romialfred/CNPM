import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';

/**
 * « Mes préférences » du back-office — surface honnête d'un réglage personnel à venir.
 * Aucune préférence n'est encore persistée : la page l'annonce plutôt que d'exposer des
 * réglages fictifs.
 */
@Component({
  selector: 'cnpm-admin-preferences-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminShellComponent, PageHeaderComponent],
  template: `
    <cnpm-admin-shell>
      <div class="cnpm-account-page">
        <cnpm-page-header
          title="Mes préférences"
          description="Réglages personnels d'affichage et de notifications."
        />
        <section class="cnpm-account-page__card">
          <p class="cnpm-account-page__prose">
            Les préférences personnelles (langue, densité d'affichage, notifications) seront
            proposées ici prochainement. Aucun réglage n'est encore enregistré pour votre compte.
          </p>
        </section>
      </div>
    </cnpm-admin-shell>
  `,
  styleUrl: './account-page.scss',
})
export class PreferencesPage {}
