import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Scenes disponibles. Chacune est une illustration vectorielle, jamais une photographie. */
export type CnpmSceneName = 'assembly' | 'digital' | 'network' | 'training';

/**
 * Texte alternatif par scene.
 *
 * Il decrit ce que l'illustration montre. Une scene purement decorative doit etre
 * declaree avec `decorative`, auquel cas elle est masquee aux technologies d'assistance
 * plutot que de leur imposer une description sans valeur.
 */
const SCENE_ALT: Readonly<Record<CnpmSceneName, string>> = {
  assembly: 'Illustration vectorielle d\'une assemblée d\'entrepreneurs réunis autour d\'une grande table en demi-cercle, face à un écran de présentation et à trois drapeaux, dans une salle de concertation.',
  digital: 'Illustration vectorielle : trois entrepreneurs devant des écrans de tableaux de bord et un téléphone mobile, reliés par des flux de données à trois bâtiments d\'entreprise.',
  network: 'Illustration, et non photographie : une carte schematique du Mali, aux contours anguleux et simplifies, divisee en trois bandes de couleur du desert au nord a la savane au sud et traversee par un fleuve. Des noeuds ronds relies par un reseau de liaisons y figurent les conseils regionaux, leurs antennes locales et un noeud central ; de petits batiments representent des groupements professionnels. Au premier plan, trois silhouettes d\'observateurs, dont une casquee, regardent le panneau.',
  training: 'Illustration vectorielle d\'une salle de formation professionnelle : un formateur désigne du bâton un tableau portant un diagramme en barres et un croquis d\'ouvrage d\'art, un paperboard présente une pyramide de compétences, et quatre participants attablés prennent des notes ; par la fenêtre, une grue de chantier se détache sur un ciel chaud.',
};

/**
 * Illustration vectorielle de la plateforme CNPM.
 *
 * Ces scenes remplacent les aplats de couleur qui tenaient lieu d'images. Elles sont
 * dessinees, non generees a la volee, et ne representent aucune personne identifiable
 * ni aucune organisation reelle. La photographie reste soumise a UX-DEC-003 (photothèque
 * et droits d'utilisation), decision ouverte.
 */
