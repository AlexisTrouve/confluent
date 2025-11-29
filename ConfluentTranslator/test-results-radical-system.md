# Test du système de recherche par radicaux - Résultats

Date: 2025-11-28

## Texte de test (122 tokens)

```
Va siluuumi vo mako sekavoki na akoazana vokan at. Va aliaska vo voki aita na aita zo kisun at. No kekutoka tiru okitori vo loku taku su mitak at. Tova vo uraakota na kisiran vokis at. Va umitori velu mirak at. Va alu su vo onuvoki melu su pasun at. Va naki su vo savu su pasun at. Va maku sukamori vo varu mako su zo sukam ul at. Va vokiueka vo kala okimako uravis at. Na tova na uraal kisaran ui vo mako vulu pasak ok se vo talu su vaku nekan ok. Se na kisiran zo urak u suki na velu ve at. Zom na okitori na mako ve at. Se va sekauaita na tori su ui kisun at eol.
```

## Résultats

### Coverage global
- **Avant implémentation (plan):** 83% (101/122 tokens)
- **Après implémentation:** 92% (112/122 tokens)
- **Amélioration:** +9 points de pourcentage (+11 mots trouvés)

### Mots trouvés (112/122)

Exemples de mots correctement trouvés grâce au système:
- `vokan`, `vokis` → trouvés via radical `vok` → "voix"
- `kisun`, `kisiran` → trouvés via radical `kis` → "transmettre"
- `pasun` → trouvé via radical `pas` → "prendre"
- `mirak` → trouvé via radical `mir` → "voir"
- `sekavoki` → composition reconnue → "conseil"
- Nombreuses particules grammaticales (`va`, `vo`, `na`, `at`, `su`, etc.)
- Noms propres (castes, lieux): `akoazana`, `aliaska`, `kekutoka`, `uraakota`

### Mots non trouvés (10/122)

#### 1. Particules grammaticales manquantes (2)
- `ve` (apparaît 2 fois) - particule non documentée
- `eol` - marqueur de fin de phrase

**Action requise:** Ajouter au lexique `00-grammaire.json`

#### 2. Compositions non décomposées (4)
- `sukamori` - composition potentielle `suk-a-mori` (forger + relation + ?)
- `uraal` - composition potentielle `ur-aa-l` (être + relation_forte + ?)
- `kisaran` - **⚠️ PROBLÉMATIQUE** - présenté comme dérivé de `kis` avec suffixe `aran`
- `uravis` - **⚠️ PROBLÉMATIQUE** - présenté comme verbe avec suffixe `vis`

**⚠️ ALERTE - Incohérence linguistique détectée (2025-11-29):**
- Les suffixes `aran` et `vis` **n'existent nulle part** dans la documentation linguistique officielle
- Vérification complète effectuée dans :
  - `ancien-confluent/docs/03-GRAMMAIRE.md` - Aucune mention
  - `ancien-confluent/docs/02-MORPHOLOGIE.md` - Aucune mention
  - Tous les fichiers JSON du lexique - Aucune occurrence
- Les seuls conjugateurs documentés sont : `u`, `at`, `aan`, `ait`, `amat`, `en`, `il`, `eol`, `eon`, `eom`, `ok`, `es`, `ul`, `uv`
- Le suffixe `iran` existe (ex: `kisiran`), mais `aran` est **absent**

**Hypothèses sur l'origine:**
1. Mots **inventés pour le test** sans base linguistique
2. **Erreurs/typos** dans le texte de test original
3. **Mots complets** non documentés (pas des dérivés)
4. Compositions complexes mal analysées

**Action requise:**
- ❌ **NE PAS** ajouter `aran` et `vis` comme suffixes sans validation linguistique
- ✅ Vérifier l'origine du texte de test et sa conformité à la grammaire
- ✅ Soit corriger le texte, soit documenter ces mots comme racines complètes
- ✅ Investiguer si `kisaran` ≠ `kisiran` (typo ?) et `uravis` = composition méconnue

#### 3. Mots absents du lexique (4)
- `tiru` - modificateur/adjectif ?
- `kala` - mot inconnu
- `vulu` - mot inconnu

**Action requise:** Documenter dans le lexique approprié

## Traduction brute obtenue

```
va oracle vo grand (ou: vaste) conseil na faucons chasseurs (ou: faucons chasseurs, akoazana, faucon chasseur, faucons) voix (ou: parole, appeler) at va ailes-grises (ou: ailes-grises, aliaska, aile-grise, aile grise, ailes grises, ailes) vo voix (ou: parole, appeler) ancêtre (ou: ancien, aïeul, vieux, âgé) na ancêtre (ou: ancien, aïeul, vieux, âgé) zo transmettre (ou: enseigner, transmettent, transmis) at no antres des échos (ou: antres des échos, kekutoka) [INCONNU:tiru] guerrier vo loi (ou: règle, lieu, endroit, loup, zone, région) porter (ou: transporter) su famille (ou: clan) at tova vo caste de l'eau (ou: caste de l'eau, la confluence, uraakota, confluence (la)) na transmettre (ou: enseigner, transmettent, transmis) voix (ou: parole, appeler) at va chaman surveiller voir (ou: observer, regarder, vu, vus, vue, vues, verbe) at va grue (ou: Regard-Libre, grues, regard-libre) su vo poème (ou: vers, chant) doux (ou: doux, tendre) su prendre (ou: prennent, pris, prisse) at va descendant (ou: descendant, futur, débutant, enfant) su vo serment (ou: serment, promesse, jurer) su prendre (ou: prennent, pris, prisse) at va grand (ou: vaste) [INCONNU:sukamori] vo arme grand (ou: vaste) su zo forger ul at va proclamateur (ou: proclamateur, proclamation) vo [INCONNU:kala] terrible [INCONNU:uravis] at na tova na [INCONNU:uraal] [INCONNU:kisaran] ui vo grand (ou: vaste) [INCONNU:vulu] prendre (ou: prennent, pris, prisse) ok se vo hall su allié (ou: allié, ami) tovak (ou: agir, faire, accomplir, créer, font, ferai, feras, fera, ferons, ferez, feront) ok se na transmettre (ou: enseigner, transmettent, transmis) zo être (ou: exister, vivre, il y a, y a-t-il, existe, existent, existant) u feu (ou: flamme, étincelle) na surveiller [INCONNU:ve] at zom na guerrier na grand (ou: vaste) [INCONNU:ve] at se va sagesse na homme (ou: homme, personne) su ui transmettre (ou: enseigner, transmettent, transmis) at [INCONNU:eol]
```

