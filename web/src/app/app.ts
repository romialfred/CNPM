import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateAvailableComponent } from './core/version/update-available.component';
import { VersionCheckService } from './core/version/version-check.service';
import { ToastOutletComponent } from './design-system/toast/toast-outlet.component';

@Component({
  selector: 'cnpm-root',
  imports: [RouterOutlet, ToastOutletComponent, UpdateAvailableComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    // Surveille les nouveaux déploiements pour proposer une actualisation à tous les
    // utilisateurs connectés, sans les déconnecter.
    inject(VersionCheckService).start();
  }
}
