# API ConfluentTranslator

Documentation technique de l'API REST du serveur ConfluentTranslator.

## Architecture

- **Framework** : Express.js
- **LLM** : Anthropic Claude / OpenAI GPT
- **Port** : 3000 (configurable via `PORT`)
- **Base URL** : `http://localhost:3000`
- **Authentification** : API key via header `X-API-Key` ou query param `apiKey`

## Authentification

Toutes les requêtes (sauf `/api/health`) nécessitent une API key valide.

**Header** :
```
X-API-Key: <votre-token-uuid>
```

**Query param** :
```
?apiKey=<votre-token-uuid>
```

**Rôles** :
- `user` : Accès aux endpoints de traduction et consultation
- `admin` : Accès complet incluant gestion des tokens

## Rate Limiting

### Endpoints admin
- **Limite** : 50 requêtes / 5 minutes (par IP)
- **Headers** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Endpoints LLM (traduction)
- **Limite par défaut** : 20 requêtes / jour (par API key)
- **Admin** : Illimité
- **Custom keys** : Pas de limite (utilise vos propres clés LLM)
- **Bypass** : Fournir `customAnthropicKey` ou `customOpenAIKey` dans le body

## Endpoints publics

### GET /api/health

Endpoint de santé du serveur (public, pas d'auth requise).

**Réponse** :
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Exemple** :
```bash
curl http://localhost:3000/api/health
```

---

### GET /api/validate

Valide une API key et retourne les informations utilisateur.

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "valid": true,
  "user": "Admin",
  "role": "admin"
}
```

**Exemple** :
```bash
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/api/validate
```

---

### GET /api/llm/limit

Vérifie la limite LLM pour l'API key courante (toujours retourne 200).

**Headers requis** :
- `X-API-Key: <token>`

**Réponse (autorisé)** :
```json
{
  "allowed": true,
  "remaining": 15,
  "limit": 20,
  "used": 5
}
```

**Réponse (limite atteinte)** :
```json
{
  "allowed": false,
  "error": "Daily LLM request limit reached",
  "limit": 20,
  "used": 20
}
```

**Exemple** :
```bash
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/api/llm/limit
```

---

## Gestion des lexiques

### GET /lexique

Retourne le lexique ancien-confluent (legacy, pour compatibilité).

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** : Objet JSON du lexique complet

**Exemple** :
```bash
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/lexique
```

---

### GET /api/lexique/:variant

Retourne le lexique pour une variante spécifique.

**Paramètres** :
- `variant` (path) : `proto` ou `ancien`

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** : Objet JSON du lexique

**Exemple** :
```bash
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/api/lexique/proto
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/api/lexique/ancien
```

---

### GET /api/stats

Statistiques du lexique (nombre de racines, compositions, etc.).

**Paramètres** :
- `variant` (query, optionnel) : `proto` ou `ancien` (défaut: `ancien`)

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "motsCF": 450,
  "motsFR": 380,
  "totalTraductions": 520,
  "racines": 67,
  "racinesSacrees": 15,
  "racinesStandards": 52,
  "compositions": 120,
  "verbes": 12,
  "verbesIrreguliers": 0,
  "particules": 25,
  "nomsPropes": 8,
  "marqueurs": 15,
  "pronoms": 10,
  "autres": 5
}
```

**Exemple** :
```bash
curl -H "X-API-Key: YOUR_TOKEN" "http://localhost:3000/api/stats?variant=ancien"
```

---

### POST /api/reload

Recharge les lexiques depuis les fichiers JSON (admin seulement).

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "success": true,
  "message": "Lexiques reloaded",
  "stats": {
    "proto": 450,
    "ancien": 520
  }
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: ADMIN_TOKEN" http://localhost:3000/api/reload
```

---

## Recherche et analyse

### GET /api/search

Recherche un mot dans le lexique.

**Paramètres** :
- `q` (query, requis) : Mot à rechercher
- `variant` (query, optionnel) : `proto` ou `ancien` (défaut: `ancien`)
- `direction` (query, optionnel) : `fr2conf` ou `conf2fr` (défaut: `fr2conf`)

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "query": "regard",
  "variant": "ancien",
  "direction": "fr2conf",
  "results": [
    {
      "mot": "regard",
      "traductions": [
        {
          "confluent": "sili",
          "type": "racine",
          "contexte": "observation, vision"
        }
      ]
    }
  ]
}
```

