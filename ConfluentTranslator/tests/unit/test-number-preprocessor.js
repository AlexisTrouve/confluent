/**
 * Test du Number Preprocessor
 */

const { preprocessNumbers, detectNumbers, toConfluentNumber, toBase12 } = require('./numberPreprocessor');

console.log("═══════════════════════════════════════════════════");
console.log("   TEST DU NUMBER PREPROCESSOR");
console.log("═══════════════════════════════════════════════════\n");

// Test 1: Conversion base 10 → base 12
console.log("📊 Test 1: Conversion Base 10 → Base 12\n");

const testConversions = [3, 12, 13, 25, 37, 144, 156];
testConversions.forEach(num => {
  const base12 = toBase12(num);
  console.log(`  ${num} (base 10) = ${base12} (base 12)`);
});

console.log("\n─────────────────────────────────────────────────\n");

// Test 2: Conversion en vocabulaire Confluent
console.log("🔤 Test 2: Nombres → Vocabulaire Confluent\n");

testConversions.forEach(num => {
  const result = toConfluentNumber(num);
  console.log(`  ${num}: ${result.confluent}`);
  console.log(`     └─ ${result.explication}`);
});

console.log("\n─────────────────────────────────────────────────\n");

// Test 3: Détection de nombres dans du texte
console.log("🔍 Test 3: Détection de Nombres dans le Texte\n");

const testTexts = [
  "Trois enfants voient l'eau.",
  "Douze oiseaux volent dans le ciel.",
  "Vingt-cinq guerriers chassent.",
  "J'ai 144 poissons dans mon filet.",
  "Les 3 ancêtres et les 12 clans.",
  "Trente-sept personnes marchent vers la montagne.",
  "Quatre-vingt-dix-neuf étoiles brillent."
];

testTexts.forEach((text, i) => {
  console.log(`\n${i + 1}. "${text}"`);
  const detected = detectNumbers(text);

  if (detected.length > 0) {
    console.log(`   Nombres détectés: ${detected.length}`);
    detected.forEach(item => {
      const { confluent } = toConfluentNumber(item.value);
      console.log(`   - "${item.original}" (${item.type}) = ${item.value} → ${confluent}`);
    });
  } else {
    console.log(`   Aucun nombre détecté.`);
  }
});

console.log("\n─────────────────────────────────────────────────\n");

// Test 4: Génération complète de preprocessing
console.log("🎯 Test 4: Preprocessing Complet\n");

const complexText = "Trois enfants voient douze oiseaux et vingt-cinq guerriers.";
console.log(`Texte: "${complexText}"\n`);

const result = preprocessNumbers(complexText);

console.log(`Nombres détectés: ${result.count}`);
console.log(`\nConversions:`);
result.conversions.forEach(conv => {
  console.log(`  - "${conv.original}"`);
  console.log(`    ${conv.value} (base 10) = ${conv.base12} (base 12)`);
  console.log(`    → Confluent: ${conv.confluent}`);
  console.log(`    → ${conv.explication}`);
});

if (result.promptSection) {
  console.log("\n📝 Section générée pour le prompt:");
  console.log(result.promptSection);
}

console.log("\n─────────────────────────────────────────────────\n");

// Test 5: Nombres complexes français
console.log("🇫🇷 Test 5: Nombres Complexes en Français\n");

const complexNumbers = [
  "vingt et un",
  "trente-deux",
  "quarante-cinq",
  "cinquante-six",
  "soixante-dix",
  "soixante-quinze",
  "quatre-vingt",
  "quatre-vingt-dix-neuf"
];

complexNumbers.forEach(num => {
  const text = `Il y a ${num} personnes.`;
  const detected = detectNumbers(text);
  if (detected.length > 0) {
    const { confluent, explication } = toConfluentNumber(detected[0].value);
    console.log(`  "${num}" = ${detected[0].value} → ${confluent}`);
    console.log(`     └─ ${explication}`);
  }
});

console.log("\n═══════════════════════════════════════════════════");
console.log("   ✅ TESTS TERMINÉS");
console.log("═══════════════════════════════════════════════════\n");
