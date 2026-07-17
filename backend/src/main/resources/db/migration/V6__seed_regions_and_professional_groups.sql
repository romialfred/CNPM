-- V6__seed_regions_and_professional_groups.sql
--
-- Nomenclature institutionnelle réelle du CNPM, fournie par le commanditaire depuis
-- le site officiel cnpm.ml (groupements professionnels et Conseils Patronaux de
-- Région). Il s'agit de la STRUCTURE publique du CNPM — pas de données confidentielles
-- de membres. Les libellés sont repris tels quels et restent à valider par le CNPM
-- (l'extraction a laissé une dénomination incomplète, AEPES, réduite à son sigle).
--
-- Idempotent (ON CONFLICT ... DO NOTHING) : rejouable sans effet de bord.

-- --------------------------------------------------------------------------
-- Régions : les 7 Conseils Patronaux de Région (CPR). Le District de Bamako
-- (siège) n'est pas un CPR ; son ajout éventuel relève d'un arbitrage CNPM.
-- --------------------------------------------------------------------------
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'KAYES', 'Kayes', 1, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'KOULIKORO', 'Koulikoro', 2, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'SIKASSO', 'Sikasso', 3, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'SEGOU', 'Ségou', 4, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'MOPTI', 'Mopti', 5, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'GAO', 'Gao', 6, true) ON CONFLICT (domain, code) DO NOTHING;
INSERT INTO ref.reference_value (domain, code, label, sort_order, active) VALUES ('REGION', 'TOMBOUCTOU', 'Tombouctou', 7, true) ON CONFLICT (domain, code) DO NOTHING;

-- --------------------------------------------------------------------------
-- Groupements professionnels : les 39 associations de branche du CNPM.
-- `sector_code` est laissé NULL — le site ne publie pas de taxonomie de secteurs ;
-- l'affectation d'un secteur à chaque groupement relève d'un arbitrage CNPM.
-- --------------------------------------------------------------------------
INSERT INTO member.professional_group (code, name) VALUES ('ACRCM', 'Association Coopérative des Revendeurs de Carburants du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('AMAVT', 'Association Malienne des Agences de Voyages et de Tourisme') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('AMEITA', 'Association Malienne des Experts Agréés en Industrie et Transports') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('AMELEF', 'Association Malienne des Exportateurs de Légumes et Fruits') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('AMEPROC', 'Association Malienne des Exportateurs des Produits de la Cueillette') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('AMIM', 'Association des Maîtres Imprimeurs du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('APBEF', 'Association Professionnelle des Banques et Etablissements Financiers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('APIM', 'Association des Promoteurs Immobiliers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('APSFD-MALI', 'Association Professionnelle des Systèmes Financiers Décentralisés du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('CAGCDM', 'Coordination des Associations et Groupements des Commerçants Détaillants du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('CCAM', 'Comité des Compagnies d''Assurances du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('CIEM', 'Conseil des Investisseurs Européen au Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('CNEIM', 'Chambre Nationale des Experts Judiciaires Évaluateurs Immobiliers Agrées du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('CNOM', 'Conseil National des Opérateurs Miniers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('CONABEM', 'Conseil National des Bureaux de Placement Payant et Entreprises de Travail Temporaire du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FEBEVIM', 'Fédération des Exportateurs de Bétails et Viande du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FENACOM', 'Fédération Nationale des Consultants du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FENAGROUP', 'Fédération Nationale des Groupements Professionnels des Transporteurs Routiers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FETRAM', 'Fédération des Transitaires, Commissionnaires Agréés en Douanes du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FNES', 'Fédération Nationale des Entreprises de Services') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FNIHM', 'Fédération Nationale des Industries Hôtelières du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('FNTRM', 'Fédération Nationale des Transporteurs Routiers du Mali') ON CONFLICT (code) DO NOTHING;
-- GCM : l'extraction du site a renvoyé un libellé dupliqué de CAGCDM (probable erreur) ;
-- le sigle est conservé, la dénomination reste à confirmer par le CNPM.
INSERT INTO member.professional_group (code, name) VALUES ('GCM', 'GCM') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('GLPM', 'Groupement des Libraires et Papetiers au Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('GMPP', 'Groupement Malien des Professionnels du Pétrole') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('GPAC', 'Groupement Professionnel des Agences de Communication et Régies Publicitaires du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('GPP', 'Groupement Professionnel des Pétroliers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('GPSMM', 'Groupement des Professionnels du Secteur Minier du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('OPECOM', 'Organisation Patronale des Entrepreneurs de la Construction du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('OPI', 'Organisation Patronale des Industriels') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('ORIAM', 'Réseau des Opérateurs d''Intrants Agricoles du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('PANOTECH', 'Patronat de l''Audiovisuel et des Nouvelles Technologies') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('RFOE', 'Réseau des Femmes Opératrices Economique du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('SET', 'Syndicat des Entreprises de Transport') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('SPBM', 'Syndicat Patronal des Boulangers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('SYNACODEM', 'Syndicat National des Commerçants Détaillants du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('SYNAPO', 'Syndicat Autonome des Pharmaciens d''Officine Privée') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('UNOMIN', 'Union Nationale des Opérateurs Miniers du Mali') ON CONFLICT (code) DO NOTHING;
INSERT INTO member.professional_group (code, name) VALUES ('AEPES', 'AEPES') ON CONFLICT (code) DO NOTHING;
