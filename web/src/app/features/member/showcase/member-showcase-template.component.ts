import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '../../../design-system/badge/badge.component';
import type { MemberShowcaseDraft } from './member-showcase-gateway';

/** Gabarit public contraint rendu dans l’aperçu privé MP-016. */
@Component({
  selector: 'cnpm-member-showcase-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './member-showcase-template.component.html',
  styleUrl: './member-showcase-template.component.scss',
  host: { '[class]': '"showcase-template-host showcase-template-host--" + viewport()' },
})
export class MemberShowcaseTemplateComponent {
  readonly draft = input.required<MemberShowcaseDraft>();
  readonly viewport = input<'desktop' | 'tablet' | 'mobile'>('desktop');

  protected readonly displayName = computed(
    () => this.draft().name.trim() || 'Nom à compléter',
  );
  protected readonly activities = computed(() =>
    this.draft().activities.filter((activity) => activity.trim()),
  );
  protected readonly projects = computed(() =>
    this.draft().projects.filter((project) => project.title.trim()),
  );
}
