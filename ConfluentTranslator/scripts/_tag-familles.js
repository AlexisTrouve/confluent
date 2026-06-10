/**
 * _tag-familles — pose le champ `famille` (métadonnée inerte) sur chaque sens natif, pour grouper la carte.
 * QUOI : tague traductions[0].famille dans les 2 fichiers de sens natifs selon la table FAMILLES.
 *        node scripts/_tag-familles.js  (les formes non listées → 'divers' + warn).
 * POURQUOI : le groupage par racine éparpillait 46 formes en solo ; on fixe ~20 familles propres.
 */
'use strict';
const fs = require('fs'), path = require('path');
const FILES = [
  path.join(__dirname, '..', '..', 'ancien-confluent', 'lexique', '32-sens-natifs.json'),
  path.join(__dirname, '..', '..', 'mythologique-confluent', 'lexique', '02-sens-natifs-sacres.json'),
];
// famille → formes confluent (chaque forme dans UNE famille = sa famille primaire)
const FAMILLES = {
  mort: ['osiimuli', 'osiiura', 'osiieku', 'osiivuku', 'osieva', 'osikari', 'tonak', 'kesakari', 'velaora'],
  ancetre: ['aitaura', 'aitaeku', 'aitazoka', 'aitameva', 'aitakota', 'kasiuaita', 'aitabuka'],
  memoire: ['morisili', 'morivosak', 'morisuva', 'morituva', 'morileku', 'morimuli', 'morivoki', 'kovamori'],
  nom: ['nuli', 'nulituva', 'nulim'],
  feu: ['sukvasi', 'sukikanu', 'sukimil', 'sukimukis', 'sukamako', 'sukiva', 'isukibuka', 'sukibuka'],
  eclat: ['isukesa', 'isukèva', 'isukilusak', 'lusak', 'sukilusak', 'mutaeva', 'kisoèva'],
  veille: ['vela', 'velakonu', 'velaeka', 'velalozak', 'velaska', 'veluzeru', 'velis', 'nelak', 'kanuvela', 'kanuvosak'],
  regard: ['tuvak', 'mevak', 'lozak', 'venat', 'solak', 'solasavu', 'solakasi', 'solatosa', 'solavela', 'vesuna'],
  signe: ['silimori', 'silikasi', 'silikova'],
  serment: ['savu', 'savuvosak', 'savunekan', 'savuzoka', 'tolura'],
  sang: ['kinakova', 'kinatori', 'kinazoka', 'kinasora'],
  transmettre: ['konusupu', 'konuvaru', 'konuleku'],
  souillure: ['seluvela', 'selukumu', 'selura', 'kavuno'],
  pierre: ['karimori', 'karituli', 'karizoka'],
  eau: ['urateki', 'urasili', 'sevuna', 'luvak', 'limava'],
  lieu: ['tekiuasa', 'vukuteki', 'tekiota', 'tokituli', 'tisatuli', 'vasibuka', 'sukiloku'],
  masque: ['mukazoka', 'mukak', 'mulik', 'silenu'],
  fete: ['desuli', 'oraveli', 'kotamuki'],
  cosmos: ['kosam', 'enasoku', 'samoèva', 'vèluk', 'sora', 'soruma'],
  divers: ['ita', 'suvak', 'venu', 'nesura', 'motak', 'sumak', 'zokasili', 'takusili', 'besinekan', 'pikora', 'vokik', 'nuvaki'],
};
const form2fam = {};
for (const [fam, forms] of Object.entries(FAMILLES)) for (const f of forms) form2fam[f] = fam;

let tagged = 0, missing = [];
for (const file of FILES) {
  const j = JSON.parse(fs.readFileSync(file, 'utf-8'));
  for (const [key, e] of Object.entries(j.dictionnaire)) {
    if (key.startsWith('_')) continue;
    const t = (e.traductions || [])[0];
    if (!t || !t.confluent) continue;
    const fam = form2fam[t.confluent];
    if (fam) { t.famille = fam; tagged++; }
    else { t.famille = 'divers'; missing.push(`${t.confluent} [${key}]`); }
  }
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf-8');
  console.log(`${path.basename(file)} taggé`);
}
console.log(`\n${tagged} formes taguées.`);
if (missing.length) console.log(`⚠️ ${missing.length} non listées (→ divers) :\n  ${[...new Set(missing)].join('\n  ')}`);