@Component({
  selector: 'cnpm-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="cnpm-scene"
      [attr.role]="decorative() ? null : 'img'"
      [attr.aria-label]="decorative() ? null : alt()"
      [attr.aria-hidden]="decorative() ? 'true' : null"
    >
      @switch (name()) {
      @case ('assembly') {
        <svg class="cnpm-visual__art" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice">
          <!-- ASSEMBLEE — plafond et luminaires -->
          <rect width="480" height="26" fill="#DEE2E9" />
          <path d="M0 26h480v4H0z" fill="#C0C6D1" />
          <path d="M56 8h96v9H56zM192 8h96v9h-96zM328 8h96v9h-96z" fill="#FFF6E6" />
          <!-- Mur de fond, pilastres, soubassement et sol -->
          <rect y="30" width="480" height="110" fill="#E9EDFF" />
          <path d="M20 30h6v110h-6zM84 30h6v110h-6zM142 30h6v110h-6zM336 30h6v110h-6zM400 30h6v110h-6zM462 30h6v110h-6z" fill="#C3CDF2" />
          <rect y="140" width="480" height="30" fill="#DCCEB6" />
          <path d="M0 140h480v5H0z" fill="#BCAB8E" />
          <path d="M40 145v25h4v-25zM120 145v25h4v-25zM200 145v25h4v-25zM280 145v25h4v-25zM360 145v25h4v-25zM440 145v25h4v-25z" fill="#C9B99C" />
          <rect y="170" width="480" height="100" fill="#CBAF77" />
          <path d="M0 170h480v6H0z" fill="#A78850" />
          <!-- Porte laterale (face d'ombre a gauche) -->
          <path d="M12 70h60v100H12z" fill="#C7CCD6" />
          <path d="M18 76h48v94H18z" fill="#33468F" />
          <path d="M18 76h10v94H18z" fill="#2F3F91" />
          <path d="M56 118h4v14h-4z" fill="#D6DAE2" />
          <!-- Ecran de presentation : barres blanches sans texte reel -->
          <path d="M150 36h180v96H150z" fill="#C7CCD6" />
          <path d="M156 42h168v84H156z" fill="#2F3F91" />
          <path d="M168 52h84v7h-84zM168 64h52v5h-52zM168 114h144v3h-144z" fill="#FFFFFF" />
          <path d="M172 114V96h18v18zM196 114V84h18v30zM220 114V90h18v24zM268 114V78h18v36zM292 114V88h18v26z" fill="#8FA3DB" />
          <path d="M244 114V72h18v42z" fill="#F2C24A" />
          <!-- Drapeaux stylises : mats, embases, epis et pans avec repli d'ombre -->
          <path d="M370 60h4v116h-4zM406 60h4v116h-4zM442 60h4v116h-4z" fill="#8A9099" />
          <path d="M362 176h20v6h-20zM398 176h20v6h-20zM434 176h20v6h-20z" fill="#5C6472" />
          <g fill="#F2B417">
            <circle cx="372" cy="58" r="3" />
            <circle cx="408" cy="58" r="3" />
            <circle cx="444" cy="58" r="3" />
          </g>
          <path d="M344 64h26v28h-26z" fill="#2C7A50" />
          <path d="M344 84h26v8h-26z" fill="#215F3E" />
          <path d="M380 64h26v28h-26z" fill="#F2B417" />
          <path d="M380 84h26v8h-26z" fill="#D69A0C" />
          <path d="M416 64h26v28h-26z" fill="#3E56A6" />
          <path d="M416 84h26v8h-26z" fill="#2F3F91" />
          <!-- Plantes en pot, de part et d'autre de la salle -->
          <path d="M448 176h28l-4 26h-20z" fill="#C9613F" />
          <path d="M448 176h9l-2 26h-6z" fill="#A64C2E" />
          <circle cx="462" cy="146" r="18" fill="#2C7A50" />
          <circle cx="448" cy="158" r="12" fill="#37A067" />
          <circle cx="474" cy="158" r="11" fill="#46B378" />
          <circle cx="462" cy="130" r="9" fill="#57C489" />
          <path d="M88 150h26l-4 26H92z" fill="#C9613F" />
          <path d="M88 150h9l-2 26h-6z" fill="#A64C2E" />
          <circle cx="101" cy="120" r="18" fill="#2C7A50" />
          <circle cx="87" cy="132" r="12" fill="#37A067" />
          <circle cx="113" cy="132" r="11" fill="#46B378" />
          <circle cx="101" cy="104" r="9" fill="#57C489" />
          <!-- Intervenante debout, bras leve : le temps de parole -->
          <g transform="translate(136,196)">
            <path d="M-8 0v-22h6v22zM2 0v-22h6v22z" fill="#1D286C" />
            <path d="M-11-44h22v24h-22z" fill="#3A4E9E" />
            <path d="M-11-44h6v24h-6z" fill="#2F3F91" />
            <path d="M-3-44h6v18h-6z" fill="#EFF1F5" />
            <path d="M-16-42h5v20h-5z" fill="#3A4E9E" />
            <path d="M11-42h5v14h-5zM14-53h5v13h-5z" fill="#3A4E9E" />
            <circle cx="18" cy="-55" r="3" fill="#8A5A34" />
            <path d="M-3-46h6v5h-6z" fill="#8A5A34" />
            <circle cy="-52" r="7" fill="#8A5A34" />
          </g>
          <!-- Sept delegues assis, torses et carnations tous differents -->
          <g transform="translate(152,180)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#1D286C" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#E0B489" />
            <circle cy="-30" r="8" fill="#E0B489" />
          </g>
          <g transform="translate(192,178)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#C9613F" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#8A5A34" />
            <circle cy="-30" r="8" fill="#8A5A34" />
          </g>
          <g transform="translate(232,177)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#2F8F5B" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#C08B5A" />
            <circle cy="-30" r="8" fill="#C08B5A" />
          </g>
          <g transform="translate(272,177)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#3A4E9E" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#E0B489" />
            <circle cy="-30" r="8" fill="#E0B489" />
          </g>
          <g transform="translate(312,179)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#B7502F" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#8A5A34" />
            <circle cy="-30" r="8" fill="#8A5A34" />
          </g>
          <g transform="translate(352,182)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#25764A" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#C08B5A" />
            <circle cy="-30" r="8" fill="#C08B5A" />
          </g>
          <g transform="translate(392,186)">
            <path d="M-13 0v-20a13 13 0 0 1 26 0V0z" fill="#27357E" />
            <path d="M-4-20h8v20h-8z" fill="#EFF1F5" />
            <path d="M-3-25h6v6h-6z" fill="#E0B489" />
            <circle cy="-30" r="8" fill="#E0B489" />
          </g>
          <!-- Table en demi-cercle : plateau, chant clair, ceinture et retour d'ombre -->
          <path d="M70 188Q240 166 410 188l40 36Q240 196 30 224z" fill="#C08B4B" />
          <path d="M70 188Q240 166 410 188l3 7Q240 173 67 195z" fill="#D9A560" />
          <path d="M30 224Q240 196 450 224v24Q240 220 30 248z" fill="#9C6C33" />
          <path d="M30 248Q240 220 450 248v8Q240 228 30 256z" fill="#7A5A32" />
          <!-- Dossiers, micros, carafe et fanion de presidence (accent de marque, en petit) -->
          <path d="M142 192h20v7h-20zM182 190h20v7h-20zM222 189h20v7h-20zM262 189h20v7h-20zM302 191h20v7h-20zM342 194h20v7h-20zM382 198h20v7h-20z" fill="#EFF1F5" />
          <path d="M151 192v-14h3v14zM231 189v-14h3v14zM311 191v-14h3v14zM391 198v-14h3v14z" fill="#6E7688" />
          <g fill="#333B49">
            <circle cx="152" cy="177" r="3" />
            <circle cx="232" cy="174" r="3" />
            <circle cx="312" cy="176" r="3" />
            <circle cx="392" cy="183" r="3" />
          </g>
          <path d="M104 200h34v-9h-34z" fill="#A64C2E" />
          <path d="M106 191h34v-8h-34z" fill="#D2694A" />
          <path d="M196 196h12v-18h-12z" fill="#C3C9D4" />
          <path d="M196 196h12v-8h-12z" fill="#8FA3DB" />
          <path d="M212 197h6v-9h-6zM222 198h6v-9h-6z" fill="#DEE2E9" />
          <path d="M239 190v-22h3v22z" fill="#8A9099" />
          <path d="M242 168h12l-4 5 4 5h-12z" fill="#E40C20" />
        </svg>
      }
      @case ('digital') {
        <svg class="cnpm-visual__art" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="cnpmSkyDigital" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#BCD5FF" />
              <stop offset=".55" stop-color="#FFE0B4" />
              <stop offset="1" stop-color="#FFCE96" />
            </linearGradient>
          </defs>
          <rect width="480" height="150" fill="url(#cnpmSkyDigital)" />
          <circle cx="52" cy="40" r="22" fill="#FFE9C0" />
          <path d="M352 38h44a9 9 0 0 0 0-18 15 15 0 0 0-28-4 10 10 0 0 0-16 22z" fill="#FFF6E6" />
          <path d="M228 26l11 4-11 4 3-4zM262 16l9 4-9 4 3-4z" fill="#7F91CF" />
          <!-- Bâtiment d'entreprise en enduit terre cuite -->
          <path d="M24 150V86h80v64z" fill="#C98A5A" />
          <path d="M96 86h8v64h-8z" fill="#B0713F" />
          <path d="M32 96h14v12H32zM54 96h14v12H54zM76 96h14v12H76zM32 116h14v12H32zM54 116h14v12H54zM76 116h14v12H76zM32 136h14v12H32zM54 136h14v12H54zM76 136h14v12H76z" fill="#F6E0C2" />
          <!-- Siège vitré central -->
          <path d="M190 150V54h96v96z" fill="#EFF1F5" />
          <path d="M266 54h20v96h-20z" fill="#C7CCD6" />
          <path d="M184 46h108v8H184z" fill="#D6DAE2" />
          <path d="M198 62h16v16h-16zM224 62h16v16h-16zM250 62h16v16h-16zM198 84h16v16h-16zM224 84h16v16h-16zM250 84h16v16h-16zM198 106h16v16h-16zM224 106h16v16h-16zM250 106h16v16h-16zM198 128h16v16h-16zM224 128h16v16h-16zM250 128h16v16h-16z" fill="#3E56A6" />
          <path d="M224 62h16v16h-16zM198 106h16v16h-16zM250 128h16v16h-16z" fill="#6E86C8" />
          <path d="M226 134h24v16h-24z" fill="#33468F" />
          <!-- Troisième établissement, béton bleuté -->
          <path d="M372 150V74h84v76z" fill="#AEBBE8" />
          <path d="M444 74h12v76h-12z" fill="#8FA3DB" />
          <path d="M380 86h16v14h-16zM404 86h16v14h-16zM428 86h16v14h-16zM380 110h16v14h-16zM404 110h16v14h-16zM428 110h16v14h-16zM380 134h16v14h-16zM404 134h16v14h-16zM428 134h16v14h-16z" fill="#7F91CF" />
          <!-- Flux de données entre établissements : suite de carrés, jamais un trait -->
          <path d="M78 74h6v6h-6zM100 66h6v6h-6zM122 60h6v6h-6zM144 56h6v6h-6zM166 54h6v6h-6zM182 58h6v6h-6z" fill="#6E86C8" />
          <path d="M294 60h6v6h-6zM316 54h6v6h-6zM338 52h6v6h-6zM360 56h6v6h-6zM378 64h6v6h-6z" fill="#6E86C8" />
          <g fill="#2F3F91">
            <circle cx="68" cy="82" r="5" />
            <circle cx="192" cy="62" r="5" />
            <circle cx="286" cy="62" r="5" />
            <circle cx="386" cy="72" r="5" />
          </g>
          <!-- Mât relais et fanion (accent de marque, en petit) -->
          <path d="M462 150v-44h4v44z" fill="#8A9099" />
          <path d="M466 104h10l-3 4 3 4h-10z" fill="#E40C20" />
          <!-- Sol en deux bandes -->
          <rect y="150" width="480" height="120" fill="#CBAF77" />
          <path d="M0 150h480v6H0z" fill="#A78850" />
          <rect y="210" width="480" height="60" fill="#C0A667" />
          <path d="M0 210h480v6H0z" fill="#A78850" />
          <!-- Végétal de premier plan -->
          <path d="M198 210h22v24h-22z" fill="#B7502F" />
          <circle cx="209" cy="196" r="14" fill="#2F8F5B" />
          <circle cx="199" cy="186" r="9" fill="#37A067" />
          <circle cx="219" cy="188" r="8" fill="#46B378" />
          <!-- Poste de travail -->
          <path d="M232 200h230v10H232z" fill="#C08B4B" />
          <path d="M240 210h214v42H240z" fill="#9C6C33" />
          <path d="M252 132h100v62H252z" fill="#EFF1F5" />
          <path d="M258 138h88v50h-88z" fill="#1D286C" />
          <path d="M264 144h44v6h-44zM320 178h22v4h-22z" fill="#AEBBE8" />
          <path d="M264 180h76v2h-76z" fill="#4E64AC" />
          <path d="M264 178v-14h10v14zM278 178v-22h10v22zM306 178v-18h10v18z" fill="#6E86C8" />
          <path d="M292 178v-32h10v32z" fill="#F2B417" />
          <circle cx="330" cy="160" r="12" fill="#37A067" />
          <circle cx="330" cy="160" r="6" fill="#1D286C" />
          <path d="M296 194h12v8h-12z" fill="#9BA3B2" />
          <path d="M284 200h36v4h-36z" fill="#8A9099" />
          <path d="M366 146h86v46h-86z" fill="#EFF1F5" />
          <path d="M372 152h74v34h-74z" fill="#1D286C" />
          <path d="M376 156h30v5h-30z" fill="#AEBBE8" />
          <path d="M376 166h20v14h-20z" fill="#6E86C8" />
          <path d="M400 166h20v14h-20z" fill="#37A067" />
          <path d="M424 166h18v14h-18z" fill="#AEBBE8" />
          <path d="M402 192h10v8h-10z" fill="#9BA3B2" />
          <path d="M392 200h30v4h-30z" fill="#8A9099" />
          <path d="M266 204h72v6h-72z" fill="#DEE2E9" />
          <path d="M270 206h64v2h-64z" fill="#AEB5C2" />
          <path d="M354 188h12v12h-12z" fill="#C9613F" />
          <path d="M232 192h28v6h-28z" fill="#EFF1F5" />
          <path d="M234 184h24v6h-24z" fill="#DEE2E9" />
          <!-- Entrepreneurs : ancrage aux pieds, 48 unités, sans visage -->
          <g fill="#1D286C">
            <g transform="translate(70,234)">
              <path d="M-8 0v-18h6v18zM2 0v-18h6v18z" />
              <path d="M-10-36h20v20h-20z" fill="#3A4E9E" />
              <path d="M-4-36h8v20h-8z" fill="#27357E" />
              <path d="M-14-35h4v16h-4zM10-35h4v16h-4z" fill="#27357E" />
              <circle cy="-42" r="6" fill="#E0B489" />
            </g>
            <g transform="translate(112,234)">
              <path d="M-8 0v-18h6v18zM2 0v-18h6v18z" />
              <path d="M-10-36h20v20h-20z" fill="#C9613F" />
              <path d="M-4-36h8v20h-8z" fill="#A64C2E" />
              <path d="M-14-35h4v16h-4zM10-38h4v14h-4z" fill="#A64C2E" />
              <path d="M12-42h9v14h-9z" fill="#1D286C" />
              <path d="M14-40h5v10h-5z" fill="#8FB6F0" />
              <circle cy="-42" r="6" fill="#8A5A34" />
            </g>
            <g transform="translate(156,234)">
              <path d="M-8 0v-18h6v18zM2 0v-18h6v18z" />
              <path d="M-10-36h20v20h-20z" fill="#2F8F5B" />
              <path d="M-4-36h8v20h-8z" fill="#25764A" />
              <path d="M-14-35h4v16h-4zM10-34h4v12h-4z" fill="#25764A" />
              <path d="M12-36h16v12h-16z" fill="#EFF1F5" />
              <path d="M15-33h10v6h-10z" fill="#6E86C8" />
              <circle cy="-42" r="6" fill="#C08B5A" />
            </g>
          </g>
          <path d="M36 226h26v4H36zM440 232h24v4h-24z" fill="#A78850" />
        </svg>
      }
      @case ('network') {
        <svg class="cnpm-visual__art" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice">
          <!-- RESEAU — carte schematique du maillage territorial. Registre de plan (fond
               clair et trame), comme le motif de repli : ce n'est pas un paysage, aucun
               ciel donc, mais une bande de sol ocre en bas porte les silhouettes. -->
          <rect width="480" height="222" fill="#E9EDFF" />
          <!-- Trame de fond du panneau -->
          <g fill="#C3CDF2">
            <path d="M0 44h480v2H0zM0 88h480v2H0zM0 132h480v2H0zM0 176h480v2H0zM60 0h2v222h-2zM140 0h2v222h-2zM220 0h2v222h-2zM300 0h2v222h-2zM380 0h2v222h-2z" />
          </g>
          <!-- Cadre du panneau -->
          <g fill="#AEBBE8">
            <path d="M0 0h480v4H0zM0 218h480v4H0zM0 0h4v222H0zM476 0h4v222h-4z" />
          </g>
          <!-- Rose des vents et echelle graphique -->
          <circle cx="44" cy="46" r="16" fill="#C3CDF2" />
          <path d="M44 30l10 24-10-6-10 6z" fill="#1D286C" />
          <g fill="#1D286C">
            <path d="M386 34h18v6h-18zM422 34h18v6h-18z" />
          </g>
          <g fill="#8FA3DB">
            <path d="M404 34h18v6h-18zM440 34h18v6h-18z" />
          </g>
          <!-- Silhouette du pays, volontairement anguleuse et non geographique, decoupee
               en trois bandes bioclimatiques : desert ocre clair au nord, sahel plus
               sature au centre, savane verte au sud. -->
          <path d="M79 124L96 92L150 58L214 58L258 30L300 58L356 92L392 124Z" fill="#CDAC71" />
          <path d="M79 124L392 124L404 162L394 170L150 170L106 158L78 126Z" fill="#B08F55" />
          <path d="M150 170L394 170L372 188L322 182L296 204L246 200L214 214L168 202Z" fill="#2F8F5B" />
          <!-- Fleuve en ruban plein (pas de trait) et reflets -->
          <path d="M178 196Q212 174 250 152Q300 122 346 132Q378 140 388 164l-11 4Q368 150 342 142Q302 134 258 162Q222 184 186 204Z" fill="#5268B3" />
          <g fill="#93A6DE">
            <path d="M232 168h16v4h-16zM292 144h18v4h-18zM348 140h14v4h-14z" />
          </g>
          <!-- Liaisons du maillage. Seule exception au trait, comme les haubans de grue :
               une liaison n'a pas d'epaisseur propre, la remplir en aplat la ferait lire
               comme une route. Trois niveaux : dorsale, transversales, antennes. -->
          <path d="M110 142L188 158M188 158L222 182M222 182L272 180M222 182L300 142M300 142L344 134M344 134L376 160" stroke="#4E64AC" stroke-width="3" fill="none" />
          <path d="M344 134L300 92M300 92L232 68M376 160L272 180M344 134L352 106M110 142L222 182M188 158L300 142M272 180L300 142M352 106L300 92" stroke="#8FA3DB" stroke-width="2" fill="none" />
          <path d="M170 138L188 158M170 138L110 142M238 148L222 182M272 110L300 92M312 168L344 134M270 196L272 180M196 186L222 182M330 102L352 106" stroke="#AEBBE8" stroke-width="2" fill="none" />
          <!-- Groupements professionnels : atelier, entrepot, bureaux. Face d'ombre a
               droite pour les batiments, comme dans le reste du lot. -->
          <path d="M124 136h30v12h-30z" fill="#C08B4B" />
          <path d="M148 136h6v12h-6z" fill="#9C6C33" />
          <path d="M124 136v-4l7-4v8zM138 136v-4l7-4v8z" fill="#9C6C33" />
          <path d="M132 140h6v8h-6z" fill="#1D286C" />
          <path d="M330 156h22v12h-22z" fill="#C9613F" />
          <path d="M346 156h6v12h-6z" fill="#A64C2E" />
          <path d="M328 156l13-8 13 8z" fill="#A64C2E" />
          <path d="M336 160h8v8h-8z" fill="#1D286C" />
          <path d="M238 178h16v20h-16z" fill="#3A4E9E" />
          <path d="M250 178h4v20h-4z" fill="#27357E" />
          <path d="M241 182h4v4h-4zM246 182h3v4h-3zM241 189h4v4h-4zM246 189h3v4h-3z" fill="#8FB6F0" />
          <!-- Antennes locales -->
          <g fill="#F2B417">
            <circle cx="170" cy="138" r="5" />
            <circle cx="238" cy="148" r="5" />
            <circle cx="272" cy="110" r="5" />
            <circle cx="312" cy="168" r="5" />
            <circle cx="270" cy="196" r="5" />
            <circle cx="196" cy="186" r="5" />
            <circle cx="330" cy="102" r="5" />
          </g>
          <g fill="#1D286C">
            <circle cx="170" cy="138" r="2" />
            <circle cx="238" cy="148" r="2" />
            <circle cx="272" cy="110" r="2" />
            <circle cx="312" cy="168" r="2" />
            <circle cx="270" cy="196" r="2" />
            <circle cx="196" cy="186" r="2" />
            <circle cx="330" cy="102" r="2" />
          </g>
          <!-- Conseils regionaux -->
          <g fill="#1D286C">
            <circle cx="110" cy="142" r="9" />
            <circle cx="188" cy="158" r="9" />
            <circle cx="272" cy="180" r="9" />
            <circle cx="300" cy="142" r="9" />
            <circle cx="344" cy="134" r="9" />
            <circle cx="300" cy="92" r="9" />
            <circle cx="232" cy="68" r="9" />
            <circle cx="376" cy="160" r="9" />
            <circle cx="352" cy="106" r="9" />
          </g>
          <g fill="#EFF1F5">
            <circle cx="110" cy="142" r="4" />
            <circle cx="188" cy="158" r="4" />
            <circle cx="272" cy="180" r="4" />
            <circle cx="300" cy="142" r="4" />
            <circle cx="344" cy="134" r="4" />
            <circle cx="300" cy="92" r="4" />
            <circle cx="232" cy="68" r="4" />
            <circle cx="376" cy="160" r="4" />
            <circle cx="352" cy="106" r="4" />
          </g>
          <!-- Noeud central : seul accent de marque du visuel, minuscule et non structurel -->
          <circle cx="222" cy="182" r="14" fill="#1D286C" />
          <circle cx="222" cy="182" r="10" fill="#F2B417" />
          <circle cx="222" cy="182" r="6" fill="#EFF1F5" />
          <circle cx="222" cy="182" r="3" fill="#E40C20" />
          <!-- Sol ocre : sans lui les silhouettes flottaient sur la trame du panneau -->
          <path d="M0 222h480v48H0z" fill="#CBAF77" />
          <path d="M0 222h480v6H0z" fill="#A78850" />
          <g fill="#A78850">
            <path d="M300 234h12v4h-12zM420 232h14v4h-14zM362 238h10v4h-10z" />
          </g>
          <!-- Trois silhouettes d'observateurs, torses et carnations tous differents,
               aucun visage : ancrage aux pieds, echelle urbaine. -->
          <g fill="#1D286C">
            <g transform="translate(56,236)">
              <path d="M-6 0v-13h4v13zM2 0v-13h4v13z" />
              <path d="M-8-27h16v14h-16z" fill="#F2B417" />
              <path d="M-8-23h16v3h-16z" fill="#EFF1F5" />
              <path d="M-11-26h3v11h-3zM8-26h3v11h-3z" fill="#3A4E9E" />
              <circle cy="-32" r="5" fill="#E0B489" />
              <path d="M-7-34a7 7 0 0 1 14 0z" fill="#F2B417" />
              <path d="M-9-35h18v3h-18z" fill="#D69A0C" />
            </g>
            <g transform="translate(92,236)">
              <path d="M-6 0v-12h4v12zM2 0v-12h4v12z" />
              <path d="M-8-25h16v13h-16z" fill="#C9613F" />
              <path d="M-11-24h3v10h-3zM8-24h3v10h-3z" fill="#A64C2E" />
              <circle cy="-30" r="5" fill="#C08B5A" />
            </g>
            <g transform="translate(128,236)">
              <path d="M-6 0v-12h4v12zM2 0v-12h4v12z" />
              <path d="M-8-25h16v13h-16z" fill="#2F8F5B" />
              <path d="M-11-24h3v10h-3z" fill="#25764A" />
              <path d="M8-38h3v26h-3z" fill="#25764A" />
              <circle cy="-30" r="5" fill="#8A5A34" />
            </g>
          </g>
        </svg>
      }
      @case ('training') {
        <svg
          class="cnpm-visual__art"
          viewBox="0 0 480 270"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <!-- Seul dégradé de la scène : le ciel vu par la fenêtre. L'intérieur est
                 ocre et bois, la fenêtre est la seule ouverture froide et elle bascule
                 au chaud en bas comme tous les ciels du lot. -->
            <linearGradient id="cnpmSkyTraining" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#BCD5FF" />
              <stop offset=".55" stop-color="#FFE0B4" />
              <stop offset="1" stop-color="#FFCE96" />
            </linearGradient>
          </defs>

          <!-- Mur de fond, plafond et soubassement : l'intérieur reste dans la famille
               terre du lot, jamais gris. -->
          <rect width="480" height="196" fill="#F0E3C7" />
          <path d="M0 0h480v22H0zM0 158h480v38H0z" fill="#DCC793" />
          <path d="M0 22h480v4H0zM0 158h480v4H0z" fill="#BCAB8E" />

          <!-- Sol et ligne d'horizon intérieure -->
          <rect y="196" width="480" height="74" fill="#CBAF77" />
          <path d="M0 196h480v6H0z" fill="#A78850" />
          <path d="M0 216h480v3H0zM0 238h480v3H0zM0 258h480v3H0z" fill="#BCAB8E" />

          <!-- Luminaires suspendus -->
          <path d="M118 26h5v8h-5zM166 26h5v8h-5zM310 26h5v8h-5zM358 26h5v8h-5z" fill="#8A9099" />
          <path d="M96 34h96v8H96zM288 34h96v8h-96z" fill="#EFF1F5" />
          <path d="M96 39h96v3H96zM288 39h96v3h-96z" fill="#C7CCD6" />

          <!-- Tableau : cadre bois, panneau bleu nuit, tablette à craie -->
          <path d="M26 44h184v110H26z" fill="#9C6C33" />
          <path d="M32 50h172v98H32z" fill="#1D286C" />
          <path d="M26 154h184v6H26z" fill="#C08B4B" />
          <!-- Marqueur posé sur la tablette (accent de marque, en petit) -->
          <path d="M180 150h14v4h-14z" fill="#E40C20" />
          <!-- Diagramme en barres tracé au tableau -->
          <path d="M44 64h3v76h-3zM44 137h104v3H44z" fill="#7F91CF" />
          <path d="M56 105h14v32H56z" fill="#F2C24A" />
          <path d="M76 87h14v50H76z" fill="#37A067" />
          <path d="M96 97h14v40H96z" fill="#6E86C8" />
          <path d="M116 75h14v62h-14z" fill="#C97350" />
          <path d="M60 98h5v5h-5zM80 80h5v5h-5zM100 90h5v5h-5zM120 68h5v5h-5z" fill="#FFF7E7" />
          <!-- Croquis d'ouvrage : tablier, piles et pylônes -->
          <g fill="#AEBBE8">
            <path d="M156 92h44v5h-44z" />
            <path d="M162 97h5v16h-5zM189 97h5v16h-5z" />
            <path d="M164 76h3v16h-3zM191 76h3v16h-3z" />
          </g>

          <!-- Paperboard : chevalet bois, feuille et pyramide de compétences -->
          <path d="M290 136h8v60h-8z" fill="#9C6C33" />
          <path d="M268 196l16-60h6l-16 60zM320 196l-16-60h6l16 60z" fill="#C08B4B" />
          <path d="M262 56h64v80h-64z" fill="#EFF1F5" />
          <path d="M258 52h72v8h-72z" fill="#8A9099" />
          <path d="M294 64l11 18h-22z" fill="#C97350" />
          <path d="M283 86h22l6 14h-34z" fill="#F2B417" />
          <path d="M275 104h38l6 14h-50z" fill="#37A067" />

          <!-- Fenêtre : le chantier au loin, l'intérieur reste relié au métier -->
          <path d="M352 44h112v88H352z" fill="#8A9099" />
          <path d="M358 50h100v76H358z" fill="url(#cnpmSkyTraining)" />
          <path d="M384 66h5v42h-5zM366 62h52v5h-52z" fill="#F2B417" />
          <path d="M424 80h26v28h-26z" fill="#AEBBE8" />
          <path d="M358 108q26-12 52-4t48-2v24H358z" fill="#CDAC71" />
          <path d="M406 50h4v76h-4zM358 86h100v4H358z" fill="#8A9099" />
          <path d="M346 132h124v8H346z" fill="#C0C6D1" />

          <!-- Meuble bas sous la fenêtre : casque et plans roulés -->
          <path d="M352 160h104v5H352z" fill="#D9A560" />
          <path d="M356 165h96v31h-96z" fill="#C08B4B" />
          <path d="M402 165h4v31h-4z" fill="#9C6C33" />
          <path d="M404 146h8v14h-8zM416 148h8v12h-8z" fill="#EFF1F5" />
          <path d="M404 146h8v3h-8zM416 148h8v3h-8z" fill="#C3CDF2" />
          <path d="M379 160a9 9 0 0 1 18 0z" fill="#F2B417" />
          <path d="M377 157h22v3h-22z" fill="#D69A0C" />

          <!-- Plante de coin -->
          <path d="M6 196v-14h20v14z" fill="#B0713F" />
          <path d="M4 180h24v5H4z" fill="#C9613F" />
          <circle cx="16" cy="168" r="13" fill="#2C7A50" />
          <circle cx="26" cy="176" r="9" fill="#37A067" />
          <circle cx="7" cy="175" r="8" fill="#46B378" />

          <!-- Formateur : gabarit du lot ancré aux pieds, agrandi pour le plan médian.
               Pas de casque : la scène est en intérieur. -->
          <g transform="translate(224,206) scale(1.3)" fill="#1D286C">
            <path d="M-8 0v-18h6v18zM2 0v-18h6v18z" />
            <path d="M-10-36h20v20h-20z" fill="#2C7A50" />
            <path d="M-10-36h7v20h-7z" fill="#215F3E" />
            <path d="M-14-35h4v16h-4zM10-35h4v16h-4z" fill="#215F3E" />
            <circle cy="-42" r="6" fill="#8A5A34" />
          </g>
          <path d="M203 182l-10-40 6-2 10 40z" fill="#9C6C33" />

          <!-- Participants attablés : vêtements et carnations tous différents -->
          <g>
            <path d="M51 216v-14a22 22 0 0 1 30 0v14z" fill="#F2B417" />
            <path d="M51 216v-13h9v13z" fill="#D69A0C" />
            <path d="M72 206h16v7H72z" fill="#D69A0C" />
            <circle cx="66" cy="188" r="9" fill="#E0B489" />
          </g>
          <g>
            <path d="M141 216v-14a22 22 0 0 1 30 0v14z" fill="#3A4E9E" />
            <path d="M141 216v-13h9v13z" fill="#2F3F91" />
            <path d="M162 206h16v7h-16z" fill="#2F3F91" />
            <circle cx="156" cy="188" r="9" fill="#8A5A34" />
          </g>
          <g>
            <path d="M285 216v-14a22 22 0 0 1 30 0v14z" fill="#C9613F" />
            <path d="M285 216v-13h9v13z" fill="#A64C2E" />
            <path d="M306 206h16v7h-16z" fill="#A64C2E" />
            <circle cx="300" cy="188" r="9" fill="#C08B5A" />
          </g>
          <g>
            <path d="M385 216v-14a22 22 0 0 1 30 0v14z" fill="#2F8F5B" />
            <path d="M385 216v-13h9v13z" fill="#25764A" />
            <path d="M406 206h16v7h-16z" fill="#25764A" />
            <circle cx="400" cy="188" r="9" fill="#E0B489" />
          </g>

          <!-- Tables : plateau, retour d'ombre et piètement -->
          <path d="M18 214h190v10H18zM252 214h210v10H252z" fill="#C08B4B" />
          <path d="M18 224h190v6H18zM252 224h210v6H252z" fill="#9C6C33" />
          <path d="M28 230h8v26h-8zM190 230h8v26h-8zM262 230h8v26h-8zM444 230h8v26h-8z" fill="#7A5A32" />

          <!-- Prise de notes : feuilles, crayons et mains posées -->
          <path d="M40 214h34v9H40zM130 214h34v9h-34zM274 214h34v9h-34zM374 214h34v9h-34z" fill="#EFF1F5" />
          <path d="M44 217h10v3H44zM134 217h10v3h-10zM278 217h10v3h-10zM378 217h10v3h-10z" fill="#F2C24A" />
          <circle cx="90" cy="212" r="4" fill="#E0B489" />
          <circle cx="180" cy="212" r="4" fill="#8A5A34" />
          <circle cx="324" cy="212" r="4" fill="#C08B5A" />
          <circle cx="424" cy="212" r="4" fill="#E0B489" />
        </svg>
      }
      }
    </span>
  `,
  styleUrl: './scene.component.scss',
})
export class SceneComponent {
  readonly name = input.required<CnpmSceneName>();
  /** Masque la scene aux lecteurs d'ecran lorsqu'elle double une information deja ecrite. */
  readonly decorative = input(false);

  protected readonly alt = computed(() => SCENE_ALT[this.name()]);
}
