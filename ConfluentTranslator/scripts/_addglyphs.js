// Ajout AUTO-DÉDUPLIQUÉ (garde : ne touche pas les concepts déjà présents).
'use strict';
const fs = require('fs'), p = 'data/glyphes-anciens.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8'));
const ATOMS = d.atomes, G = d.glyphes;
const N = { c:[50,50], n:[50,14], s:[50,86], e:[68,50], w:[32,50], ne:[64,26], nw:[36,26], se:[64,74], sw:[36,74] };
const orient = e => { const [a,b]=e,[ax,ay]=N[a],[bx,by]=N[b]; const sw=ay>by||(ay===by&&ax>bx); return sw?(e.length===3?[b,a,-e[2]]:[b,a]):e; };
const resolve = g => [].concat((g.atomes||[]).flatMap(a=>ATOMS[a]||[]), g.edges||[]);
const sigG = g => resolve(g).map(e=>orient(e).join('|')).sort().join(';');
const sigA = atoms => resolve({atomes:atoms}).map(e=>orient(e).join('|')).sort().join(';');
const used = new Set(Object.values(G).map(sigG)); // inclut grammaire (edges) ET racines (atomes)
const MODS = ['point','traitV','traitH','jambe','croix','coeurV','base','bandes','voute','anneau','triangle','vague','plus','flamme','mainY','figure','etoile','goutte','maison'];
function unique(atoms){
  if(!used.has(sigA(atoms))) return atoms;
  for(const m of MODS){ const a=atoms.concat(m); if(!used.has(sigA(a))) return a; }
  for(const m1 of MODS) for(const m2 of MODS){ const a=atoms.concat(m1,m2); if(!used.has(sigA(a))) return a; }
  return atoms;
}
const B = {
 taku:['sombre(b)','racine',['croix','base']], nutu:['nourriture(b)','racine',['bouche','vague']], kasi:['tête(b)','racine',['anneau','base']],
 takavi:['accueillir','verbe',['mainY','coeurV']], volaki:['rejeter','verbe',['mainY','croix']], zaki:['gardien','racine',['figure','triangle']],
 tavo:['distance','racine',['traitH','traitH']], melu:['doux','racine',['vague','coeurV']], kiru:['échange','racine',['mainY','mainY']],
 tumi:['enterrer','verbe',['base','fleche']], talu:['hall','racine',['maison','base']], lanu:['jeter','verbe',['mainY','fleche']],
 levi:['lever','verbe',['mainY','traitV']], nomi:['nom','racine',['bandes','anneau']], tavu:['outil','racine',['triangle','traitV']],
 savo:['respect','racine',['figure','voute']], seru:['servir','verbe',['mainY','base']], sopi:['sommeil','racine',['coeurV','base']],
 teku:['technique','racine',['mainY','triangle']], tenu:['tenir','verbe',['mainY','anneau']], venu:['venir','verbe',['fleche','figure']],
 vela:['vigile','racine',['oeil','base']], voli:['vouloir','verbe',['coeurV','fleche']], neki:['créateur','racine',['mainY','etoile']],
 vaku:['allié','racine',['figure','coeurV']],
 zo:['ne...pas','particule',['croix']], zom:['jamais','particule',['croix','traitH']], zob:['interdit','particule',['croix','barre']],
 ok:['impératif','conjugateur',['fleche','traitV']], tova:['là-bas','racine',['fleche','point']]
};
let n=0;
for(const k in B){ if(G[k]) continue; const [fr,type,pref]=B[k]; const a=unique(pref); used.add(sigA(a)); G[k]={fr,type,atomes:a}; n++; }
fs.writeFileSync(p, JSON.stringify(d,null,2));
console.log('ajoutés '+n+', total '+Object.keys(G).length);
