#!/usr/bin/env node
/**
 * Analyse des LOGS DE TRADUCTION → signal actionnable.
 *
 * QUOI : agrège logs/translations-*.jsonl et sort : (1) les GAPS de lexique les plus fréquents
 *        (concepts/racines que l'agent a cherchés en vain → la liste à ajouter au lexique),
 *        (2) les FORMES CASSÉES récurrentes (→ durcir le prompt), (3) le taux de réparation et
 *        d'échec, (4) le corpus FR↔CF.
 * POURQUOI : « apprendre des trucs dans le process de trad » — c'est le livrable qui fait grandir
 *        la langue là où on s'en sert vraiment, au lieu de deviner les racines à la main.
 * USAGE : node scripts/analyze-translations.js [--gaps] [--corpus] [--json]
 *         (défaut = rapport lisible ; --gaps = liste brute des gaps ; --corpus = paires FR↔CF)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { LOGS_DIR } = require('../src/utils/logger');

const args = new Set(process.argv.slice(2));

// 1. Charger toutes les lignes JSONL de tous les fichiers translations-*.jsonl.
function loadEntries() {
  let files = [];
  try { files = fs.readdirSync(LOGS_DIR).filter(f => /^translations-.*\.jsonl$/.test(f)); }
  catch (e) { return []; }
  const out = [];
  for (const f of files) {
    for (const line of fs.readFileSync(path.join(LOGS_DIR, f), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { out.push(JSON.parse(line)); } catch (e) { /* ligne corrompue ignorée */ }
    }
  }
  return out;
}

// 2. Compteur de fréquence trié décroissant.
function tally(items) {
  const m = new Map();
  for (const it of items) m.set(it, (m.get(it) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

const entries = loadEntries();
if (entries.length === 0) { console.log('Aucun log de traduction (logs/translations-*.jsonl vide).'); process.exit(0); }

const ok = entries.filter(e => e.ok);
const fail = entries.filter(e => !e.ok);
const gaps = tally(entries.flatMap(e => e.gaps || []));
const broken = tally(entries.flatMap(e => e.brokenForms || []));
const repairsList = ok.map(e => e.repairs || 0);
const avgRepairs = repairsList.length ? (repairsList.reduce((a, b) => a + b, 0) / repairsList.length) : 0;
const withRepair = repairsList.filter(r => r > 0).length;

// --- Sorties spécialisées ---
if (args.has('--json')) {
  console.log(JSON.stringify({ total: entries.length, ok: ok.length, fail: fail.length, gaps, brokenForms: broken, avgRepairs }, null, 2));
  process.exit(0);
}
if (args.has('--gaps')) { for (const [g, n] of gaps) console.log(`${n}\t${g}`); process.exit(0); }
if (args.has('--corpus')) { for (const e of ok) console.log(`${e.fr}\t→\t${e.cf}`); process.exit(0); }

// --- Rapport lisible (défaut) ---
console.log(`\n=== ANALYSE TRADUCTIONS (${entries.length} traductions) ===`);
console.log(`  ✓ réussies : ${ok.length}   ✗ échecs francs : ${fail.length}`);
console.log(`  réparations : ${avgRepairs.toFixed(2)}/trad en moyenne · ${withRepair} trad ont nécessité ≥1 réparation`);

console.log(`\n--- GAPS DE LEXIQUE (top 25) — concepts/racines cherchés en vain → À AJOUTER ---`);
if (gaps.length === 0) console.log('  (aucun)');
else for (const [g, n] of gaps.slice(0, 25)) console.log(`  ${String(n).padStart(3)} × ${g}`);

console.log(`\n--- FORMES CASSÉES (top 15) — rejetées par le gate/compo → durcir le prompt ---`);
if (broken.length === 0) console.log('  (aucune)');
else for (const [b, n] of broken.slice(0, 15)) console.log(`  ${String(n).padStart(3)} × ${b}`);

if (fail.length > 0) {
  console.log(`\n--- ÉCHECS FRANCS (${fail.length}) — FR non traduisibles en l'état ---`);
  for (const e of fail.slice(0, 10)) console.log(`  « ${e.fr} » : ${e.error || '?'}`);
}

console.log(`\nDétail : --gaps (liste brute) · --corpus (paires FR↔CF) · --json\n`);
