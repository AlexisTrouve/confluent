#!/usr/bin/env node

/**
 * Script d'audit du lexique Confluent
 * Vérifie que tous les mots respectent les règles linguistiques
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = path.join(__dirname, '../ancien-confluent/lexique');

// Règles phonétiques
const CONSONNES_STANDARD = ['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z'];
const CONSONNES_RARES = ['r', 'd', 'h', 'g']; // Sons "bruts" à éviter mais tolérés
const CONSONNES_INTERDITES = ['c', 'f', 'j', 'q', 'w', 'x', 'y'];
const VOYELLES_ACTIVES = ['a', 'e', 'i', 'o', 'u'];
const VOYELLES_RESERVEES = ['y', 'é', 'è'];

// Les 16 liaisons sacrées
const LIAISONS_SACREES = [
  'i', 'ie', 'ii', 'iu',  // I - Agentivité
  'u', 'ui',              // U - Appartenance
  'a', 'aa', 'ae', 'ao',  // A - Relation
  'o', 'oa',              // O - Tension
  'e', 'ei', 'ea', 'eo'   // E - Dimension
];

let errors = [];
let warnings = [];
let stats = {
  total_mots: 0,
  racines_sacrees: 0,
  racines_standards: 0,
  compositions: 0,
  erreurs: 0,
  avertissements: 0,
  consonnes_rares_utilisees: 0,
  mots_avec_consonnes_rares: []
};

/**
 * Vérifie si un caractère est une consonne valide
 */
function estConsonneValide(c) {
  return CONSONNES_STANDARD.includes(c) || CONSONNES_RARES.includes(c);
}

/**
 * Vérifie si un caractère est une consonne rare
 */
function estConsonneRare(c) {
  return CONSONNES_RARES.includes(c);
}

/**
 * Vérifie si un caractère est une consonne interdite
 */
function estConsonneInterdite(c) {
  return CONSONNES_INTERDITES.includes(c);
}

/**
 * Vérifie si un caractère est une voyelle active
 */
function estVoyelleActive(c) {
  return VOYELLES_ACTIVES.includes(c);
}

/**
 * Vérifie si un caractère est une voyelle réservée
 */
function estVoyelleReservee(c) {
  return VOYELLES_RESERVEES.includes(c);
}

/**
 * Vérifie le format d'un mot (CV pour racines, CVCVC pour verbes)
 */
function verifierFormatCV(mot, file, motFr, type) {
  const chars = mot.split('');
  let hasConsonneRare = false;

  // Vérifier les espaces (invalides)
  if (mot.includes(' ')) {
    errors.push(`[${file}] "${motFr}" → "${mot}": Caractère invalide ' '`);
    return false;
  }

  // Vérifier les caractères invalides
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];

    if (c === '-') continue; // Tirets OK pour compositions

    if (estConsonneRare(c)) {
      hasConsonneRare = true;
    } else if (estConsonneInterdite(c)) {
      errors.push(`[${file}] "${motFr}" → "${mot}": Consonne interdite '${c}'`);
      return false;
    } else if (estVoyelleReservee(c)) {
      errors.push(`[${file}] "${motFr}" → "${mot}": Voyelle réservée '${c}' (y, é, è interdits)`);
      return false;
    } else if (!estConsonneValide(c) && !estVoyelleActive(c)) {
      errors.push(`[${file}] "${motFr}" → "${mot}": Caractère invalide '${c}'`);
      return false;
    }
  }

  // Compter les consonnes rares
  if (hasConsonneRare) {
    stats.consonnes_rares_utilisees++;
    stats.mots_avec_consonnes_rares.push({mot, file, motFr});
  }

  // Retirer les tirets (pour les compositions)
  const motSansTirets = mot.replace(/-/g, '');

  if (motSansTirets.length < 2) {
    errors.push(`[${file}] "${motFr}" → "${mot}": Trop court (minimum 2 caractères)`);
    return false;
  }

  const avantDernier = motSansTirets[motSansTirets.length - 2];
  const dernier = motSansTirets[motSansTirets.length - 1];

  // Les VERBES finissent par CVCVC (consonne finale)
  // Les RACINES finissent par CV (voyelle finale)
  if (type === 'verbe' || type === 'verbe_irregulier') {
    // Verbes: structure CVCVC (5 lettres, finit par consonne)
    if (!estConsonneValide(dernier)) {
      errors.push(`[${file}] "${motFr}" → "${mot}": Verbe doit finir par consonne (CVCVC), mais dernier caractère '${dernier}' n'est pas une consonne`);
      return false;
    }
  } else {
    // Racines et compositions: finissent par CV (voyelle)
    if (!estConsonneValide(avantDernier)) {
      errors.push(`[${file}] "${motFr}" → "${mot}": Doit finir par CV (consonne+voyelle), mais avant-dernier caractère '${avantDernier}' n'est pas une consonne`);
      return false;
    }

    if (!estVoyelleActive(dernier)) {
      errors.push(`[${file}] "${motFr}" → "${mot}": Doit finir par CV (consonne+voyelle), mais dernier caractère '${dernier}' n'est pas une voyelle`);
      return false;
    }
  }

  return true;
}

