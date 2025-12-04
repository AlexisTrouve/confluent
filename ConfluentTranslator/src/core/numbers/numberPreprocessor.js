/**
 * Number Preprocessor for Confluent Translator
 * Détecte les nombres dans le texte français et les convertit en base 12 avec vocabulaire Confluent
 */

// Mapping des nombres en lettres françaises
const NOMBRES_FRANCAIS = {
  // 0-20
  'zéro': 0, 'zero': 0,
  'un': 1, 'une': 1,
  'deux': 2,
  'trois': 3,
  'quatre': 4,
  'cinq': 5,
  'six': 6,
  'sept': 7,
  'huit': 8,
  'neuf': 9,
  'dix': 10,
  'onze': 11,
  'douze': 12,
  'treize': 13,
  'quatorze': 14,
  'quinze': 15,
  'seize': 16,
  'dix-sept': 17, 'dixsept': 17,
  'dix-huit': 18, 'dixhuit': 18,
  'dix-neuf': 19, 'dixneuf': 19,
  'vingt': 20,

  // 30-90
  'trente': 30,
  'quarante': 40,
  'cinquante': 50,
  'soixante': 60,
  'soixante-dix': 70, 'soixantedix': 70,
  'quatre-vingt': 80, 'quatrevingt': 80, 'quatre-vingts': 80, 'quatrevingts': 80,
  'quatre-vingt-dix': 90, 'quatrevingdix': 90,

  // Centaines
  'cent': 100,
  'cents': 100,
  'deux-cent': 200, 'deuxcent': 200,
  'trois-cent': 300, 'troiscent': 300,

  // Milliers (rarement utilisés dans contexte ancien)
  'mille': 1000,
  'mil': 1000
};

// Vocabulaire Confluent pour les chiffres de base
const BASE12_VOCAB = {
  0: 'zaro',
  1: 'iko',
  2: 'diku',
  3: 'tiru',
  4: 'katu',
  5: 'penu',
  6: 'seku',
  7: 'sivu',
  8: 'oktu',
  9: 'novu',
  10: 'deku',
  11: 'levu',
  12: 'tolu'
};

// Puissances de 12
const PUISSANCES_12 = {
  12: { confluent: 'tolu', nom: 'douzaine' },
  144: { confluent: 'tolusa', nom: 'grosse' },
  1728: { confluent: 'toluaa', nom: 'grande grosse' },
  20736: { confluent: 'tolumako', nom: 'vaste douzaine' }
};

/**
 * Convertit un nombre base 10 en base 12
 */
function toBase12(num) {
  if (num === 0) return '0';

  let result = '';
  let n = Math.abs(num);

  while (n > 0) {
    const remainder = n % 12;
    const digit = remainder < 10 ? remainder.toString() : String.fromCharCode(65 + remainder - 10); // A=10, B=11
    result = digit + result;
    n = Math.floor(n / 12);
  }

  return result;
}

/**
 * Convertit un nombre base 10 en vocabulaire Confluent
 */
function toConfluentNumber(num) {
  // Cas spéciaux: puissances de 12 exactes
  if (PUISSANCES_12[num]) {
    return {
      confluent: PUISSANCES_12[num].confluent,
      explication: `${num} = ${PUISSANCES_12[num].nom}`
    };
  }

  // Si c'est un chiffre de base (0-12)
  if (num >= 0 && num <= 12 && BASE12_VOCAB[num]) {
    return {
      confluent: BASE12_VOCAB[num],
      explication: `${num}`
    };
  }

  // Conversion en base 12 avec construction
  const base12 = toBase12(num);

  // Décomposer en base 12
  const digits = base12.split('').map(d => {
    if (d >= '0' && d <= '9') return parseInt(d);
    if (d === 'A') return 10;
    if (d === 'B') return 11;
    return 0;
  });

  // Construire le nombre en Confluent
  let parts = [];
  let explication = [];

  // Pour chaque position (de gauche à droite)
  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    const position = digits.length - 1 - i; // position de droite à gauche

    if (digit === 0) continue; // Ignorer les zéros

    if (position === 0) {
      // Unités
      parts.push(BASE12_VOCAB[digit]);
      explication.push(`${digit} unités`);
    } else if (position === 1) {
      // Douzaines
      if (digit === 1) {
        parts.push('tolu');
        explication.push('1 douzaine');
      } else {
        parts.push(BASE12_VOCAB[digit] + ' tolu');
        explication.push(`${digit} douzaines`);
      }
    } else if (position === 2) {
      // Grosses (144)
      if (digit === 1) {
        parts.push('tolusa');
        explication.push('1 grosse');
      } else {
        parts.push(BASE12_VOCAB[digit] + ' tolusa');
        explication.push(`${digit} grosses`);
      }
    } else if (position === 3) {
      // Grandes grosses (1728)
      if (digit === 1) {
        parts.push('toluaa');
        explication.push('1 grande grosse');
      } else {
        parts.push(BASE12_VOCAB[digit] + ' toluaa');
        explication.push(`${digit} grandes grosses`);
      }
    }
  }

  return {
    confluent: parts.join(' '),
    explication: `${num} (base 10) = ${base12} (base 12) = ${explication.join(' + ')}`
  };
}

