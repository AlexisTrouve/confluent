/**
 * Convertisseur de nombres français → Confluent (base 12)
 *
 * Système basé sur la documentation SYSTEME_NUMERIQUE_BASE12.md
 */

// Table de conversion pour les nombres de base (0-12)
const BASE_NUMBERS = {
  // Mots français
  'zero': { confluent: 'zaro', value: 0 },
  'zéro': { confluent: 'zaro', value: 0 },
  'un': { confluent: 'iko', value: 1 },
  'une': { confluent: 'iko', value: 1 },
  'deux': { confluent: 'diku', value: 2 },
  'trois': { confluent: 'tiru', value: 3 },
  'quatre': { confluent: 'katu', value: 4 },
  'cinq': { confluent: 'penu', value: 5 },
  'six': { confluent: 'seku', value: 6 },
  'sept': { confluent: 'sivu', value: 7 },
  'huit': { confluent: 'oktu', value: 8 },
  'neuf': { confluent: 'novu', value: 9 },
  'dix': { confluent: 'deku', value: 10 },
  'onze': { confluent: 'levu', value: 11 },
  'douze': { confluent: 'tolu', value: 12 },

  // Nombres composés courants
  'treize': { confluent: 'tolu iko', value: 13 },
  'quatorze': { confluent: 'tolu diku', value: 14 },
  'quinze': { confluent: 'tolu tiru', value: 15 },
  'seize': { confluent: 'tolu katu', value: 16 },

  // Dizaines
  'vingt': { confluent: 'tolu oktu', value: 20 },
  'trente': { confluent: 'diku tolu seku', value: 30 },
  'quarante': { confluent: 'tiru tolu katu', value: 40 },
  'cinquante': { confluent: 'katu tolu diku', value: 50 },
  'soixante': { confluent: 'penu tolu', value: 60 },

  // Centaines
  'cent': { confluent: 'oktu tolu katu', value: 100 },
  'mille': { confluent: 'seku seku tolu oktu', value: 1000 },

  // Ordinaux
  'premier': { confluent: 'ena', value: 1 },
  'première': { confluent: 'ena', value: 1 },
  'deuxième': { confluent: 'dikuena', value: 2 },
  'second': { confluent: 'dikuena', value: 2 },
  'seconde': { confluent: 'dikuena', value: 2 },
  'troisième': { confluent: 'tiruena', value: 3 },
  'dernier': { confluent: 'osiana', value: -1 },
  'dernière': { confluent: 'osiana', value: -1 }
};

/**
 * Convertit un nombre en français vers Confluent
 * @param {string} frenchNumber - Nombre en français (normalisé, minuscules)
 * @returns {object|null} - { confluent: string, value: number, type: 'nombre'|'ordinal' } ou null
 */
function convertFrenchNumber(frenchNumber) {
  const normalized = frenchNumber.toLowerCase().trim();

  if (BASE_NUMBERS[normalized]) {
    const { confluent, value } = BASE_NUMBERS[normalized];
    const type = ['premier', 'première', 'deuxième', 'second', 'seconde', 'troisième', 'dernier', 'dernière'].includes(normalized)
      ? 'ordinal'
      : 'nombre';

    return {
      confluent,
      value,
      type,
      score: 1.0
    };
  }

  return null;
}

/**
 * Détecte si un mot français est un nombre
 * @param {string} word - Mot en français
 * @returns {boolean}
 */
function isNumber(word) {
  const normalized = word.toLowerCase().trim();
  return BASE_NUMBERS.hasOwnProperty(normalized);
}

/**
 * Convertit une liste de mots et identifie les nombres
 * @param {string[]} words - Liste de mots français
 * @returns {object[]} - Liste d'objets { word, confluent, isNumber, value }
 */
function convertNumbersInText(words) {
  return words.map(word => {
    const numberConversion = convertFrenchNumber(word);

    if (numberConversion) {
      return {
        word,
        confluent: numberConversion.confluent,
        isNumber: true,
        value: numberConversion.value,
        type: numberConversion.type,
        score: numberConversion.score
      };
    }

    return {
      word,
      isNumber: false
    };
  });
}

module.exports = {
  convertFrenchNumber,
  isNumber,
  convertNumbersInText,
  BASE_NUMBERS
};
