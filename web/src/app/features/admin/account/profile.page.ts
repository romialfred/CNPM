import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';

/**
 * « Mon profil » du back-office — projection en lecture seule de l'identité de session
 * (nom, rôle, autorisations) fournie par le port de session. Aucune écriture : la
 * modification du compte relève d'un parcours dédié non encore livré.
 */
@Component({
  selector: 'cnpm-admin-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminShellComponent, PageHeaderComponent],
  template: `
    <cnpm-admin-shell>
      <div class="cnpm-account-page">
        <cnpm-page-header
          title="Mon profil"
          description="Votre identité de connexion et vos autorisations sur la plateforme."
        />
        @if (identity(); as me) {
          <section class="cnpm-account-page__card" aria-label="Identité du compte">
            <dl class="cnpm-account-page__list">
              <div>
                <dt>Nom</dt>
                <dd>{{ me.displayName }}</dd>
              </div>
              <div>
                <dt>Rôle</dt>
                <dd>{{ me.roleLabel }}</dd>
              </div>
              <div>
                <dt>Autorisations</dt>
                <dd>{{ me.permissions.length }} permission(s) actives</dd>
              </div>
            </dl>
          </section>
        } @else {
          <p>Identité de session indisponible.</p>
        }
      </div>
    </cnpm-admin-shell>
  `,
  styleUrl: './account-page.scss',
})
export class ProfilePage {
  private readonly session = inject(SESSION_GATEWAY);
  protected readonly identity = toSignal(this.session.identity, { initialValue: null });
}
