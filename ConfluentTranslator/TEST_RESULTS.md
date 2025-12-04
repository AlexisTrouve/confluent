# Tests des Endpoints - ConfluentTranslator API

**Date:** 2025-12-04
**Statut:** ✅ TOUS LES ENDPOINTS FONCTIONNELS

---

## Résumé

- ✅ **Serveur:** Running (PM2)
- ✅ **Lexique:** Chargé (1835 entrées ancien, 164 proto)
- ✅ **API Keys:** Fonctionnelles
- ✅ **LLM:** Anthropic + OpenAI opérationnels

---

## Endpoints Publics

### GET /api/health
```bash
curl http://localhost:3000/api/health
```
**Résultat:** ✅ `{"status":"ok"}`

---

## Endpoints Authentifiés

**Clé API Admin:** `d9be0765-c454-47e9-883c-bcd93dd19eae`

### GET /api/validate
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  http://localhost:3000/api/validate
```
**Résultat:** ✅ `{"valid":true,"user":"Admin","role":"admin"}`

### GET /api/stats
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  http://localhost:3000/api/stats
```
**Résultat:** ✅ 904 mots Confluent, 1835 mots FR, 670 racines

### GET /api/search
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  "http://localhost:3000/api/search?q=enfant&variant=ancien&direction=fr2conf"
```
**Résultat:** ✅ Trouvé "naki" + variantes (Nakukeko, Nakuura...)

### POST /translate (Anthropic)
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"text":"Les enfants observent la Confluence","target":"ancien","provider":"anthropic","model":"claude-sonnet-4-20250514"}' \
  http://localhost:3000/translate
```
**Résultat:** ✅ `va naki su vo uraakota milak u`
**Tokens économisés:** 23,990 tokens

### POST /translate (OpenAI)
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"text":"bonjour","target":"ancien","provider":"openai","model":"gpt-4o-mini"}' \
  http://localhost:3000/translate
```
**Résultat:** ✅ Traduction générée

### POST /api/translate/batch
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"words":["enfant","eau","regard"],"target":"ancien"}' \
  http://localhost:3000/api/translate/batch
```
**Résultat:** ✅ `{"enfant":"naki","eau":"ura","regard":"spima"}`

### POST /api/translate/conf2fr
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"text":"nakuura","variant":"ancien"}' \
  http://localhost:3000/api/translate/conf2fr
```
**Résultat:** ✅ `"enfants du courant"` (100% coverage)

### POST /api/debug/prompt
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"text":"Les enfants observent","target":"ancien"}' \
  http://localhost:3000/api/debug/prompt
```
**Résultat:** ✅ Prompt système complet généré

### POST /api/analyze/coverage
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"text":"Les enfants observent","target":"ancien"}' \
  http://localhost:3000/api/analyze/coverage
```
**Résultat:** ✅ `{"coverage":100,"found":2,"missing":0}`

### GET /api/llm/limit
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  http://localhost:3000/api/llm/limit
```
**Résultat:** ✅ `{"allowed":true,"remaining":-1,"limit":-1,"used":2}` (Admin = illimité)

---

## Endpoints Admin

### GET /api/admin/tokens
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  http://localhost:3000/api/admin/tokens
```
**Résultat:** ✅ Liste de 3 tokens (Admin, TestUser, AutoTest)

### POST /api/admin/tokens
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  -d '{"name":"NewUser","role":"user"}' \
  http://localhost:3000/api/admin/tokens
```
**Résultat:** ✅ Nouveau token créé avec API key complète retournée

### GET /api/admin/stats
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  http://localhost:3000/api/admin/stats
```
**Résultat:** ✅ Stats globales (tokens, logs, requêtes, erreurs)

### GET /api/admin/logs
```bash
curl -H "X-API-Key: d9be0765-c454-47e9-883c-bcd93dd19eae" \
  "http://localhost:3000/api/admin/logs?limit=5"
```
**Résultat:** ✅ 5 derniers logs avec détails

---

## Corrections Appliquées

### Chemins relatifs corrigés :
1. ✅ `radicalMatcher.js:5` → `../../../../data/lexique.json`
2. ✅ `morphologicalDecomposer.js:5` → `../../../../data/lexique.json`
3. ✅ `promptBuilder.js:21` → `../../../prompts/`
4. ✅ `auth.js:7,15` → `../../data/`
5. ✅ `server.js:792` → `../../prompts/cf2fr-refinement.txt`

### Configuration PM2 :
- ✅ Créé `ecosystem.config.js`
- ✅ PM2 redémarré avec `--update-env`
- ✅ Variables d'environnement chargées depuis `.env`
- ✅ PM2 sauvegardé avec `pm2 save`

---

## Performance

- **Lexique:** 1835 entrées Ancien-Confluent, 164 Proto-Confluent
- **Économie de tokens:** ~24,000 tokens par traduction (87% d'économie)
- **Temps de réponse:** ~2s pour traduction LLM
- **Mémoire:** ~87 MB

---

## Clés API Disponibles

### Admin (illimité)
```
d9be0765-c454-47e9-883c-bcd93dd19eae
```

### TestUser (20 req/jour)
```
008d38c2-e6ed-4852-9b8b-a433e197719a
```

### AutoTest (20 req/jour)
```
343c01ae-8e9c-45b4-a04e-98c67d98d889
```

---

## Notes Techniques

- **Providers LLM:** Anthropic (Claude) + OpenAI (GPT)
- **Modèles testés:** `claude-sonnet-4-20250514`, `gpt-4o-mini`
- **Rate limiting:** Admin = illimité, User = 20 req/jour
- **Logging:** Tous les endpoints loggés avec détails
- **Auth:** Basée sur API keys (header `X-API-Key`)

---

**Statut Final:** 🎉 TOUS LES ENDPOINTS FONCTIONNENT PARFAITEMENT
