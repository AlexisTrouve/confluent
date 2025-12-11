#!/usr/bin/env node

/**
 * Script de correction automatique des doublons du lexique Confluent
 *
 * Stratégie:
 * 1. Identifier tous les doublons
 * 2. Prioriser les entrées à garder (racines sacrées > racines standards > grammaire > compositions)
 * 3. Générer de nouveaux mots Confluent pour les doublons à remplacer
 * 4. Mettre à jour les fichiers JSON
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = path.join(__dirname, '../ancien-confluent/lexique');

// Phonologie
const CONSONNES = ['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z'];
const CONSONNES_RARES = ['r', 'd', 'h', 'g']; // À éviter mais tolérées
const VOYELLES = ['a', 'e', 'i', 'o', 'u'];

// Mots déjà utilisés dans le lexique
const MOTS_EXISTANTS = new Set();

/**
 * Génère un mot Confluent aléatoire (racine finissant par CV)
 */
function genererMotCV(longueur = 4, sacre = false) {
  let mot = '';
  const maxAttempts = 1000;
  let attempts = 0;

  while (attempts < maxAttempts) {
    mot = '';

    // Racine sacrée commence par voyelle, standard par consonne
    if (sacre) {
      mot += VOYELLES[Math.floor(Math.random() * VOYELLES.length)];
    } else {
      mot += CONSONNES[Math.floor(Math.random() * CONSONNES.length)];
    }

    // Alterner consonne-voyelle jusqu'à longueur-2
    for (let i = 1; i < longueur - 1; i++) {
      if (i % 2 === (sacre ? 0 : 1)) {
        // Consonne (éviter les consonnes rares sauf 10% du temps)
        const useRare = Math.random() < 0.1;
        const consonneSet = useRare ? [...CONSONNES, ...CONSONNES_RARES] : CONSONNES;
        mot += consonneSet[Math.floor(Math.random() * consonneSet.length)];
      } else {
        // Voyelle
        mot += VOYELLES[Math.floor(Math.random() * VOYELLES.length)];
      }
    }

    // Terminer par CV (consonne + voyelle)
    mot += CONSONNES[Math.floor(Math.random() * CONSONNES.length)];
    mot += VOYELLES[Math.floor(Math.random() * VOYELLES.length)];

    // Vérifier que le mot n'existe pas déjà
    if (!MOTS_EXISTANTS.has(mot)) {
      MOTS_EXISTANTS.add(mot);
      return mot;
    }

    attempts++;
  }

  throw new Error(`Impossible de générer un mot unique après ${maxAttempts} tentatives`);
}

/**
 * Génère un verbe Confluent (CVCVC - finit par consonne)
 */
function genererVerbe() {
  let mot = '';
  const maxAttempts = 1000;
  let attempts = 0;

  while (attempts < maxAttempts) {
    mot = '';

    // CVCVC: commence par consonne
    mot += CONSONNES[Math.floor(Math.random() * CONSONNES.length)];
    mot += VOYELLES[Math.floor(Math.random() * VOYELLES.length)];
    mot += CONSONNES[Math.floor(Math.random() * CONSONNES.length)];
    mot += VOYELLES[Math.floor(Math.random() * VOYELLES.length)];
    mot += CONSONNES[Math.floor(Math.random() * CONSONNES.length)];

    if (!MOTS_EXISTANTS.has(mot)) {
      MOTS_EXISTANTS.add(mot);
      return mot;
    }

    attempts++;
  }

  throw new Error(`Impossible de générer un verbe unique après ${maxAttempts} tentatives`);
}

/**
 * Charge tous les mots du lexique
 */
function chargerTousLesMots() {
  const mots = new Map(); // motCF -> [{file, motFr, type, data}]
  const files = fs.readdirSync(LEXIQUE_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));

  files.forEach(file => {
    const filePath = path.join(LEXIQUE_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.dictionnaire) return;

    Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
      if (!data.traductions) return;

      data.traductions.forEach((trad, index) => {
        const motCF = trad.confluent;
        if (!motCF) return;

        MOTS_EXISTANTS.add(motCF);

        if (!mots.has(motCF)) {
          mots.set(motCF, []);
        }

        mots.get(motCF).push({
          file,
          motFr,
          type: trad.type || 'unknown',
          tradIndex: index,
          data: trad
        });
      });
    });
  });

  return mots;
}

/**
 * Détermine la priorité d'une entrée (plus haut = garder)
 */
function getPriorite(entry) {
  // Priorité par type
  const priorities = {
    'racine_sacree': 1000,
    'racine': 900,
    'particule': 800,
    'marqueur_temps': 800,
    'negation': 800,
    'interrogation': 800,
    'demonstratif': 800,
    'auxiliaire': 800,
    'verbe': 700,
    'verbe_irregulier': 700,
    'composition': 500,
    'nom_propre': 400,
    'quantificateur': 300,
    'relatif': 300,
    'possessif': 300
  };

  let priority = priorities[entry.type] || 100;

  // Bonus pour fichiers de référence
  if (entry.file === '01-racines-sacrees.json') priority += 500;
  if (entry.file === '02-racines-standards.json') priority += 400;
  if (entry.file === '00-grammaire.json') priority += 300;
  if (entry.file === '03-castes.json') priority += 200;
  if (entry.file === '04-lieux.json') priority += 200;

  return priority;
}

