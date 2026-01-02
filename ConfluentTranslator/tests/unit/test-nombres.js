/**
 * Script de test pour le système de nombres en base 12
 * Tests de traduction avec l'API ConfluentTranslator
 */

const phrases_test = [
  // Tests de base (nombres simples)
  {
    nom: "Nombre simple - 3",
    francais: "Trois enfants voient l'eau.",
    attendu: "tiru naki",
    attendu_nombre: "tiru"
  },
  {
    nom: "Nombre simple - 12",
    francais: "Douze oiseaux volent.",
    attendu: "tolu",
    attendu_nombre: "tolu"
  },
  {
    nom: "Nombre composé - 13",
    francais: "Treize personnes marchent.",
    attendu: "tolu iko",
    attendu_nombre: "tolu iko"
  },
  {
    nom: "Nombre composé - 25",
    francais: "Vingt-cinq guerriers chassent.",
    attendu: "diku tolu iko",
    attendu_nombre: "25 = 2×12+1"
  },
  {
    nom: "Grosse - 144",
    francais: "Une grosse de poissons.",
    attendu: "tolusa pesa",
    attendu_nombre: "tolusa"
  },
  {
    nom: "Phrase complète avec nombres",
    francais: "Trois enfants voient douze oiseaux dans le ciel.",
    attendu: "va tiru naki vo tolu apo",
    attendu_structure: "SOV avec nombres"
  },

  // Tests de quantificateurs vagues
  {
    nom: "Quantificateur - quelques",
    francais: "Quelques ancêtres.",
    attendu: "tiru tiru aita",
    attendu_concept: "répétition = vague"
  },
  {
    nom: "Quantificateur - beaucoup",
    francais: "Beaucoup d'eau.",
    attendu: "tolu tolu ura",
    attendu_concept: "douze-douze = beaucoup"
  },

  // Tests d'opérations
  {
    nom: "Addition",
    francais: "Trois et deux font cinq.",
    attendu: "samuk",
    attendu_verbe: "assembler/additionner"
  },
  {
    nom: "Division",
    francais: "Diviser douze en trois.",
    attendu: "kisun",
    attendu_verbe: "partager/diviser"
  },

  // Tests culturels
  {
    nom: "Expression idiomatique - comprendre",
    francais: "Je comprends complètement.",
    attendu: "Tolu miraku",
    attendu_idiome: "je vois douze"
  },
  {
    nom: "Calendrier - sixième lune",
    francais: "Nous sommes à la sixième lune.",
    attendu: "seku luna",
    attendu_nombre: "seku = 6"
  }
];

console.log("═══════════════════════════════════════════════════");
console.log("   TEST DU SYSTÈME DE NOMBRES - BASE 12");
console.log("═══════════════════════════════════════════════════\n");

async function tester_traduction(test) {
  console.log(`\n▶ Test: ${test.nom}`);
  console.log(`  Français: "${test.francais}"`);

  try {
    const response = await fetch('http://localhost:3000/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: test.francais,
        targetLang: 'ancien',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`  ✅ Confluent: ${data.translation}`);

      // Vérification si le résultat attendu est présent
      if (test.attendu && data.translation.toLowerCase().includes(test.attendu.toLowerCase())) {
        console.log(`  ✓ Contient bien: "${test.attendu}"`);
      } else if (test.attendu) {
        console.log(`  ⚠️  Devrait contenir: "${test.attendu}"`);
      }

      // Afficher les notes attendues
      if (test.attendu_nombre) {
        console.log(`  📝 Note: ${test.attendu_nombre}`);
      }
      if (test.attendu_concept) {
        console.log(`  💡 Concept: ${test.attendu_concept}`);
      }
      if (test.attendu_verbe) {
        console.log(`  🔧 Verbe: ${test.attendu_verbe}`);
      }
      if (test.attendu_idiome) {
        console.log(`  🌟 Idiome: ${test.attendu_idiome}`);
      }

    } else {
      console.log(`  ❌ Erreur: ${data.error}`);
    }

  } catch (error) {
    console.log(`  ❌ Erreur de connexion: ${error.message}`);
  }
}

async function executer_tous_les_tests() {
  console.log("Début des tests...\n");

  for (let i = 0; i < phrases_test.length; i++) {
    await tester_traduction(phrases_test[i]);

    // Pause entre les requêtes pour ne pas surcharger l'API
    if (i < phrases_test.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log("   FIN DES TESTS");
  console.log("═══════════════════════════════════════════════════\n");
}

// Exécuter les tests
executer_tous_les_tests().catch(console.error);
