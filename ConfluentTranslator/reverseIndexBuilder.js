/**
 * Reverse Index Builder - Génère un dictionnaire Confluent → Français
 *
 * Structure générée:
 * {
 *   "Akoazana": { francais: "Faucon Chasseur", type: "nom_propre", ... },
 *   "zanatori": { francais: "chasseur", type: "composition", ... },
 *   "aki": { francais: "faucon", type: "racine_sacree", forme_liee: "ak" },
 *   "va": { francais: "[SUJET]", type: "particule" }
 * }
 */

// Les particules sont maintenant dans le lexique 00-grammaire.json
// Elles seront chargées automatiquement par buildReverseIndex()

/**
 * Construit l'index inversé à partir d'un lexique
 * @param {Object} lexique - Lexique au format {dictionnaire: {...}, meta: {...}}
 * @returns {Object} - Index inversé Confluent → Français avec multiples index
 */
function buildReverseIndex(lexique) {
  const reverseIndex = {
    byWord: {},       // Index par mot complet (existant)
    byFormeLiee: {},  // NOUVEAU : Index par forme_liee (radicaux)
  };

  if (!lexique || !lexique.dictionnaire) {
    return reverseIndex;
  }

  // 2. Parcourir toutes les entrées du lexique
  for (const [motFrancais, entry] of Object.entries(lexique.dictionnaire)) {
    if (!entry.traductions || entry.traductions.length === 0) continue;

    // Traiter chaque traduction
    entry.traductions.forEach(trad => {
      const motConfluent = trad.confluent;

      if (!motConfluent) return;

      // IMPORTANT: En Confluent, pas de distinction majuscule/minuscule
      // Toujours stocker en lowercase
      const motConfluentLower = motConfluent.toLowerCase();

      const entryData = {
        francais: motFrancais,
        type: trad.type || 'inconnu',
        forme_liee: trad.forme_liee || null,
        composition: trad.composition || null,
        racines: trad.racines || [],
        domaine: trad.domaine || null,
        note: trad.note || null
      };

      // Ajouter les synonymes français si présents
      if (entry.synonymes_fr && entry.synonymes_fr.length > 0) {
        entryData.synonymes_fr = [...entry.synonymes_fr];
      }

      // INDEX PAR MOT COMPLET (byWord)
      if (reverseIndex.byWord[motConfluentLower]) {
        // Vérifier si c'est un doublon
        if (reverseIndex.byWord[motConfluentLower].francais !== motFrancais) {
          if (!reverseIndex.byWord[motConfluentLower].synonymes_fr) {
            reverseIndex.byWord[motConfluentLower].synonymes_fr = [reverseIndex.byWord[motConfluentLower].francais];
          }
          if (!reverseIndex.byWord[motConfluentLower].synonymes_fr.includes(motFrancais)) {
            reverseIndex.byWord[motConfluentLower].synonymes_fr.push(motFrancais);
          }
        }
      } else {
        reverseIndex.byWord[motConfluentLower] = entryData;
      }

      // NOUVEAU : INDEX PAR FORME_LIEE (byFormeLiee)
      const formeLiee = trad.forme_liee;
      if (formeLiee) {
        const formeLieeLower = formeLiee.toLowerCase();
        if (!reverseIndex.byFormeLiee[formeLieeLower]) {
          reverseIndex.byFormeLiee[formeLieeLower] = [];
        }
        reverseIndex.byFormeLiee[formeLieeLower].push({
          ...entryData,
          matchType: 'forme_liee'
        });
      }
    });
  }

  return reverseIndex;
}

/**
 * Génère les statistiques de l'index inversé
 * @param {Object} reverseIndex - Index inversé (avec byWord et byFormeLiee)
 * @returns {Object} - Statistiques
 */
function getReverseIndexStats(reverseIndex) {
  const stats = {
    total: 0,
    particules: 0,
    racines_sacrees: 0,
    racines: 0,
    compositions: 0,
    noms_propres: 0,
    verbes: 0,
    autres: 0,
    by_forme_liee: 0  // NOUVEAU : nombre d'entrées indexées par forme_liee
  };

  // Travailler sur byWord pour les stats principales (compatibilité)
  const indexToCount = reverseIndex.byWord || reverseIndex;

  for (const [conf, entry] of Object.entries(indexToCount)) {
    stats.total++;

    const type = entry.type;
    if (type === 'particule' || type === 'marqueur_temps' || type === 'negation' ||
        type === 'quantite' || type === 'interrogation' || type === 'demonstratif') {
      stats.particules++;
    } else if (type === 'racine_sacree') {
      stats.racines_sacrees++;
    } else if (type === 'racine') {
      stats.racines++;
    } else if (type === 'composition') {
      stats.compositions++;
    } else if (type === 'nom_propre') {
      stats.noms_propres++;
    } else if (type.includes('verbe')) {
      stats.verbes++;
    } else {
      stats.autres++;
    }
  }

  // Compter les entrées par forme_liee
  if (reverseIndex.byFormeLiee) {
    stats.by_forme_liee = Object.keys(reverseIndex.byFormeLiee).length;
  }

  return stats;
}

module.exports = {
  buildReverseIndex,
  getReverseIndexStats
};