/**
 * Détecte les nombres dans un texte français
 */
function detectNumbers(text) {
  const detected = [];
  const lowerText = text.toLowerCase();

  // 1. Détecter les chiffres arabes (1, 2, 3, 123, etc.)
  const arabicNumbers = text.match(/\b\d+\b/g);
  if (arabicNumbers) {
    arabicNumbers.forEach(numStr => {
      const num = parseInt(numStr, 10);
      detected.push({
        original: numStr,
        value: num,
        type: 'chiffre'
      });
    });
  }

  // 2. Détecter les nombres en lettres
  Object.entries(NOMBRES_FRANCAIS).forEach(([word, value]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(text)) {
      detected.push({
        original: word,
        value: value,
        type: 'lettres'
      });
    }
  });

  // 3. Détecter les compositions complexes (vingt-cinq, trente-deux, etc.)
  const complexPatterns = [
    // 21-29, 31-39, etc.
    /\b(vingt|trente|quarante|cinquante|soixante)[\s-]+(et[\s-]+)?(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf)\b/gi,
    // 70-79
    /\bsoixante[\s-]+(et[\s-]+)?(onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf)\b/gi,
    // 80-99
    /\bquatre[\s-]+vingts?[\s-]+(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf)\b/gi
  ];

  complexPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const value = parseComplexNumber(match);
        if (value !== null) {
          detected.push({
            original: match,
            value: value,
            type: 'composition'
          });
        }
      });
    }
  });

  // Dédupliquer et filtrer les overlaps
  const unique = [];
  const seenValues = new Set();
  const usedPositions = new Set();

  // Trier par longueur (plus long d'abord) et par position dans le texte
  detected.sort((a, b) => {
    const lenDiff = b.original.length - a.original.length;
    if (lenDiff !== 0) return lenDiff;
    return text.indexOf(a.original) - text.indexOf(b.original);
  });

  detected.forEach(item => {
    // Vérifier si ce nombre n'a pas déjà été vu (même valeur)
    if (seenValues.has(item.value)) return;

    // Trouver la position dans le texte
    const pos = text.toLowerCase().indexOf(item.original.toLowerCase());

    // Vérifier s'il n'y a pas de chevauchement avec un nombre déjà accepté
    let overlaps = false;
    for (let i = pos; i < pos + item.original.length; i++) {
      if (usedPositions.has(i)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      seenValues.add(item.value);
      for (let i = pos; i < pos + item.original.length; i++) {
        usedPositions.add(i);
      }
      unique.push(item);
    }
  });

  return unique;
}

/**
 * Parse un nombre complexe français (ex: "vingt-cinq")
 */
