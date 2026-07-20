import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  isLucideIconComponent,
  isLucideIconData,
  LucideDynamicIcon,
  type LucideIcon,
  type LucideIconData,
} from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';

/**
 * Pictogramme accepté par l'en-tête : le composant d'icône lui-même (`LucideUsers`) ou
 * sa donnée (`LucideUsers.icon`).
 *
 * Le nom d'icône sous forme de chaîne — `icon="users"` — est volontairement EXCLU du
 * type. `@lucide/angular` ne résout une chaîne que via le registre `provideLucideIcons`,
 * qui suppose d'importer les icônes par leur nom ; `design-system/icon/icon.ts` écarte
 * explicitement cette voie parce qu'elle ruine le tree-shaking. Sans registre, une
 * chaîne lève « Unable to resolve icon » à l'exécution.
 *
 * `strictTemplates` étant désactivé sur ce dépôt, un attribut statique `icon="users"`
 * échappe au contrôle de type. Le composant filtre donc aussi à l'exécution : une
 * entrée non résoluble n'affiche simplement aucun pictogramme. Un ornement décoratif ne
 * doit jamais faire tomber une page qui, elle, porte des chiffres.
 */
export type CnpmInsightIcon = LucideIcon | LucideIconData;

/**
 * Teintes d'en-tête de panneau.
 *
 * Elles servent à IDENTIFIER un panneau dans le rail, pas à qualifier son contenu :
 * un en-tête ambre ne signifie pas « alerte », un en-tête sarcelle ne signifie pas
 * « conforme ». Le sens reste porté par le titre, jamais par la teinte seule.
 *
 * Les valeurs reprennent la palette `chart.categorical` du handoff, déjà retenue par
 * `CnpmTileAccent` : une seule famille d'accents décoratifs pour tout le design system.
 */
export type CnpmInsightTone = 'neutre' | 'indigo' | 'ciel' | 'sarcelle' | 'ambre';

/**
 * Mode de rendu d'une mesure.
 *
 * `nombre` : valeur alignée à droite du libellé, forme par défaut.
 * `jauge` : barre de progression bornée à 0–100, réservée aux parts et aux taux.
 * `barre` : barre horizontale dont la longueur situe un effectif face à `barMax`. La
 *   valeur reste affichée en clair ; la barre n'est que sa lecture visuelle relative.
 *
 * Une jauge n'a de sens que pour une grandeur dont 100 est le maximum connu. Une barre,
 * elle, compare des effectifs entre eux sur une échelle commune (`barMax`).
 */
export type CnpmInsightDisplay = 'nombre' | 'jauge' | 'barre';

export interface InsightStat {
  readonly label: string;
  /** `null` rend un tiret : une valeur indisponible n'est pas un zéro. */
  readonly value: number | null;
  /** Suffixe collé à la valeur, par exemple « % ». */
  readonly suffix?: string;
  /** Décimales affichées ; entier par défaut. */
  readonly decimals?: number;
  /** Sépare visuellement une mesure qui ne se cumule pas aux précédentes. */
  readonly apart?: boolean;
  /** Forme de rendu ; `nombre` par défaut. */
  readonly display?: CnpmInsightDisplay;
  /**
   * Échelle de la barre horizontale (`display: 'barre'`). La longueur vaut
   * `value / barMax`, bornée à 100 %. Sans échelle, une barre ne se lit pas ; elle est
   * donc ignorée si `barMax` est absent ou nul.
   */
  readonly barMax?: number;
}

/** Borne d'une jauge : une part ne se lit que sur une échelle connue. */
const JAUGE_MIN = 0;
const JAUGE_MAX = 100;

/**
 * Panneau de synthèse — `InsightSummary`, exigé par la fiche BO-002.
 *
 * Le composant ne calcule rien : il affiche des agrégats déjà établis par la source.
 * Additionner ou dériver ici produirait un second calcul, capable de contredire
 * silencieusement celui du tableau — précisément le « total incohérent » que la fiche
 * interdit.
 *
 * La note n'est pas décorative : elle dit ce que les chiffres recouvrent. Quatre
 * nombres empilés sans énoncer lequel contient lequel se prêtent à toutes les
 * lectures, y compris fausses.
 *
 * L'en-tête est teinté et porte un pictogramme pour que deux panneaux voisins du rail
 * se distinguent au premier coup d'œil. Pictogramme et teinte sont des entrées : cinq
 * pages consomment ce composant et aucune ne doit se voir imposer l'identité d'une
 * autre. Les deux ont un défaut sûr — pas de pictogramme, teinte neutre — pour que les
 * appels existants restent valides.
 */
