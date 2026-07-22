import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Traduit un code de catégorie d'adhésion en libellé lisible pour l'affichage
 * (« GRANDE_ENTREPRISE » → « Grande Entreprise »). Le code technique reste la source ;
 * seul l'affichage est humanisé. Un code inconnu est renvoyé tel quel plutôt que masqué.
 */
@Pipe({ name: 'cnpmMemberCategory' })
export class MemberCategoryLabelPipe implements PipeTransform {
  private static readonly LABELS: Readonly<Record<string, string>> = {
    GRANDE_ENTREPRISE: 'Grande Entreprise',
    MOYENNE_ENTREPRISE: 'Moyenne Entreprise',
    PME: 'PME',
    TPE: 'TPE',
  };

  transform(code: string | null | undefined): string {
    if (!code) {
      return '—';
    }
    return MemberCategoryLabelPipe.LABELS[code] ?? code;
  }
}
