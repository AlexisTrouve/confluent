#!/usr/bin/env node
/**
 * Confluent (romanisé) -> séquence de GLYPHES, avec ÉCHEC FRANC précis.
 *
 * QUOI : pour chaque mot d'un texte Confluent, résout la suite de glyphes :
 *   1. mot dans le registre -> son glyphe ;
 *   2. sinon décomposition morpho (racine-liaison-racine) -> un glyphe par pièce ;
 *   3. sinon strip d'un conjugateur verbal -> racine (+ conjugateur) ;
 *   si une pièce n'a pas de glyphe -> ERREUR indiquant ligne/mot/caractère + la pièce fautive.
 * POURQUOI : doctrine du projet — jamais de fallback silencieux ; on bloque en pointant le coupable.
 * USAGE : node scripts/confluent2glyphes.js "va naki vo ura mirak u"
 */
'use strict';
const path = require('path'), fs = require('fs');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { buildReverseIndex } = require('../src/core/morphology/reverseIndexBuilder');
const { decomposeWord } = require('../src/core/morphology/morphologicalDecomposer');
const { extractRadicals } = require('../src/core/morphology/radicalMatcher');
const { ANCIEN } = require('../src/core/eras/eras');

const GLYPHS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'glyphes-anciens.json'), 'utf8')).glyphes;
const { ancien } = loadAllLexiques(path.join(__dirname, '..', '..'));
const RIDX = buildReverseIndex(ancien);

// Map forme-liée / racine → forme PLEINE (clé de glyphe). POURQUOI : une composition utilise souvent
// la FORME LIÉE d'une racine (ex. "tok" pour toka, "sil" pour sili, "mira" pour le verbe mirak) ;
// le segmenteur doit pouvoir mapper ce fragment vers le glyphe de la racine pleine.
const LIEE2FULL = {};
for (const e of Object.values(ancien.dictionnaire)) for (const t of (e.traductions || [])) {
  if (t.confluent && /\s/.test(t.confluent)) continue;            // ignorer les compositions multi-mots
  if (t.forme_liee && t.confluent) LIEE2FULL[t.forme_liee] = LIEE2FULL[t.forme_liee] || t.confluent;
  if (t.racine && t.confluent && t.racine !== t.confluent) LIEE2FULL[t.racine] = LIEE2FULL[t.racine] || t.confluent;
}

// Segmentation DIRECTE en glyphes : découpe le mot en une suite de CLÉS du registre (racines,
// liaisons, suffixes…). POURQUOI : gère les compositions par CONCATÉNATION directe (racine+racine
// SANS liaison, ex. zo+zeru, neka+toku) que decomposeWord ne trouve pas (il ne coupe qu'aux liaisons).
// COMMENT : récursif, plus long préfixe glyphé d'abord (backtracking) ; retourne la 1re segmentation
// complète, ou null. (Les racines en forme pleine = clés du registre ; les formes liées passent par decomposeWord.)
function segmentGlyphs(word, depth = 0) {
  if (!word) return [];
  if (depth > 9) return null;
  for (let len = Math.min(word.length, 8); len >= 1; len--) {
    const pre = word.slice(0, len);
    // pièce = clé de glyphe directe, OU forme-liée mappée vers une racine pleine glyphée.
    const key = GLYPHS[pre] ? pre : (GLYPHS[LIEE2FULL[pre]] ? LIEE2FULL[pre] : null);
    if (key) {
      const rest = segmentGlyphs(word.slice(len), depth + 1);
      if (rest !== null) return [key, ...rest];
    }
  }
  return null;
}

