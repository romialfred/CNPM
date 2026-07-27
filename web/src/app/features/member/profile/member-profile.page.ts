import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { MemberPortalShellComponent } from '../../../layout/member-portal-shell/member-portal-shell.component';
import { MEMBER_PROFILE_GATEWAY, type MemberProfile } from './member-profile-gateway';

type LoadState = 'loading' | 'ready' | 'error';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 512 * 1024;

/**
 * Espace membre — « Profil » (MP-013).
 *
 * <p>Le cotisant consulte son profil et change sa photo : sélection d'un fichier, aperçu, puis
 * enregistrement. La photo est bornée en type et en taille côté écran comme côté serveur.
 */
@Component({
  selector: 'cnpm-member-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MemberPortalShellComponent, PageHeaderComponent, AlertComponent, ButtonComponent],
  templateUrl: './member-profile.page.html',
  styleUrl: './member-profile.page.scss',
})
export class MemberProfilePage {
  private readonly gateway = inject(MEMBER_PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  // Passé explicitement : `load()`/enregistrement sont appelés hors contexte d'injection
  // (bouton, action), où `takeUntilDestroyed()` sans argument lèverait NG0203.
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<LoadState>('loading');
  protected readonly profile = signal<MemberProfile | null>(null);

  /** Aperçu d'une photo choisie mais pas encore enregistrée (data-URI), ou `null`. */
  protected readonly preview = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly removing = signal(false);
  protected readonly photoError = signal<string | null>(null);
  protected readonly dragOver = signal(false);

  /** Image du médaillon : l'aperçu s'il existe, sinon la photo enregistrée. */
  protected readonly shownImage = computed(
    () => this.preview() ?? this.profile()?.avatarDataUri ?? null,
  );

  protected readonly initials = computed(() => {
    const name = this.profile()?.displayName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '—';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  constructor() {
    this.title.setTitle('Profil — Espace membre CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(): void {
    this.dragOver.set(false);
  }

  private acceptFile(file: File): void {
    this.photoError.set(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.photoError.set('Format non accepté. Choisissez une image PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.photoError.set('L’image dépasse 512 Ko. Choisissez une photo plus légère.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.preview.set(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => this.photoError.set('Lecture de l’image impossible. Réessayez.');
    reader.readAsDataURL(file);
  }

  protected save(): void {
    const dataUri = this.preview();
    if (!dataUri || this.saving()) return;
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
    if (!match) {
      this.photoError.set('Image illisible. Choisissez une autre photo.');
      return;
    }
    this.saving.set(true);
    this.gateway
      .updateAvatar(match[1], match[2])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.saving.set(false);
          this.preview.set(null);
          this.profile.set(profile);
          this.toast.success('Votre photo de profil a été mise à jour.');
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.photoError.set(error instanceof Error ? error.message : 'L’enregistrement a échoué.');
        },
      });
  }

  protected cancelPreview(): void {
    this.preview.set(null);
    this.photoError.set(null);
  }

  protected removePhoto(): void {
    if (this.removing() || !this.profile()?.avatarDataUri) return;
    if (!globalThis.confirm('Retirer votre photo de profil ?')) return;
    this.removing.set(true);
    this.gateway
      .deleteAvatar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.removing.set(false);
          this.preview.set(null);
          this.profile.set(profile);
          this.toast.success('Votre photo de profil a été retirée.');
        },
        error: () => {
          this.removing.set(false);
          this.toast.error('Le retrait de la photo a échoué.');
        },
      });
  }
}
