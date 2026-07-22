import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';

/**
 * « Aides » du back-office — points de repère d'assistance. Aucun contact officiel n'est
 * codé en dur : les coordonnées d'assistance restent à fournir par le CNPM.
 */
@Component({
  selector: 'cnpm-admin-help-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminShellComponent, PageHeaderComponent],
  template: `
    <cnpm-admin-shell>
      <div class="cnpm-account-page">
        <cnpm-page-header
          title="Aides"
          description="Repères pour prendre en main la plateforme et obtenir de l'assistance."
        />
        <section class="cnpm-account-page__card">
          <p class="cnpm-account-page__prose">
            Cette rubrique regroupera les guides d'utilisation et les coordonnées d'assistance de
            la plateforme. Pour toute difficulté, rapprochez-vous de l'administrateur de votre
            organisation ; la documentation en ligne sera publiée ici prochainement.
          </p>
        </section>
      </div>
    </cnpm-admin-shell>
  `,
  styleUrl: './account-page.scss',
})
export class HelpPage {}