**Exemple** :
```bash
curl -H "X-API-Key: YOUR_TOKEN" "http://localhost:3000/api/search?q=regard&variant=ancien"
curl -H "X-API-Key: YOUR_TOKEN" "http://localhost:3000/api/search?q=sili&direction=conf2fr"
```

---

### POST /api/analyze/coverage

Analyse la couverture lexicale d'un texte français avant traduction.

**Body** :
```json
{
  "text": "Les enfants observent la confluence",
  "target": "ancien"
}
```

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "coverage": 85.5,
  "found": [
    {
      "word": "enfants",
      "confluent": "naku",
      "type": "racine",
      "score": 1.0
    },
    {
      "word": "observer",
      "confluent": "sili",
      "type": "racine",
      "score": 1.0
    }
  ],
  "missing": [
    {
      "word": "la",
      "suggestions": []
    }
  ],
  "stats": {
    "totalWords": 5,
    "uniqueWords": 5,
    "foundCount": 4,
    "missingCount": 1,
    "entriesUsed": 15,
    "useFallback": false
  },
  "needsFullRoots": false,
  "recommendation": "Good coverage - context only",
  "variant": "ancien"
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Les enfants observent","target":"ancien"}' \
  http://localhost:3000/api/analyze/coverage
```

---

## Traduction

### POST /translate

Endpoint principal de traduction FR → Confluent (avec layers 1-3).

**Body** :
```json
{
  "text": "Les enfants observent la confluence",
  "target": "ancien",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "temperature": 1.0,
  "useLexique": true,
  "customAnthropicKey": "optional-sk-ant-...",
  "customOpenAIKey": "optional-sk-..."
}
```

**Paramètres** :
- `text` (requis) : Texte français à traduire
- `target` (requis) : `proto` ou `ancien`
- `provider` (requis) : `anthropic` ou `openai`
- `model` (requis) : Nom du modèle (ex: `claude-sonnet-4-20250514`, `gpt-4o`)
- `temperature` (optionnel) : 0.0-2.0 (défaut: 1.0, divisé par 2 pour Claude)
- `useLexique` (optionnel) : Utiliser le système contextuel (défaut: true)
- `customAnthropicKey` (optionnel) : Clé API Anthropic personnalisée (bypass rate limit)
- `customOpenAIKey` (optionnel) : Clé API OpenAI personnalisée (bypass rate limit)

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "layer1": {
    "translation": "naku ve sili uraakota"
  },
  "layer2": {
    "wordsFound": [
      {
        "input": "enfants",
        "confluent": "naku",
        "type": "racine",
        "score": 1.0
      }
    ],
    "wordsNotFound": ["la"],
    "entriesUsed": 15,
    "totalLexiqueSize": 520,
    "tokensFullLexique": 45000,
    "tokensUsed": 8500,
    "tokensSaved": 36500,
    "savingsPercent": 81.1,
    "useFallback": false,
    "expansionLevel": 2,
    "rootsUsed": 0
  },
  "layer3": {
    "analyse": "Phrase simple avec sujet et verbe...",
    "strategie": "Utilisation des racines connues...",
    "decomposition": "naku (enfants) + ve (marque verbale)...",
    "notes": "SOV respecté...",
    "wordsCreated": []
  },
  "translation": "naku ve sili uraakota"
}
```

**Layers** :
- **Layer 1** : Traduction finale
- **Layer 2** : Métadonnées contextuelles (COT côté serveur)
- **Layer 3** : Explications LLM (COT côté LLM)

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Les enfants observent la confluence",
    "target":"ancien",
    "provider":"anthropic",
    "model":"claude-sonnet-4-20250514",
    "temperature":1.0
  }' \
  http://localhost:3000/translate
```

**Avec clé personnalisée** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Bonjour",
    "target":"ancien",
    "provider":"anthropic",
    "model":"claude-sonnet-4-20250514",
    "customAnthropicKey":"sk-ant-..."
  }' \
  http://localhost:3000/translate
```

---

### POST /api/translate/raw

Traduction brute sans parsing (debug).

