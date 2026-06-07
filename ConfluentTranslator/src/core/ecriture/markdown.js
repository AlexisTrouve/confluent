'use strict';
/**
 * Parser markdown léger pour la mise en page « livre » des Glyphes du Gouffre.
 *
 * QUOI : texte markdown → liste de BLOCS {type, runs}. type ∈ h1|h2|h3|p|li|quote|hr.
 *   Chaque bloc textuel porte des RUNS : mots avec emphase {word, bold, italic}.
 * POURQUOI : les marqueurs markdown (#, -, >, *, _) sont META (structure/emphase), JAMAIS
 *   envoyés au convertisseur de glyphes — ils pilotent la mise en page, pas le sens.
 * COMMENT : balayage ligne par ligne (blocs) ; au sein d'un bloc, tokenizeEmphasis() traite
 *   **gras** / *italique* comme des bascules (les glyphes n'ont pas de graisse → l'emphase sera
 *   rendue par la taille/inclinaison côté renderer).
 */

// Tokenise un texte en mots porteurs d'emphase. Les marqueurs ** __ * _ sont des bascules d'état.
// (Le Confluent romanisé n'utilise que des lettres → *, _ n'apparaissent jamais dans un mot.)
function tokenizeEmphasis(text) {
  const out = [];
  let bold = false, italic = false;
  const re = /(\*\*|__|\*|_|\s+|[^\s*_]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const t = m[0];
    if (t === '**' || t === '__') bold = !bold;
    else if (t === '*' || t === '_') italic = !italic;
    else if (/^\s+$/.test(t)) continue;       // séparateur d'espaces : ignoré (re-séparé au rendu)
    else out.push({ word: t, bold, italic });  // un vrai mot, avec l'état d'emphase courant
  }
  return out;
}

// Parse un texte markdown en blocs. Les lignes normales consécutives forment un paragraphe.
function parseMarkdown(text) {
  const blocks = [];
  let para = [];
  // Vide le paragraphe courant en bloc 'p' (lignes jointes par une espace).
  const flush = () => { if (para.length) { blocks.push({ type: 'p', runs: tokenizeEmphasis(para.join(' ')) }); para = []; } };

  for (const raw of String(text).split('\n')) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if (/^\s*$/.test(line)) { flush(); }                                   // ligne vide → fin de paragraphe
    else if (/^\s*-{3,}\s*$/.test(line)) { flush(); blocks.push({ type: 'hr' }); }            // --- → filet
    else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flush(); blocks.push({ type: 'h' + m[1].length, runs: tokenizeEmphasis(m[2]) }); } // titre
    else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flush(); blocks.push({ type: 'li', runs: tokenizeEmphasis(m[1]) }); }               // - liste
    else if ((m = line.match(/^\s*>\s?(.*)$/))) { flush(); blocks.push({ type: 'quote', runs: tokenizeEmphasis(m[1]) }); }               // > citation
    else { para.push(line.trim()); }                                       // texte normal → paragraphe
  }
  flush();
  return blocks;
}

module.exports = { parseMarkdown, tokenizeEmphasis };
