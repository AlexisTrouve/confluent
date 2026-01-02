/**
 * Test de génération du prompt système
 * Vérifie que le système de nombres est bien intégré
 */

async function test_prompt() {
  console.log("🧪 Test de génération du prompt - Système de nombres\n");

  const phrase = "Trois enfants voient douze oiseaux.";

  console.log(`📝 Phrase de test: "${phrase}"\n`);

  try {
    const response = await fetch('http://localhost:3000/api/debug/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: phrase,
        target: 'ancien',
        useLexique: true
      })
    });

    const data = await response.json();

    if (data.systemPrompt) {
      console.log("✅ Prompt système généré!\n");

      // Vérifier si le système de nombres est présent
      const prompt = data.systemPrompt;

      console.log("📋 Vérifications:");

      if (prompt.includes("SYSTÈME DE NOMBRES")) {
        console.log("  ✅ Section 'SYSTÈME DE NOMBRES' présente");
      } else {
        console.log("  ❌ Section 'SYSTÈME DE NOMBRES' MANQUANTE");
      }

      if (prompt.includes("BASE 12")) {
        console.log("  ✅ Mention de 'BASE 12'");
      } else {
        console.log("  ❌ 'BASE 12' non mentionnée");
      }

      if (prompt.includes("tiru")) {
        console.log("  ✅ Nombre 'tiru' (3) trouvé");
      } else {
        console.log("  ❌ Nombre 'tiru' non trouvé");
      }

      if (prompt.includes("tolu")) {
        console.log("  ✅ Nombre 'tolu' (12) trouvé");
      } else {
        console.log("  ❌ Nombre 'tolu' non trouvé");
      }

      if (prompt.includes("tolusa")) {
        console.log("  ✅ Puissance 'tolusa' (144) trouvée");
      } else {
        console.log("  ⚠️  Puissance 'tolusa' non trouvée (optionnel)");
      }

      // Vérifier si le lexique contextuel contient des nombres
      if (data.contextMetadata) {
        console.log("\n📊 Métadonnées contextuelles:");
        console.log(`  Racines détectées: ${data.contextMetadata.racinesCount || 0}`);
        console.log(`  Verbes détectés: ${data.contextMetadata.verbesCount || 0}`);

        if (data.contextMetadata.contextualVocab) {
          const vocab = data.contextMetadata.contextualVocab;
          console.log(`  Vocabulaire contextuel: ${vocab.length} entrées`);

          // Chercher les nombres
          const nombres = vocab.filter(v =>
            v.includes('tiru') ||
            v.includes('tolu') ||
            v.includes('naki') ||
            v.includes('apo')
          );

          if (nombres.length > 0) {
            console.log(`  ✅ Vocabulaire nombres/contexte détecté: ${nombres.length} entrées`);
          }
        }
      }

      // Afficher un extrait de la section nombres
      console.log("\n📄 Extrait de la section nombres du prompt:");
      const nombresSection = prompt.match(/# SYSTÈME DE NOMBRES.*?(?=\n#|\n\n#|$)/s);
      if (nombresSection) {
        const lignes = nombresSection[0].split('\n').slice(0, 15);
        lignes.forEach(ligne => console.log(`  ${ligne}`));
        console.log("  ...");
      }

    } else {
      console.log("❌ Échec de génération du prompt");
      console.log("Erreur:", data.error || "Inconnue");
    }

  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  }

  console.log("\n✅ Test terminé!\n");
}

test_prompt().catch(console.error);
