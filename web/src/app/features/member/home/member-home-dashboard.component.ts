import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  LucideCircleAlert,
  LucideCircleCheck,
  LucideClock3,
  LucideCreditCard,
  LucideFileDown,
  LucideMessageSquareText,
  LucidePaperclip,
  LucideReceiptText,
  LucideSave,
} from '@lucide/angular';
import type {
  MemberActivity,
  MemberActivityTone,
  MemberProfileCompletion,
  MemberReceipt,
  MemberSupportDesk,
} from './member-home-gateway';

export type MemberRequestDraftForm = FormGroup<{
  requestType: FormControl<string>;
  subject: FormControl<string>;
  message: FormControl<string>;
}>;

const ACTIVITY_LABELS: Readonly<Record<MemberActivityTone, string>> = {
  critical: 'Alerte',
  info: 'Information',
  success: 'Confirmation',
  neutral: 'Document',
};

@Component({
  selector: 'cnpm-member-home-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    LucideCircleAlert,
    LucideCircleCheck,
    LucideClock3,
    LucideCreditCard,
    LucideFileDown,
    LucideMessageSquareText,
    LucidePaperclip,
    LucideReceiptText,
    LucideSave,
  ],
  templateUrl: './member-home-dashboard.component.html',
  styleUrl: './member-home-dashboard.component.scss',
})
export class MemberHomeDashboardComponent {
  readonly receipts = input.required<readonly MemberReceipt[]>();
  readonly activities = input.required<readonly MemberActivity[]>();
  readonly profile = input.required<MemberProfileCompletion>();
  readonly support = input.required<MemberSupportDesk>();
  readonly requestForm = input.required<MemberRequestDraftForm>();
  readonly draftStatus = input.required<string>();

  readonly unavailable = output<string>();
  readonly saveDraftRequested = output<void>();

  protected activityLabel(tone: MemberActivityTone): string {
    return ACTIVITY_LABELS[tone];
  }
}
