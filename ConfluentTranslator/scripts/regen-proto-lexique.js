#!/usr/bin/env node
/**
 * Régénère le lexique proto en appliquant les LOIS DE DÉ-ÉVOLUTION (proto = ancêtre primitif).
 *
 * QUOI : applique deEvolveToProto (src/core/eras/protoDerivation.js) à chaque forme du lexique
 *        proto → formes 4V/8C valides, étymologiquement liées à l'ancien. Idempotent (re-jouable).
 * POURQUOI : le proto est l'ancêtre de l'ancien ; ni doc ni vieux lexique ne faisaient foi, seule
 *        l'INTENTION (codifiée en lois). Ce script matérialise l'intention dans le lexique.
 * USAGE : node scripts/regen-proto-lexique.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { deEvolveToProto } = require('../src/core/eras/protoDerivation');
const { validateForm } = require('../src/core/validation/phonotactics');
const { PROTO } = require('../src/core/eras/eras');

const dir = path.join(__dirname, '..', '..', 'proto-confluent', 'lexique');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));

let changed = 0, total = 0;
for (const file of files) {
  const p = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  for (const entry of Object.values(data.dictionnaire || {})) {
    for (const t of (entry.traductions || [])) {
      if (!t.confluent) continue;
      total++;
      const after = deEvolveToProto(t.confluent);
      if (after !== t.confluent) changed++;
      t.confluent = after;
      if (t.forme_liee) t.forme_liee = deEvolveToProto(t.forme_liee);
    }
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

let bad = [];
for (const file of files) {
  const dict = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')).dictionnaire || {};
  for (const entry of Object.values(dict)) for (const t of (entry.traductions || [])) {
    if (t.confluent && !/\s/.test(t.confluent) && !validateForm(t.confluent, PROTO).valid) bad.push(t.confluent);
  }
}
console.log(`Proto régénéré : ${total} formes, ${changed} transformées. Gate proto : ${bad.length} invalides.`);
process.exit(bad.length ? 1 : 0);
