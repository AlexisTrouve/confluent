/**
 * Test de NON-RÉGRESSION : chargement du lexique ciblé.
 *
 * QUOI : vérifie que loadAllLexiques() charge réellement les dictionnaires FR→Confluent
 *        depuis les vrais dossiers de lexique à la racine du repo.
 *
 * POURQUOI : régression historique — proto-confluent/ et ancien-confluent/ étaient référencés
 *            via des "symlinks" committés comme fichiers texte, et un baseDir mal calculé lisait
 *            un dossier inexistant -> 0 entrée. Ce test verrouille le bon chargement.
 *
 * COMMENT : reproduit le baseDir du serveur (racine du repo), charge les lexiques, et asserte
 *           des seuils minimaux. Échec franc (exit 1) si un lexique se vide.
 */
const assert = require('assert');
const path = require('path');
const { loadAllLexiques } = require('../../src/utils/lexiqueLoader');

const baseDir = path.join(__dirname, '..', '..', '..');
const lex = loadAllLexiques(baseDir);

const ancien = lex.ancien.meta.total_entries;
const proto = lex.proto.meta.total_entries;
const ancienFiles = lex.ancien.meta.files_loaded.length;

assert(ancien > 1000, `Lexique ANCIEN quasi vide (${ancien} entrées) — chargement cassé ?`);
assert(proto > 50, `Lexique PROTO quasi vide (${proto} entrées) — chargement cassé ?`);
assert(ancienFiles >= 25, `Trop peu de fichiers ancien chargés (${ancienFiles}) — dossier introuvable ?`);

console.log(`OK — lexique chargé : ancien=${ancien} entrées (${ancienFiles} fichiers), proto=${proto} entrées`);