/**
 * Identifie les doublons et détermine quoi garder/remplacer
 */
function identifierDoublons(tousLesMots) {
  const doublons = [];

  tousLesMots.forEach((occurrences, motCF) => {
    if (occurrences.length > 1) {
      // Trier par priorité (décroissant)
      occurrences.sort((a, b) => getPriorite(b) - getPriorite(a));

      // Garder le premier, remplacer les autres
      const aGarder = occurrences[0];
      const aRemplacer = occurrences.slice(1);

      doublons.push({
        motCF,
        garder: aGarder,
        remplacer: aRemplacer
      });
    }
  });

  return doublons;
}

/**
 * Génère un nouveau mot selon le type
 */
function genererNouveauMot(entry) {
  if (entry.type === 'verbe' || entry.type === 'verbe_irregulier') {
    return genererVerbe();
  }

  const estSacre = entry.type === 'racine_sacree' || entry.data.confluent?.match(/^[aeiou]/);
  const longueur = entry.data.confluent?.length || 4;

  return genererMotCV(longueur, estSacre);
}

/**
 * Met à jour un fichier JSON pour remplacer un mot
 */
function remplacerMotDansFichier(file, motFr, tradIndex, ancienMot, nouveauMot) {
  const filePath = path.join(LEXIQUE_DIR, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.dictionnaire || !content.dictionnaire[motFr]) {
    console.error(`⚠️  Erreur: mot français "${motFr}" introuvable dans ${file}`);
    return false;
  }

  const traductions = content.dictionnaire[motFr].traductions;
  if (!traductions || !traductions[tradIndex]) {
    console.error(`⚠️  Erreur: traduction #${tradIndex} introuvable pour "${motFr}" dans ${file}`);
    return false;
  }

  const trad = traductions[tradIndex];
  if (trad.confluent !== ancienMot) {
    console.error(`⚠️  Erreur: mot attendu "${ancienMot}" mais trouvé "${trad.confluent}" pour "${motFr}" dans ${file}`);
    return false;
  }

  // Mettre à jour le mot
  trad.confluent = nouveauMot;

  // Mettre à jour forme_liee si elle existe
  if (trad.forme_liee) {
    if (trad.type === 'verbe' || trad.type === 'verbe_irregulier') {
      // Pour les verbes, forme_liee = racine (enlever dernière consonne)
      trad.forme_liee = nouveauMot.slice(0, -1);
    } else {
      // Pour les racines, forme_liee = enlever dernière voyelle
      trad.forme_liee = nouveauMot.slice(0, -1);
    }
  }

  // Sauvegarder
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  return true;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔧 Correction automatique des doublons du lexique Confluent\n');

  // Charger tous les mots
  console.log('📖 Chargement du lexique...');
  const tousLesMots = chargerTousLesMots();
  console.log(`   ${MOTS_EXISTANTS.size} mots uniques chargés\n`);

  // Identifier les doublons
  console.log('🔍 Identification des doublons...');
  const doublons = identifierDoublons(tousLesMots);
  console.log(`   ${doublons.length} doublons détectés\n`);

  if (doublons.length === 0) {
    console.log('✅ Aucun doublon à corriger !\n');
    return;
  }

  // Préparer les remplacements
  const remplacements = [];

  console.log('📝 Génération des nouveaux mots...\n');
  doublons.forEach(doublon => {
    doublon.remplacer.forEach(entry => {
      const nouveauMot = genererNouveauMot(entry);
      remplacements.push({
        file: entry.file,
        motFr: entry.motFr,
        tradIndex: entry.tradIndex,
        ancienMot: doublon.motCF,
        nouveauMot,
        type: entry.type
      });
    });
  });

  console.log(`💾 Application de ${remplacements.length} remplacements...\n`);

  // Appliquer les remplacements
  let succes = 0;
  let echecs = 0;

  remplacements.forEach(repl => {
    const ok = remplacerMotDansFichier(
      repl.file,
      repl.motFr,
      repl.tradIndex,
      repl.ancienMot,
      repl.nouveauMot
    );

    if (ok) {
      console.log(`✓ [${repl.file}] "${repl.motFr}": ${repl.ancienMot} → ${repl.nouveauMot}`);
      succes++;
    } else {
      console.log(`✗ [${repl.file}] "${repl.motFr}": échec du remplacement`);
      echecs++;
    }
  });

  console.log(`\n📊 RÉSULTATS:\n`);
  console.log(`  ✅ ${succes} remplacements réussis`);
  console.log(`  ❌ ${echecs} échecs`);
  console.log(`\n🔍 Relancez l'audit pour vérifier: node scripts/audit-lexique.js\n`);
}

if (require.main === module) {
  main();
}