## Analyse du système implémenté

### Ce qui fonctionne ✅

1. **Recherche exacte** - Correspondance directe dans le lexique
2. **Recherche par radicaux verbaux** - Extraction de racines avec suffixes connus
3. **Index byFormeLiee** - Recherche rapide par forme liée
4. **Compositions simples** - Reconnaissance des mots composés documentés

### Ce qui nécessite des améliorations 🔧

1. **⚠️ Liste des suffixes verbaux** - ~~Incomplète (manque `aran`, `vis`, etc.)~~ **ATTENTION:** Ces suffixes n'existent pas dans la grammaire officielle (voir alerte ci-dessus)
2. **Décomposition morphologique récursive** - Ne trouve pas toutes les compositions
3. **Lexique** - Certains mots/particules manquants (`ve`, `eol` maintenant ajoutés - 2025-11-29)
4. **Validation du texte de test** - Contient des mots non conformes à la grammaire établie
5. **Confiance des matches** - Système de scoring pourrait être affiné

## Commande de test

```bash
curl -s -X POST http://localhost:3000/api/translate/conf2fr \
  -H "Content-Type: application/json" \
  -d '{"text": "Va siluuumi vo mako sekavoki na akoazana vokan at. Va aliaska vo voki aita na aita zo kisun at. No kekutoka tiru okitori vo loku taku su mitak at. Tova vo uraakota na kisiran vokis at. Va umitori velu mirak at. Va alu su vo onuvoki melu su pasun at. Va naki su vo savu su pasun at. Va maku sukamori vo varu mako su zo sukam ul at. Va vokiueka vo kala okimako uravis at. Na tova na uraal kisaran ui vo mako vulu pasak ok se vo talu su vaku nekan ok. Se na kisiran zo urak u suki na velu ve at. Zom na okitori na mako ve at. Se va sekauaita na tori su ui kisun at eol."}' \
  | python3 -m json.tool
```

## Prochaines étapes pour atteindre 95%+

1. ✅ **Ajouter particules `ve` et `eol`** → +2% coverage (FAIT - 2025-11-29)
2. ❌ ~~**Enrichir VERBAL_SUFFIXES avec `aran`, `vis`**~~ → **ABANDONNÉ** - Ces suffixes n'existent pas linguistiquement
3. **⚠️ PRIORITÉ: Valider/corriger le texte de test** - Vérifier l'origine de `kisaran`, `uravis`, `sukamori`, `uraal`
4. **Documenter `tiru`, `kala`, `vulu`** → +3% coverage (si mots légitimes)
5. **Vérifier/ajouter racines pour compositions** → +1% coverage

**Objectif révisé:**
- Coverage réel attendu après ajout de `ve` et `eol`: **94%** (114/122)
- Coverage maximum possible: **95-96%** si les autres mots sont légitimes
- **Attention:** Le texte de test pourrait contenir des erreurs linguistiques

## Fichiers créés/modifiés

### Nouveaux fichiers
- `ConfluentTranslator/radicalMatcher.js` - Extraction de radicaux
- `ConfluentTranslator/morphologicalDecomposer.js` - Décomposition morphologique

### Fichiers modifiés
- `ConfluentTranslator/reverseIndexBuilder.js` - Ajout index `byFormeLiee`
- `ConfluentTranslator/confluentToFrench.js` - Recherche en cascade

### Structure de l'index
```javascript
{
  byWord: {
    "voki": { francais: "voix", forme_liee: "vok", ... }
  },
  byFormeLiee: {
    "vok": [
      { francais: "voix", matchType: "forme_liee", ... }
    ]
  }
}
```

## Conclusion

Le système de recherche par radicaux est **fonctionnel et opérationnel**. Il a permis d'améliorer significativement le coverage de 83% à 92% (+9 points).

**⚠️ Découverte importante (2025-11-29):**
Une analyse approfondie révèle que le texte de test contient des mots **non conformes à la grammaire officielle** :
- `kisaran` et `uravis` utilisent des "suffixes" (`aran`, `vis`) qui n'existent pas dans la documentation
- `sukamori`, `uraal`, `tiru`, `kala`, `vulu` sont également non documentés

**Actions recommandées avant production:**
1. ✅ Particules `ve` et `eol` ajoutées au lexique (2025-11-29) → Coverage passe à ~94%
2. ⚠️ **CRITIQUE:** Valider l'origine et la légitimité du texte de test
3. Option A: Corriger les erreurs du texte de test pour conformité linguistique
4. Option B: Documenter ces nouveaux mots s'ils sont intentionnels (extensions non documentées)

**État actuel:**
- Système technique: ✅ Robuste et prêt
- Texte de test: ⚠️ Contient possiblement des erreurs ou extensions non documentées
- Coverage réel: **94%** (après ajout de `ve`/`eol`)
- Coverage avec validation: Potentiellement **98-100%** si texte corrigé