**Body** : Identique à `/translate`

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "raw_output": "ANALYSE:\nPhrase simple...\n\nConfluent:\nnaku ve sili",
  "metadata": {
    "wordsFound": [...],
    "entriesUsed": 15,
    "tokensUsed": 8500
  },
  "length": 245,
  "lines": 12
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Test",
    "target":"ancien",
    "provider":"anthropic",
    "model":"claude-sonnet-4-20250514"
  }' \
  http://localhost:3000/api/translate/raw
```

---

### POST /api/translate/batch

Traduction par lot (recherche lexique uniquement, sans LLM).

**Body** :
```json
{
  "words": ["regard", "libre", "enfant"],
  "target": "ancien"
}
```

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "target": "ancien",
  "results": {
    "regard": {
      "found": true,
      "traduction": "sili",
      "all_traductions": [
        {
          "confluent": "sili",
          "type": "racine",
          "contexte": "observation"
        }
      ]
    },
    "libre": {
      "found": true,
      "traduction": "aska",
      "all_traductions": [...]
    },
    "enfant": {
      "found": false
    }
  }
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"words":["regard","libre"],"target":"ancien"}' \
  http://localhost:3000/api/translate/batch
```

---

### POST /api/translate/conf2fr

Traduction Confluent → Français (mot-à-mot ou détaillée).

**Body** :
```json
{
  "text": "naku ve sili uraakota",
  "variant": "ancien",
  "detailed": false
}
```

**Paramètres** :
- `text` (requis) : Texte en Confluent
- `variant` (optionnel) : `proto` ou `ancien` (défaut: `ancien`)
- `detailed` (optionnel) : Inclure détails morphologiques (défaut: false)

**Headers requis** :
- `X-API-Key: <token>`

**Réponse (simple)** :
```json
{
  "translation": "enfants voir confluence",
  "coverage": 100,
  "wordsTranslated": 3,
  "wordsNotTranslated": 0
}
```

**Réponse (detailed=true)** :
```json
{
  "translation": "enfants voir confluence",
  "tokens": [
    {
      "confluent": "naku",
      "french": "enfants",
      "found": true,
      "type": "racine"
    },
    {
      "confluent": "ve",
      "french": "voir",
      "found": true,
      "type": "verbe"
    }
  ],
  "coverage": 100,
  "wordsTranslated": 3,
  "wordsNotTranslated": 0
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"naku ve sili","variant":"ancien","detailed":true}' \
  http://localhost:3000/api/translate/conf2fr
```

---

### POST /api/translate/conf2fr/llm

Traduction Confluent → Français avec raffinement LLM.

**Body** :
```json
{
  "text": "naku ve sili uraakota",
  "variant": "ancien",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "customAnthropicKey": "optional",
  "customOpenAIKey": "optional"
}
```

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "confluentText": "naku ve sili uraakota",
  "rawTranslation": "enfants voir confluence",
  "refinedTranslation": "Les enfants observent la Confluence",
  "translation": "Les enfants observent la Confluence",
  "tokens": [...],
  "coverage": 100,
  "wordsTranslated": 3,
  "wordsNotTranslated": 0,
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514"
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text":"naku ve sili",
    "variant":"ancien",
    "provider":"anthropic",
    "model":"claude-sonnet-4-20250514"
  }' \
  http://localhost:3000/api/translate/conf2fr/llm