/**
 * Vérifie si une racine est sacrée (commence par voyelle)
 */
function estRacineSacree(mot) {
  return estVoyelleActive(mot[0]);
}

/**
 * Charge toutes les racines du lexique
 */
function chargerToutesLesRacines() {
  const racines = new Map();
  const files = fs.readdirSync(LEXIQUE_DIR).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const filePath = path.join(LEXIQUE_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.dictionnaire) return;

    Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
      if (!data.traductions) return;

      data.traductions.forEach(trad => {
        // Charger les racines explicites
        if (trad.type === 'racine' || trad.type === 'racine_sacree') {
          racines.set(trad.confluent, {
            mot_fr: motFr,
            forme_liee: trad.forme_liee,
            file: file
          });
        }

        // Charger les VERBES eux-mêmes comme racines (milak, kitan, etc.)
        if (trad.type === 'verbe') {
          racines.set(trad.confluent, {
            mot_fr: motFr,
            forme_liee: trad.forme_liee,
            file: file,
            source: 'verbe'
          });
          // Charger aussi la racine du verbe si elle existe
          if (trad.racine) {
            racines.set(trad.racine, {
              mot_fr: motFr,
              forme_liee: trad.forme_liee,
              file: file,
              source: 'verbe_racine'
            });
          }
        }

        // Charger les COMPOSITIONS comme racines valides (uraakota, etc.)
        if (trad.type === 'composition' || trad.type === 'racine_sacree_composee') {
          racines.set(trad.confluent, {
            mot_fr: motFr,
            forme_liee: trad.forme_liee || trad.confluent.slice(0, -1),
            file: file,
            source: 'composition'
          });
        }

        // Charger les mots grammaticaux (négation, particules, démonstratifs, etc.) comme racines valides
        if (trad.type === 'negation' || trad.type === 'particule' || trad.type === 'interrogation' || trad.type === 'demonstratif') {
          racines.set(trad.confluent, {
            mot_fr: motFr,
            forme_liee: trad.forme_liee || trad.confluent.slice(0, -1),
            file: file,
            source: 'grammaire'
          });
        }
      });
    });
  });

  return racines;
}

/**
 * Vérifie une composition
 */
function verifierComposition(trad, file, motFr, toutesLesRacines) {
  if (!trad.composition) {
    warnings.push(`[${file}] "${motFr}" → "${trad.confluent}": Type 'composition' mais pas de champ 'composition'`);
    return;
  }

  if (!trad.racines || trad.racines.length === 0) {
    warnings.push(`[${file}] "${motFr}" → "${trad.confluent}": Type 'composition' mais pas de champ 'racines'`);
    return;
  }

  // Vérifier que les racines existent
  trad.racines.forEach(racine => {
    if (!toutesLesRacines.has(racine)) {
      errors.push(`[${file}] "${motFr}" → "${trad.confluent}": Utilise racine inexistante "${racine}"`);
    }
  });

  // Vérifier le format de composition
  const parties = trad.composition.split('-');

  // Vérifier les liaisons (les parties avec 1-2 lettres entre les racines)
  parties.forEach((partie, index) => {
    if (partie.length <= 2 && index > 0 && index < parties.length - 1) {
      // C'est probablement une liaison
      if (!LIAISONS_SACREES.includes(partie) && partie !== 'u' && partie !== 'a' && partie !== 'i' && partie !== 'o' && partie !== 'e') {
        warnings.push(`[${file}] "${motFr}" → "${trad.confluent}": Liaison "${partie}" dans composition "${trad.composition}" n'est pas une liaison sacrée standard`);
      }
    }
  });
}

/**
 * Vérifie la forme liée
 */
function verifierFormeLiee(trad, file, motFr) {
  if (trad.type !== 'racine' && trad.type !== 'racine_sacree') {
    return;
  }

  if (!trad.forme_liee) {
    warnings.push(`[${file}] "${motFr}" → "${trad.confluent}": Racine sans 'forme_liee'`);
    return;
  }

  // La forme liée devrait être la racine sans la dernière voyelle
  const attendu = trad.confluent.slice(0, -1);
  if (trad.forme_liee !== attendu) {
    warnings.push(`[${file}] "${motFr}" → "${trad.confluent}": forme_liee="${trad.forme_liee}" devrait être "${attendu}"`);
  }
}

/**
 * Audit d'un fichier
 */