// Résout UN mot -> liste de clés-glyphes, ou jette { word, piece, raison }.
function resolveWord(word) {
  word = (word || '').toLowerCase();                             // Confluent = tout en minuscules (noms propres inclus)
  if (GLYPHS[word]) return [word];                               // 1. direct (racine/particule/liaison)

  // 2. composition : on essaie TOUTES les décompositions et on retient la 1re dont CHAQUE pièce est
  //    glyphée. POURQUOI : decomposeWord trie par confiance, mais le « meilleur » découpage [0] n'est
  //    pas toujours le bon (il peut produire des fragments sans glyphe) ; le découpage entièrement
  //    glyphable est ailleurs dans la liste. (Jamais de glyphe unique pour une composition : on assemble.)
  const decomps = decomposeWord(word, RIDX, ANCIEN.liaisons);
  let bestCompo = null;
  for (const d of (decomps || [])) {
    if (!d.roots) continue;
    const pieces = [];
    d.roots.forEach((r, i) => {
      pieces.push(r.fullRoot || r.part);
      // Insérer le glyphe de LIAISON entre deux racines. d.liaisons est un TABLEAU
      // (liaisons[i] = liaison entre racine i et i+1) — vrai pour 'simple' (2 racines) ET 'recursive' (3+).
      if (i < d.roots.length - 1 && d.liaisons && d.liaisons[i]) pieces.push(d.liaisons[i].liaison);
    });
    if (pieces.every(p => GLYPHS[p])) return pieces;
    if (!bestCompo) bestCompo = pieces.filter(p => !GLYPHS[p]);
  }

  // 2bis. Segmentation directe en glyphes (compositions par concaténation racine+racine sans liaison).
  const seg = segmentGlyphs(word);
  if (seg && seg.length > 1) return seg;

  const rads = extractRadicals(word, ANCIEN.verbalSuffixes, ANCIEN.conjugateurCodes); // 3. verbe (conjugué OU infinitif)
  // On cherche un découpage racine + suffixe où LES DEUX sont glyphés (conjugateur OU suffixe d'infinitif).
  for (const r of (rads || [])) {
    if ((r.type === 'conjugaison' || r.type === 'infinitif') && GLYPHS[r.radical || ''] && GLYPHS[r.suffix]) {
      return [r.radical, r.suffix];
    }
  }
  // Racine reconnue mais suffixe verbal pas (encore) glyphé → on pointe précisément le suffixe manquant.
  const near = (rads || []).find(r => (r.type === 'conjugaison' || r.type === 'infinitif') && GLYPHS[r.radical || '']);
  if (near) throw { word, piece: near.suffix, raison: `suffixe verbal « ${near.suffix} » non glyphé (racine ${near.radical} OK)` };
  if (bestCompo) throw { word, piece: bestCompo[0], raison: `composition non résolue : pièce « ${bestCompo[0]} » sans glyphe (découpage morpho imparfait)` };
  throw { word, piece: word, raison: 'aucun glyphe, ni composition, ni verbe reconnu' };
}

// Convertit un texte (multi-lignes) -> { ok, glyphes:[...] } ou { erreur:{ligne,col,mot,raison} }.
function convert(text) {
  const lines = text.split('\n');
  const out = [];
  for (let li = 0; li < lines.length; li++) {
    let col = 0;
    for (const word of lines[li].split(/\s+/).filter(Boolean)) {
      const c = lines[li].indexOf(word, col); col = c + word.length;
      try { out.push({ word, glyphes: resolveWord(word) }); }
      catch (e) { return { erreur: { ligne: li + 1, col: c + 1, mot: e.word, piece: e.piece, raison: e.raison } }; }
    }
  }
  return { ok: true, glyphes: out };
}

module.exports = { convert, resolveWord };

if (require.main === module) {
  const tests = process.argv[2] ? [process.argv[2]] : [
    'va naki vo ura mirak u',   // phrase simple (tout au registre)
    'siliaska',                 // composition sili-i-aska -> doit se décomposer
    'va naki vo mirakat',       // mirakat = voir+passé(at) -> conjugateur 'at' non glyphé (erreur ciblée)
    'va xyzzy vo'               // mot bidon -> erreur ciblée
  ];
  for (const t of tests) {
    const r = convert(t);
    if (r.ok) console.log('OK  « ' + t + ' »  ->  ' + r.glyphes.map(g => g.word + '[' + g.glyphes.join('+') + ']').join('  '));
    else console.log('ERR « ' + t + ' »  ->  ligne ' + r.erreur.ligne + ' col ' + r.erreur.col + ' mot «' + r.erreur.mot + '» : ' + r.erreur.raison);
  }
}