```

---

### POST /api/debug/prompt

Génère le prompt système sans appeler le LLM (debug).

**Body** :
```json
{
  "text": "Les enfants observent",
  "target": "ancien",
  "useLexique": true
}
```

**Headers requis** :
- `X-API-Key: <token>`

**Réponse** :
```json
{
  "prompt": "Tu es un traducteur expert...\n\n# CONTEXTE LEXICAL...",
  "metadata": {
    "wordsFound": [...],
    "entriesUsed": 15,
    "tokensUsed": 8500,
    "tokensSaved": 36500
  },
  "stats": {
    "promptLength": 12450,
    "promptLines": 280
  }
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","target":"ancien","useLexique":true}' \
  http://localhost:3000/api/debug/prompt
```

---

## Endpoints admin

Tous les endpoints admin nécessitent un token avec `role: "admin"`.

### POST /api/admin/tokens

Créer un nouveau token d'accès.

**Body** :
```json
{
  "name": "John Doe",
  "role": "user"
}
```

**Paramètres** :
- `name` (requis) : Nom du token
- `role` (optionnel) : `user` ou `admin` (défaut: `user`)

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "success": true,
  "token": {
    "id": "uuid-v4",
    "name": "John Doe",
    "role": "user",
    "apiKey": "uuid-v4-full-key",
    "createdAt": "2025-12-04T10:30:00.000Z",
    "active": true
  }
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","role":"user"}' \
  http://localhost:3000/api/admin/tokens
```

---

### GET /api/admin/tokens

Liste tous les tokens (clés masquées).

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "tokens": [
    {
      "id": "admin",
      "name": "Admin",
      "role": "admin",
      "apiKey": "12345678...",
      "createdAt": "2025-12-01T00:00:00.000Z",
      "active": true,
      "lastUsed": "2025-12-04T10:25:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Alice",
      "role": "user",
      "apiKey": "abcdef12...",
      "createdAt": "2025-12-04T10:30:00.000Z",
      "active": true
    }
  ]
}
```

**Exemple** :
```bash
curl -H "X-API-Key: ADMIN_TOKEN" http://localhost:3000/api/admin/tokens
```

---

### POST /api/admin/tokens/:id/disable

Désactiver un token.

**Paramètres** :
- `id` (path) : ID du token

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "success": true,
  "message": "Token disabled"
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: ADMIN_TOKEN" \
  http://localhost:3000/api/admin/tokens/uuid-123/disable
```

---

### POST /api/admin/tokens/:id/enable

Réactiver un token.

**Paramètres** :
- `id` (path) : ID du token

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "success": true,
  "message": "Token enabled"
}
```

**Exemple** :
```bash
curl -X POST -H "X-API-Key: ADMIN_TOKEN" \
  http://localhost:3000/api/admin/tokens/uuid-123/enable
```

---

### DELETE /api/admin/tokens/:id

Supprimer un token (sauf admin).

**Paramètres** :
- `id` (path) : ID du token

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "success": true,
  "message": "Token deleted"
}
```

**Erreur (tentative de suppression admin)** :
```json
{
  "error": "Token not found or cannot be deleted"
}
```

**Exemple** :
```bash
curl -X DELETE -H "X-API-Key: ADMIN_TOKEN" \
  http://localhost:3000/api/admin/tokens/uuid-123
```

---

### GET /api/admin/stats

Statistiques globales (tokens et logs).

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "tokens": {
    "totalTokens": 5,
    "activeTokens": 4
  },
  "logs": {
    "totalRequests": 1250,
    "successfulRequests": 1180,
    "failedRequests": 70,
    "avgResponseTime": 245
  }
}
```

**Exemple** :
```bash
curl -H "X-API-Key: ADMIN_TOKEN" http://localhost:3000/api/admin/stats
```

---

### GET /api/admin/logs

Récupérer les logs de requêtes.

**Paramètres** :
- `limit` (query, optionnel) : Nombre de logs (défaut: 100)
- `user` (query, optionnel) : Filtrer par nom d'utilisateur
- `path` (query, optionnel) : Filtrer par endpoint
- `statusCode` (query, optionnel) : Filtrer par code HTTP

**Headers requis** :
- `X-API-Key: <token-admin>`

**Réponse** :
```json
{
  "logs": [
    {
      "timestamp": "2025-12-04T10:30:00.000Z",
      "method": "POST",
      "path": "/translate",
      "statusCode": 200,
      "responseTime": 1250,
      "user": "Alice",
      "ip": "127.0.0.1"
    }
  ]
}
```

**Exemple** :
```bash
curl -H "X-API-Key: ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/logs?limit=50&user=Alice"
```

---

## Gestion des erreurs

### Codes HTTP

| Code | Signification | Exemple |
|------|---------------|---------|
| 200 | Succès | Traduction réussie |
| 400 | Requête invalide | Paramètre manquant |
| 401 | Non authentifié | API key manquante ou invalide |
| 403 | Non autorisé | Accès admin requis, token désactivé |
| 404 | Non trouvé | Token inexistant |
| 429 | Trop de requêtes | Rate limit dépassé |
| 500 | Erreur serveur | Erreur LLM, lexique non chargé |

### Format des erreurs

```json
{
  "error": "Message d'erreur descriptif"
}
```

**Erreur rate limit (429)** :
```json
{
  "error": "Daily LLM request limit reached",
  "limit": 20,
  "used": 20
}
```

**Erreur admin (429)** :
```json
{
  "error": "Too many admin requests."
}
```

---

## Rate Limiting - Headers

**Admin endpoints** :
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701686400
```

