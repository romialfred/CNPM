import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cnpm-project-ready-page',
  templateUrl: './project-ready.page.html',
  styleUrl: './project-ready.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectReadyPage {}