@Component({
  selector: 'cnpm-insight-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideDynamicIcon],
  providers: [DecimalPipe],
  template: `
    <section class="cnpm-insight" [attr.aria-labelledby]="headingId()">
      <header class="cnpm-insight__header" [class]="toneClass()">
        @if (resolvedIcon(); as picto) {
          <!-- Le pictogramme double le titre : l'annoncer serait du bruit. -->
          <span class="cnpm-insight__emblem" aria-hidden="true">
            <svg [lucideIcon]="picto" [size]="iconSize.compact"></svg>
          </span>
        }
        <h2 class="cnpm-insight__title" [id]="headingId()">
          {{ title() }}
          @if (unit(); as mesure) {
            <span class="cnpm-insight__unit">{{ mesure }}</span>
          }
        </h2>
      </header>

      <div class="cnpm-insight__body">
        <dl class="cnpm-insight__stats">
          @for (stat of stats(); track stat.label; let rang = $index) {
            <div
              class="cnpm-insight__stat"
              [class.cnpm-insight__stat--apart]="stat.apart"
              [class.cnpm-insight__stat--gauge]="isGauge(stat)"
              [class.cnpm-insight__stat--barre]="isBar(stat)"
            >
              <dt [id]="statId(rang)">{{ stat.label }}</dt>
              <dd>
                @if (stat.value === null) {
                  <!-- Aucune barre : une jauge à zéro se lirait comme un taux nul,
                       alors que la donnée est simplement absente. -->
                  <span class="cnpm-insight__missing">
                    <span aria-hidden="true">—</span>
                    <span class="cnpm-insight__assistive">Donnée indisponible</span>
                  </span>
                } @else if (isGauge(stat)) {
                  <span class="cnpm-insight__figure">{{ text(stat) }}</span>
                  <span
                    class="cnpm-insight__track"
                    role="progressbar"
                    [attr.aria-labelledby]="statId(rang)"
                    [attr.aria-valuemin]="gaugeMin"
                    [attr.aria-valuemax]="gaugeMax"
                    [attr.aria-valuenow]="bounded(stat.value)"
                    [attr.aria-valuetext]="text(stat)"
                  >
                    <span class="cnpm-insight__fill" [style.inline-size.%]="bounded(stat.value)">
                    </span>
                  </span>
                } @else if (isBar(stat)) {
                  <span class="cnpm-insight__figure">{{ text(stat) }}</span>
                  <!-- La barre est décorative : le libellé et la valeur, tous deux en
                       clair, portent l'information. Elle situe l'effectif d'un coup d'œil,
                       sans jamais en être l'unique lecture. -->
                  <span class="cnpm-insight__track" aria-hidden="true">
                    <span class="cnpm-insight__fill" [style.inline-size.%]="barWidth(stat)"></span>
                  </span>
                } @else {
                  {{ text(stat) }}
                }
              </dd>
            </div>
          }
        </dl>

        @if (note()) {
          <p class="cnpm-insight__note">{{ note() }}</p>
        }
      </div>
    </section>
  `,
  styleUrls: ['./insight-summary.component.scss', './insight-summary.tones.scss'],
})
export class InsightSummaryComponent {
  readonly title = input.required<string>();
  readonly headingId = input.required<string>();
  readonly stats = input.required<readonly InsightStat[]>();
  readonly unit = input<string>();
  readonly note = input<string>();
  /** Pictogramme de l'en-tête ; aucun par défaut. Voir `CnpmInsightIcon`. */
  readonly icon = input<CnpmInsightIcon | null>(null);
  /** Teinte de l'en-tête ; neutre par défaut. */
  readonly tone = input<CnpmInsightTone>('neutre');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly gaugeMin = JAUGE_MIN;
  protected readonly gaugeMax = JAUGE_MAX;

  protected readonly toneClass = computed(() => `cnpm-insight__header--${this.tone()}`);

  /**
   * Pictogramme réellement affichable.
   *
   * Filtre ce que `@lucide/angular` sait rendre sans registre de noms. Tout le reste —
   * chaîne, valeur héritée d'un appel plus ancien — retombe sur « aucun pictogramme ».
   */
  protected readonly resolvedIcon = computed<CnpmInsightIcon | null>(() => {
    const candidat: unknown = this.icon();
    if (isLucideIconData(candidat) || isLucideIconComponent(candidat)) {
      return candidat;
    }
    return null;
  });

  protected isGauge(stat: InsightStat): boolean {
    return stat.display === 'jauge';
  }

  /** Barre horizontale : seulement si le mode ET une échelle exploitable sont fournis. */
  protected isBar(stat: InsightStat): boolean {
    return stat.display === 'barre' && stat.value !== null && (stat.barMax ?? 0) > 0;
  }

  /** Longueur de la barre, en pourcentage de `barMax`, bornée à 100. */
  protected barWidth(stat: InsightStat): number {
    if (stat.value === null || !stat.barMax) {
      return 0;
    }
    return Math.min(100, Math.max(0, (stat.value / stat.barMax) * 100));
  }

  /**
   * Identifiant du libellé, repris par `aria-labelledby` de la jauge. Le nom accessible
   * de la barre est ainsi exactement le libellé affiché : une barre annoncée « 68 % »
   * sans dire de quoi ne renseigne personne.
   */
  protected statId(rang: number): string {
    return `${this.headingId()}-mesure-${rang}`;
  }

  /**
   * Géométrie et `aria-valuenow` de la barre, bornées à l'échelle.
   *
   * Une barre ne peut pas déborder de sa piste : au-delà de 100 elle cesserait de
   * représenter une part. Le chiffre affiché à côté, lui, n'est pas borné — masquer
   * un taux hors bornes reviendrait à effacer l'anomalie au lieu de la montrer.
   */
  protected bounded(value: number): number {
    return Math.min(JAUGE_MAX, Math.max(JAUGE_MIN, value));
  }

  /**
   * Valeur affichée : chiffre formaté puis suffixe.
   *
   * La même chaîne alimente `aria-valuetext` : ce qui est lu à l'écran et ce qui est
   * annoncé doivent coïncider, sinon la barre et la voix se contredisent.
   */
  protected text(stat: InsightStat): string {
    if (stat.value === null) {
      return '';
    }
    const chiffre = this.decimal.transform(stat.value, this.format(stat)) ?? '';
    return `${chiffre}${stat.suffix ?? ''}`;
  }

  protected format(stat: InsightStat): string {
    const decimals = stat.decimals ?? 0;
    return `1.${decimals}-${decimals}`;
  }

  /** Injecté plutôt qu'instancié : le formatage doit suivre le `LOCALE_ID` de l'application. */
  private readonly decimal = inject(DecimalPipe);
}