**LLM endpoints** : Pas de headers, vérifier via `/api/llm/limit`

---

## Modèles supportés

### Anthropic
- `claude-opus-4-20250514` (le plus puissant)
- `claude-sonnet-4-20250514` (recommandé - équilibré)
- `claude-haiku-4-20250514` (rapide et économique)

### OpenAI
- `gpt-4o` (recommandé)
- `gpt-4o-mini` (économique)
- `gpt-4-turbo`

---

## Exemples complets

### Workflow complet de traduction

```bash
# 1. Valider l'API key
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/api/validate

# 2. Analyser la couverture lexicale
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Les enfants observent","target":"ancien"}' \
  http://localhost:3000/api/analyze/coverage

# 3. Vérifier la limite LLM
curl -H "X-API-Key: YOUR_TOKEN" http://localhost:3000/api/llm/limit

# 4. Traduire
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Les enfants observent la confluence",
    "target":"ancien",
    "provider":"anthropic",
    "model":"claude-sonnet-4-20250514"
  }' \
  http://localhost:3000/translate
```

### Traduction avec clé personnalisée (bypass rate limit)

```bash
curl -X POST -H "X-API-Key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Bonjour monde",
    "target":"ancien",
    "provider":"anthropic",
    "model":"claude-sonnet-4-20250514",
    "customAnthropicKey":"sk-ant-api03-YOUR-KEY"
  }' \
  http://localhost:3000/translate
```

### Recherche bidirectionnelle

```bash
# FR → Confluent
curl -H "X-API-Key: YOUR_TOKEN" \
  "http://localhost:3000/api/search?q=regard&direction=fr2conf"

# Confluent → FR
curl -H "X-API-Key: YOUR_TOKEN" \
  "http://localhost:3000/api/search?q=sili&direction=conf2fr"
```

---

## Notes techniques

### Système contextuel (useLexique)

Quand `useLexique: true` (défaut), le serveur :
1. Analyse le texte français
2. Recherche les mots dans le lexique
3. Génère un prompt optimisé avec seulement les entrées pertinentes
4. Économise jusqu'à 81% de tokens

**Expansion levels** :
- `0` : Mots exacts trouvés
- `1` : + Racines des mots trouvés
- `2` : + Liaisons sacrées
- `3` : Fallback (tout le lexique)

### Parsing de réponse LLM

Le serveur parse automatiquement les sections :
- `ANALYSE:` → `layer3.analyse`
- `STRATÉGIE:` → `layer3.strategie`
- `Confluent:` → `layer1.translation`
- `Décomposition:` → `layer3.decomposition`
- `Notes:` → `layer3.notes`

---

## Sécurité

- **Tokens** : UUID v4 stockés dans `data/tokens.json`
- **HTTPS** : Recommandé en production
- **CORS** : À configurer selon besoins
- **JWT_SECRET** : Changer en production (`.env`)
- **Admin token** : Stocké au premier lancement (console)

---

## Dépannage

### "API key required"
→ Ajouter header `X-API-Key` ou query param `?apiKey=...`

### "Token disabled"
→ Réactiver via `/api/admin/tokens/:id/enable`

### "Daily LLM request limit reached"
→ Attendre minuit OU utiliser `customAnthropicKey`/`customOpenAIKey`

### "Lexique not loaded"
→ Vérifier les fichiers JSON dans `data/` OU appeler `/api/reload`

### Rate limit admin
→ Attendre 5 minutes OU espacer les requêtes

---

## Support

Pour plus d'informations :
- **Architecture** : `ConfluentTranslator/STRUCTURE.md`
- **Guide admin** : `ConfluentTranslator/docs/admin/ADMIN_GUIDE.md`
- **Sécurité** : `ConfluentTranslator/docs/security/README_SECURITY.md`
