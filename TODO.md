# TODO - Finalisation Langue Confluent

## Priorité 1 - Essentiel pour langage ancien complet

### 1. Système de nombres (limité) ✅ FAIT
- [x] Nombres 0-12 en base 12 (zaro, iko, diku... tolu)
- [x] Puissances de 12 (tolusa=144, toluaa=1728, tolumako=20736)
- [x] Construction positionnelle (ex: 25 = diku tolu iko)
- [x] Concepts vagues : "tiru tiru" (quelques), "tolu tolu" (beaucoup)
- [x] Système de comptage par 12 cycles lunaires
- [x] Ancrage culturel : 12 phalanges, 12 lunes/an
- [x] Lexique complet : `ancien-confluent/lexique/22-nombres.json`
- [x] Documentation détaillée : `docs/SYSTEME_NUMERIQUE_BASE12.md`
- [x] Référence rapide : `docs/REFERENCE_RAPIDE_NOMBRES.md`
- [x] Intégré au prompt système `ConfluentTranslator/prompts/ancien-system.txt`

### 2. Adjectifs (système limité) ✅ FAIT
- [x] Définir position syntaxique des adjectifs → **na + ADJ + NOM** (épithète) et **NOM-ii-ADJ** (composition)
- [x] Liste d'adjectifs de base (couleurs, tailles, qualités) → voir docs/06-ADJECTIFS.md
- [x] Règle : double système avec particule **na** et liaison sacrée **-ii-**
- [x] Exemples : "bon regard" = na tosa sili (phrase) / siliitosa (concept figé)

### 3. Vocabulaire émotionnel (basique)
- [ ] 5-10 émotions de base exprimées par métaphores corporelles
  - Joie = kori + sora (cœur-soleil)
  - Tristesse = kori + taku (cœur-sombre)
  - Peur = sili + taku (regard-obscur)
  - Colère = kina + suki (sang-feu)
  - Amour = kori + ura (cœur-eau/fluide)
- [ ] Documenter dans lexique

## Priorité 2 - Bonus (optionnel)

### 4. Propositions relatives (BONUS)
- [ ] Stratégie 1 : Juxtaposition (phrases séparées)
- [ ] Stratégie 2 : Particule relative simple ?
- [ ] Exemples et cas d'usage
- [ ] Documenter que c'est optionnel pour authenticité

## Documentation

- [x] Mettre à jour docs avec système des adjectifs (03-GRAMMAIRE.md, 06-ADJECTIFS.md)
- [ ] Mettre à jour CLAUDE.md avec nouveaux systèmes
- [ ] Mettre à jour lexique.json avec nouveaux mots
- [ ] Créer exemples d'utilisation pour chaque système
- [ ] Tester cohérence avec formules rituelles existantes

## Validation finale

- [ ] Vérifier ratio racines sacrées/standards (~20%)
- [ ] Tester sonorité (éviter trop de liquides)
- [ ] Créer 5-10 phrases d'exemple utilisant tous les systèmes
- [ ] Valider avec contexte culturel (observation, transmission, mémoire)

---

**Note :** Ce sont les derniers éléments pour avoir un langage ancien authentique et complet pour le JDR. Pas besoin d'aller au-delà - les "manques" renforcent l'authenticité historique.