function auditerFichier(file, toutesLesRacines) {
  const filePath = path.join(LEXIQUE_DIR, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.dictionnaire) return;

  Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
    if (!data.traductions) return;

    data.traductions.forEach(trad => {
      stats.total_mots++;

      // Vérifier le format CV/CVCVC selon le type
      if (!verifierFormatCV(trad.confluent, file, motFr, trad.type)) {
        stats.erreurs++;
        return;
      }

      // Vérifier le type de racine
      if (trad.type === 'racine' || trad.type === 'racine_sacree') {
        const estSacree = estRacineSacree(trad.confluent);

        if (trad.type === 'racine_sacree' && !estSacree) {
          errors.push(`[${file}] "${motFr}" → "${trad.confluent}": Marqué 'racine_sacree' mais commence par consonne`);
          stats.erreurs++;
        }

        if (trad.type === 'racine' && estSacree) {
          warnings.push(`[${file}] "${motFr}" → "${trad.confluent}": Marqué 'racine' mais commence par voyelle (devrait être 'racine_sacree')`);
          stats.avertissements++;
        }

        if (estSacree) {
          stats.racines_sacrees++;
        } else {
          stats.racines_standards++;
        }

        // Vérifier forme liée
        verifierFormeLiee(trad, file, motFr);
      }

      // Vérifier les compositions
      if (trad.type === 'composition' || trad.type === 'racine_sacree_composee') {
        stats.compositions++;
        verifierComposition(trad, file, motFr, toutesLesRacines);
      }
    });
  });
}

/**
 * Détecte les doublons de mots Confluent
 */
function detecterDoublons() {
  const motsCF = new Map(); // mot -> [{file, motFr, type}]

  const files = fs.readdirSync(LEXIQUE_DIR).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const filePath = path.join(LEXIQUE_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.dictionnaire) return;

    Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
      if (!data.traductions) return;

      data.traductions.forEach(trad => {
        const motCF = trad.confluent;
        if (!motCF) return;

        if (!motsCF.has(motCF)) {
          motsCF.set(motCF, []);
        }

        motsCF.get(motCF).push({
          file: file,
          motFr: motFr,
          type: trad.type || 'unknown'
        });
      });
    });
  });

  // Trouver les doublons
  const doublons = [];
  motsCF.forEach((occurrences, motCF) => {
    if (occurrences.length > 1) {
      doublons.push({ motCF, occurrences });
    }
  });

  return doublons;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔍 Audit du lexique Confluent\n');

  // Charger toutes les racines d'abord
  console.log('📖 Chargement des racines...');
  const toutesLesRacines = chargerToutesLesRacines();
  console.log(`   ${toutesLesRacines.size} racines chargées\n`);

  // Auditer chaque fichier (sauf 00-grammaire pour l'audit, mais on l'a chargé pour les racines)
  const files = fs.readdirSync(LEXIQUE_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('00-grammaire'));

  console.log('🔎 Audit des fichiers...\n');
  files.forEach(file => {
    auditerFichier(file, toutesLesRacines);
  });

  // Détecter les doublons
  console.log('🔍 Détection des doublons...\n');
  const doublons = detecterDoublons();

  if (doublons.length > 0) {
    console.log(`⚠️  DOUBLONS DÉTECTÉS: ${doublons.length} mots Confluent apparaissent plusieurs fois\n`);

    doublons.forEach(({motCF, occurrences}) => {
      errors.push(`DOUBLON: "${motCF}" apparaît ${occurrences.length} fois:`);
      occurrences.forEach(occ => {
        errors.push(`  → [${occ.file}] "${occ.motFr}" (${occ.type})`);
      });
    });
  }

  // Vérifier le ratio de consonnes rares
  const ratioConsonnesRares = (stats.consonnes_rares_utilisees / stats.total_mots) * 100;
  if (ratioConsonnesRares > 10) {
    warnings.push(`⚠️  ATTENTION: ${ratioConsonnesRares.toFixed(1)}% des mots utilisent des consonnes rares (r, d, h, g). Recommandé: <10%`);
  }

  // Afficher les résultats
  console.log('\n📊 STATISTIQUES:\n');
  console.log(`  Total de mots vérifiés:     ${stats.total_mots}`);
  console.log(`  Racines sacrées:            ${stats.racines_sacrees} (${Math.round(stats.racines_sacrees / (stats.racines_sacrees + stats.racines_standards) * 100)}%)`);
  console.log(`  Racines standards:          ${stats.racines_standards} (${Math.round(stats.racines_standards / (stats.racines_sacrees + stats.racines_standards) * 100)}%)`);
  console.log(`  Compositions:               ${stats.compositions}`);
  console.log(`  Consonnes rares utilisées:  ${stats.consonnes_rares_utilisees} (${ratioConsonnesRares.toFixed(1)}%)`);
  console.log(`  Erreurs:                    ${errors.length}`);
  console.log(`  Avertissements:             ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERREURS:\n');
    errors.forEach(err => console.log(`  ${err}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  AVERTISSEMENTS:\n');
    warnings.forEach(warn => console.log(`  ${warn}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ Aucune erreur détectée ! Le lexique est conforme.\n');
  } else {
    console.log('');
  }

  // Code de sortie
  process.exit(errors.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { verifierFormatCV, estRacineSacree };
