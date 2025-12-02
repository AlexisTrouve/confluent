/**
 * Test simple et rapide du système de nombres
 */

async function test_simple() {
  console.log("🧪 Test simple - Système de nombres Base 12\n");

  const tests = [
    "Trois enfants.",
    "Douze oiseaux.",
    "Trois enfants voient douze oiseaux."
  ];

  for (const phrase of tests) {
    console.log(`\n📝 Phrase: "${phrase}"`);

    try {
      const response = await fetch('http://localhost:3000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase,
          target: 'ancien',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Confluent: ${data.translation}`);
      } else {
        console.log(`❌ Erreur: ${data.error}`);
      }

    } catch (error) {
      console.log(`❌ Erreur de connexion: ${error.message}`);
    }

    // Pause
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n✅ Tests terminés!\n");
}

test_simple().catch(console.error);