function parseComplexNumber(text) {
  const lower = text.toLowerCase().replace(/\s+/g, '-');

  // Patterns connus
  const patterns = {
    // 21-29
    'vingt-et-un': 21, 'vingt-et-une': 21, 'vingt-un': 21,
    'vingt-deux': 22, 'vingt-trois': 23, 'vingt-quatre': 24,
    'vingt-cinq': 25, 'vingt-six': 26, 'vingt-sept': 27,
    'vingt-huit': 28, 'vingt-neuf': 29,

    // 31-39
    'trente-et-un': 31, 'trente-et-une': 31, 'trente-un': 31,
    'trente-deux': 32, 'trente-trois': 33, 'trente-quatre': 34,
    'trente-cinq': 35, 'trente-six': 36, 'trente-sept': 37,
    'trente-huit': 38, 'trente-neuf': 39,

    // 41-49
    'quarante-et-un': 41, 'quarante-un': 41,
    'quarante-deux': 42, 'quarante-trois': 43, 'quarante-quatre': 44,
    'quarante-cinq': 45, 'quarante-six': 46, 'quarante-sept': 47,
    'quarante-huit': 48, 'quarante-neuf': 49,

    // 51-59
    'cinquante-et-un': 51, 'cinquante-un': 51,
    'cinquante-deux': 52, 'cinquante-trois': 53, 'cinquante-quatre': 54,
    'cinquante-cinq': 55, 'cinquante-six': 56, 'cinquante-sept': 57,
    'cinquante-huit': 58, 'cinquante-neuf': 59,

    // 70-79
    'soixante-dix': 70, 'soixante-et-onze': 71, 'soixante-onze': 71,
    'soixante-douze': 72, 'soixante-treize': 73, 'soixante-quatorze': 74,
    'soixante-quinze': 75, 'soixante-seize': 76, 'soixante-dix-sept': 77,
    'soixante-dix-huit': 78, 'soixante-dix-neuf': 79,

    // 80-99
    'quatre-vingts': 80, 'quatre-vingt': 80,
    'quatre-vingt-un': 81, 'quatre-vingt-deux': 82, 'quatre-vingt-trois': 83,
    'quatre-vingt-quatre': 84, 'quatre-vingt-cinq': 85, 'quatre-vingt-six': 86,
    'quatre-vingt-sept': 87, 'quatre-vingt-huit': 88, 'quatre-vingt-neuf': 89,
    'quatre-vingt-dix': 90, 'quatre-vingt-onze': 91, 'quatre-vingt-douze': 92,
    'quatre-vingt-treize': 93, 'quatre-vingt-quatorze': 94, 'quatre-vingt-quinze': 95,
    'quatre-vingt-seize': 96, 'quatre-vingt-dix-sept': 97, 'quatre-vingt-dix-huit': 98,
    'quatre-vingt-dix-neuf': 99
  };

  return patterns[lower] || null;
}

/**
 * Génère la section "NOMBRES DÉTECTÉS" pour le prompt
 */
function generateNumbersPromptSection(text) {
  const detected = detectNumbers(text);

  if (detected.length === 0) {
    return null; // Pas de nombres détectés
  }

  let section = '\n# NOMBRES DÉTECTÉS DANS LE TEXTE\n\n';
  section += 'Les nombres suivants ont été identifiés. Utilise ces traductions EXACTES:\n\n';

  detected.forEach(item => {
    const { confluent, explication } = toConfluentNumber(item.value);
    section += `- "${item.original}" = ${item.value} (base 10) → **${confluent}**\n`;
    section += `  └─ ${explication}\n`;
  });

  section += '\n⚠️ IMPORTANT: Utilise ces traductions exactes pour les nombres.\n';

  return section;
}

/**
 * Fonction principale: préprocesse le texte et retourne les infos sur les nombres
 */
function preprocessNumbers(text) {
  const detected = detectNumbers(text);
  const promptSection = generateNumbersPromptSection(text);

  const conversions = detected.map(item => {
    const { confluent, explication } = toConfluentNumber(item.value);
    return {
      original: item.original,
      value: item.value,
      base12: toBase12(item.value),
      confluent: confluent,
      explication: explication
    };
  });

  return {
    hasNumbers: detected.length > 0,
    count: detected.length,
    conversions: conversions,
    promptSection: promptSection
  };
}

module.exports = {
  preprocessNumbers,
  detectNumbers,
  toConfluentNumber,
  toBase12,
  generateNumbersPromptSection
};
