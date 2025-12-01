# RAPPORT D'ANALYSE DU LEXIQUE DE LA LANGUE ANCIEN CONFLUENT

**Date d'analyse** : 2025-12-01
**Objectif** : Identifier les lacunes du lexique par rapport au contenu du JDR

---

## SECTION A : Vue d'ensemble du lexique actuel

### Statistiques générales
- **Total de lignes** : ~10,103 lignes JSON
- **Total de fichiers** : 25 fichiers thématiques + 1 fichier grammaire

### Catégories couvertes

1. **01-racines-sacrees.json** (280 lignes) : 19 racines sacrées commençant par voyelle
   - Concepts fondamentaux : libre (aska), ancêtre (aita), sacré (asa), eau (ura), esprit (umi), un (iko), être (ita), origine (ena), tout (eka), épreuve (oki), aurore (ora), son (onu), étoile (atu), mort (osi), aile (apa)
   - Animaux sacrés : oiseau (apo), grue (alu), faucon (aki)

2. **02-racines-standards.json** (806 lignes) : Racines courantes + pronoms
   - Qualificatifs : grand, petit, lent, rapide, nouveau, vieux, chaud, froid, bon, mauvais, clair, sombre, long, bas
   - Concepts abstraits : vrai, bon, paix, mémoire, valeur, travail, temps, guerre, secret
   - Matériaux : bois, cendre, gris, sang, lait, sel, poison
   - Géographie : mer, vallée, route, sommet, ligne, lieu
   - Actions : échanger, frapper
   - Pronoms : je (miki), tu (sinu), il/elle (tani), nous/vous/ils

3. **03-castes.json** (378 lignes) : Groupes sociaux et castes
   - ✓ Siliaska (peuple)
   - ✓ Nakukeko (Enfants des Échos)
   - ✓ Nakuura (Enfants du Courant)
   - ✓ Aliaska (Ailes-Grises)
   - ✓ Akoazana (Faucons Chasseurs)
   - ✓ Takitosa (Passes-bien)
   - ✓ Oraumi (Voix de l'Aurore)
   - ✓ Zerusora (Ciels-clairs)
   - ✓ Zozeru (Sans-ciels)
   - ✓ Castes des 5 éléments (Air, Feu, Eau, Terre, Éther)

4. **04-lieux.json** (315 lignes) : Lieux majeurs
   - ✓ Uraakota (La Confluence)
   - ✓ Vukuura (Gouffre Humide)
   - ✓ Kekutoka (Antres des Échos)
   - ✓ Sikuvela (Cercles de Vigile)
   - ✓ Talusavu (Halls des Serments)
   - ✓ Ekakova (Grande Fresque)
   - ✓ Osiuaita (Ruines des Premiers Ancêtres)
   - Structures : village fortifié, basses-terres, avant-poste côtier, sanctuaire, forteresse, antre

5. **05-corps-sens.json** (202 lignes) : Anatomie et perception
   - ✓ Parties du corps : œil (sili), main (kanu), voix (voki), oreille (tiku), visage (muka), cœur (kori), corps (sanu), pied (peki), chair, peau, sang, poumon, souffle
   - ✓ Yeux de l'aurore (siluora)
   - Écho (keko)

6. **06-actions.json** (1185 lignes) : Verbes d'action
   - Mouvement, création, communication, observation, etc.

7. **07-emotions.json** (302 lignes) : États émotionnels

8. **08-nature-elements.json** (464 lignes) : Éléments naturels
   - ✓ Éléments : ciel, terre, feu, air, eau, pierre
   - ✓ Géographie : rivière, montagne, forêt, arbre, vallée, mer, grotte, cascade, source, côte, horizon, promontoire, pic
   - ✓ Célestes : lune, soleil, lumière, étoile, nuage
   - ✓ Météo : tempête
   - Qualités : humide, sec, profond, sombre

9. **09-institutions.json** (204 lignes) : Institutions politiques
   - ✓ Cercle des Sages (rikuusekitori)
   - ✓ Tribunal des Mœurs (verimuloku)
   - ✓ Proclamateur (vokiueka)
   - ✓ Assemblée des Chefs (kotaukasi)
   - ✓ Maison des Découvertes (nutuumiris)
   - ✓ Arbitre des Esprits (zakiiumi)
   - ✓ Directoire (kasiiukota)
   - ✓ Conseil du Village (kotaurikusi)
   - Célébrations : Autel ancestral, Vigile Lunaire, Jour des Ancêtres, Jour du Faucon

10. **10-animaux.json** (224 lignes) : Faune
    - ✓ Regards-Libres (aruaska)
    - ✓ Grue cendrée (arusenu)
    - Animaux génériques : bête, gibier, poisson (rivière), serpent (+ d'eau), oiseau (+ de proie), loup, meute
    - ✗ MANQUE : Créature inconnue existe mais pas d'animaux spécifiques évoqués dans le jeu

11. **11-armes-outils.json** (378 lignes) : Équipement
    - Armes : lance, arc, flèche, hachette, couteau, gourdin, bouclier
    - Outils : pioche, ciseau, maillet, burin, corde, filet, panier, piège
    - Objets : tablette, collier, vase rituel, coffret
    - Structures : foyer, armurerie, grenier

12. **13-rituels.json** (394 lignes) : Pratiques sacrées
    - ✓ Rituel du Regard Partagé (asausiliaakota)
    - ✓ Glyphes du Gouffre (kovuuvuku)
    - ✓ Colliers de glyphes (kopuukova)
    - ✓ Tablettes d'argile (tabuutoka)
    - ✓ Argile vivante (tokauita)
    - ✓ Rhombes sacrés (onuuasa) + variants
    - ✓ Artefact multi-générationnel (nekauekaaita)
    - ✓ Autel des Pionniers (asauenuaita)
    - ✓ Lois du Sang et de la Bête (lokuurasubetu)
    - ✓ Porteur de Flamme (takiusuki)
    - Matériaux rituels : lait de pierre, roche braise, pigments anciens
    - Concepts : pèlerinage, rites funéraires, fenêtre temporelle, tradition

13. **14-geographie.json** (308 lignes) : Géographie spécifique

14. **15-roles-titres.json** (540 lignes) : Rôles sociaux
    - ✓ Titres spirituels : oracle, chaman, guide des âmes, Aile-Grise
    - ✓ Titres militaires : Faucon Chasseur, guerrier, archer, porteur de lance, capitaine, sentinelle, traqueur
    - ✓ Titres artisanaux : maître artisan, façonneur de pierre, sculpteur, peintre, tisserand, pêcheur, mineur
    - ✓ Famille : ancêtre, mère, père, époux, aîné, descendant
    - ✓ Chefs : chef, Grand Chef, sage, gardien des lois

15. **16-communication.json** (349 lignes) : Communication

16. **17-temps.json** (281 lignes) : Temporalité

17. **18-couleurs.json** (321 lignes) : Couleurs

18. **19-sante-dangers.json** (264 lignes) : Santé et dangers

19. **20-objets-materiaux.json** (476 lignes) : Objets et matériaux

20. **21-famille.json** (141 lignes) : Relations familiales

21. **22-nombres.json** (279 lignes) : Système numérique

22. **23-nourriture.json** (463 lignes) : Alimentation
    - ✓ Larmes du Ciel (zeruosi)
    - ✓ Morsure-des-Ancêtres (aiteopalu)
    - Aliments : poisson, gibier, baie, tubercule, fruit, mollusque, graine, galette, herbe, aromate, légume
    - Techniques : fumer, sécher, griller, cuisiner, infuser
    - Concepts : nourriture, boire, réserve, manque

23. **24-habitat.json** (164 lignes) : Habitat et structures

---

## SECTION B : Lacunes critiques - Concepts de jeu absents du lexique

### B.1 - Noms propres et peuples étrangers

**MANQUE TOTAL** : Aucun vocabulaire pour les peuples étrangers découverts

- ❌ **Nanzagouet** : Peuple des "Cheveux de Sang" (premier contact 28/10/2025 et 25/11/2025)
- ❌ **Cheveux de Sang** : Nom donné aux étrangers aux cheveux roux
- ❌ **l'Autre** : Concept philosophique de l'étranger qui ne partage ni ancêtres, ni langue, ni intentions
- ❌ **Premiers Ancêtres** : Civilisation disparue (distinct de "aita" = ancêtre générique)
  - Note : "Ruines des Premiers Ancêtres" existe (osiuaita) mais pas le concept spécifique de "Premiers Ancêtres" comme peuple distinct

### B.2 - Concepts spirituels et philosophiques majeurs

- ❌ **"Porter un regard libre"** : Concept central de la civilisation (mandatory pilgrimage, cultural identity)
- ❌ **"Promis à pareil destin"** : Phrase existentielle clé exprimant la peur de disparaître comme les Premiers Ancêtres
- ❌ **Gardiens des passages** : Âmes des pionniers morts qui ne peuvent atteindre le ciel
- ❌ **Suffocation** (spirituelle) : Effet de rester trop longtemps dans les Antres
- ❌ **Miasme** : Gaz toxiques des ruines anciennes
- ❌ **Multi-couche** / **Multicouche** : Concept des fresques à plusieurs strates temporelles
- ❌ **Vassalité théocratique** : Système de gouvernance des Faucons Chasseurs

### B.3 - Institutions et structures politiques manquantes

- ✓ Hall des Serments existe MAIS manque :
  - ❌ **Conseil du Village** (structure à 4 membres existe mais vocabulaire incomplet)
  - ❌ **Pèlerinage annuel** (obligation des conseillers)
  - ❌ **Charges méritées** (philosophie politique : charges à mériter, non héréditaires)
  - ❌ **Compensation** (système de rémunération des conseillers)

- ❌ **Gouffre Humide comme campus multi-caste** (transformation institutionnelle)
  - Groupes d'étude : spirituels, techniques, philosophiques trans-castes

### B.4 - Technologies et matériaux spécifiques

**Glyphes du Gouffre** : Système d'écriture partiellement couvert mais manque :
- ❌ **Blocs modulaires** : Format physique des glyphes (petits blocs percés)
- ❌ **Réutilisable** : Propriété des colliers de glyphes
- ❌ **Nœuds** : Éléments structurels des colliers
- ❌ **Distribution** (par Passes-bien)
- ❌ **Standard pragmatique** : Philosophie du système d'écriture
- ❌ **Invention locale** : Liberté d'inventer ses propres glyphes

**Argile vivante** : Existe (tokauita) mais manque :
- ❌ **Durcissement instantané** : Propriété clé du matériau
- ❌ **Exposition à l'air** : Mécanisme de durcissement
- ❌ **Monopole des Enfants des Échos** : Aspect économique

**Autres technologies manquantes** :
- ❌ **Pilotis** : Architecture des villages sur l'eau (concept architectural majeur)
- ❌ **Tour de guet** : Élément des Halls des Serments
- ❌ **Zones climatiques** : Organisation de la Maison des Découvertes (4 zones)
- ❌ **Expérimentation multi-matériau** : Méthode de la Maison des Découvertes

### B.5 - Géographie et lieux spécifiques

**Lieux non nommés** :
- ❌ **Village fortifié à l'embouchure** : Premier Hall des Serments (lieu majeur du jeu)
  - Note : "village fortifié" existe mais pas le lieu spécifique à l'embouchure
- ❌ **Embouchure** : Où fleuve rencontre mer (concept géographique)
- ❌ **Route-rivière sécurisée** : Chemin entre vallée et côte avec postes de garde
- ❌ **Postes de garde** : Structures espacées d'une journée de marche
- ❌ **Lowlands** / **Basses-terres** : Région au-delà de la vallée de montagne
  - Note : "basses-terres" existe (tokuvuku) dans 04-lieux.json

**Éléments géographiques manquants** :
- ❌ **Eau salée** / **Eau impure** : Caractéristique de la mer
- ❌ **Eau douce** : Par opposition à eau salée
- ❌ **Berge** / **Rive** : Bord de rivière/mer
- ❌ **Marée** : Phénomène marin
- ❌ **Vague** : Élément maritime

### B.6 - Pratiques et rituels spécifiques

**Rituels manquants** :
- ❌ **Rituel du Regard Partagé - renouvellement annuel** : Usage spécifique pour les conseillers
- ❌ **Communion des esprits** : Rituel mentionné
- ❌ **Devenir partie de l'Antre** : Tradition des artisans âgés (refus d'enlever le corps, fierté)
- ❌ **Relais de mémorisation** : Technique des Ailes-Grises pour interpréter la fresque
- ❌ **Débat à travers le temps** : Concept de l'interprétation multi-générationnelle

**Justice et lois** :
- ✓ Lois du Sang et de la Bête existe MAIS manque :
  - ❌ **Investigation** : Phase d'enquête par Faucons Chasseurs
  - ❌ **Arène** : Lieu du combat judiciaire
  - ❌ **Combat judiciaire** : Trial by combat
  - ❌ **Coupable** / **Innocent** : Concepts juridiques

### B.7 - Activités militaires et tactiques

**Tactiques et équipement** :
- ❌ **Observation** (militaire) : Surveillance des ennemis
- ❌ **Capture** : Stratégie de prise de prisonniers
- ❌ **Interrogation** : Questionnement de captifs
- ❌ **Embuscade** : Tactique de surprise
- ❌ **Surnombre** : Supériorité numérique
- ❌ **Menacer** : Action d'intimidation
- ❌ **Soumettre** : Forcer la reddition
- ❌ **Abordage** : Attaque d'un navire
- ❌ **Se faire passer pour** : Déguisement/subterfuge

**Structures militaires** :
- ❌ **Garrison** : Groupe de défense permanent
- ❌ **Réserves** (militaires) : Stocks d'urgence
- ❌ **Armurerie** : Existe (lokuupiki) mais contexte du Hall manque

### B.8 - Navigation et mer

**DOMAINE PRESQUE ENTIÈREMENT ABSENT** :

Technologies maritimes :
- ❌ **Navire** : Existe (vanu) mais contexte minimal
- ❌ **Embarcation** : Bateau/barque
- ❌ **Construction en bois** : Description des navires étrangers
- ❌ **Manœuvrer** : Piloter un bateau
- ❌ **Échouer** / **Échouée** : Bateau sur le rivage
- ❌ **Chavirer** / **Se retourner** : Accident maritime
- ❌ **Couler** / **Sombrer** : Naufrage
- ❌ **Noyade** : Mort par l'eau
- ❌ **Rivage** : Bord de mer
- ❌ **Flotter** : Propriété d'un bateau
- ❌ **Créature flottante** : Perception initiale des navires

Activités maritimes :
- ❌ **Naviguer** : Voyager sur l'eau
- ❌ **Aborder** : Monter sur un navire
- ❌ **Marin** : Personne qui navigue
- ❌ **Pérégrination aquatique** : Voyage sur l'eau
- ❌ **Point d'eau** (côtier) : Lieu de ravitaillement
- ❌ **Ravitaillement en eau douce** : Besoin des marins

### B.9 - Vie quotidienne et objets

**Vêtements et apparence** :
- ❌ **Cheveux** : Partie du corps (crucial pour "Cheveux de Sang")
- ❌ **Trancher** / **Couper** (cheveux)
- ❌ **Oripeaux** / **Vêtement** / **Tenue**
- ❌ **Nu** / **Exhiber nu** : État vestimentaire
- ❌ **Taille** / **Morphologie** : Dimensions corporelles
- ❌ **Correspondre** : Adéquation de taille

**Actions quotidiennes manquantes** :
- ❌ **Courir après** : Poursuite
- ❌ **Forcer à rester** : Contrainte
- ❌ **Arracher** : Enlever de force
- ❌ **Panique** / **Paniquer**
- ❌ **Émeute** : Rébellion collective
- ❌ **Rouer de coups** : Violence physique
- ❌ **Mâter** : Soumettre par la force
- ❌ **Résister** : Opposition

**États et conditions** :
- ❌ **Vulnérable** : État de faiblesse
- ❌ **Audace** : Qualité de courage
- ❌ **Orgueilleux** : Défaut caractériel
- ❌ **Patient** : Vertu
- ❌ **Initiative** : Prise de décision
- ❌ **Imprévu** : Événement inattendu
- ❌ **Désordre** : Chaos
- ❌ **Choc** : Traumatisme émotionnel

### B.10 - Flore spécifique

- ✓ Morsure-des-Ancêtres existe (aiteopalu = gingembre sauvage)
- ❌ **Plante médicinale** : Catégorie manquante
- ❌ **Plante sauvage** vs **Plante cultivée** : Distinction importante
- ❌ **Récolte** : Action de cueillette
- ❌ **Cueilleur** : Rôle social

### B.11 - Temps et durée

**Concepts temporels manquants** :
- ❌ **Génération** : Unité de temps civilisationnelle
- ❌ **Décennie** : Dizaine d'années
- ❌ **Siècle** : Cent ans
- ❌ **Millénaire** : Mille ans
- ❌ **Éternel** : Sans fin
- ❌ **Temporalité** : Concept du temps
- ❌ **Multi-générationnel** : Qui traverse plusieurs générations (crucial pour artefacts)
- ❌ **Relais** (temporel) : Transmission à travers le temps
- ❌ **Stratification temporelle** : Couches de temps

### B.12 - Concepts sociaux et culturels

**Isolement et appartenance** :
- ❌ **"Don't like those from the surface"** : Attitude des Enfants des Échos
- ❌ **Culturellement isolé** : État de séparation
- ❌ **Surface** vs **Souterrain** : Opposition spatiale/culturelle
- ❌ **Adaptation physique** : Changements corporels (pâleur, membres allongés, cécité)
- ❌ **Pâle** : Couleur de peau
- ❌ **Allongé** : Forme corporelle
- ❌ **Aveugle** / **Cécité** : Perte de vision

**Hiérarchie et pouvoir** :
- ❌ **Monopole** : Contrôle exclusif (crucial pour économie)
- ❌ **Élite** : Groupe dominant
- ❌ **Permanent** : Non temporaire (pour garrison)
- ❌ **Transitoire** / **Temporaire** : Opposé de permanent
- ❌ **Mériter** : Gagner par le mérite
- ❌ **Héréditaire** : Transmission familiale (concept à rejeter)
- ❌ **Fief** : Territoire accordé (concept à rejeter)

**Valeurs et philosophie** :
- ❌ **Gloire** : Honneur et renommée
- ❌ **Honneur** : Valeur morale
- ❌ **Fierté** : Sentiment de dignité
- ❌ **Reproche** : Critique
- ❌ **Louer** : Complimenter
- ❌ **Imputer la faute** : Accuser
- ❌ **Indigne** : Déshonorant
- ❌ **Satisfaire** : Répondre aux attentes
- ❌ **Exigence** : Demande forte

---

## SECTION C : Lacunes thématiques - Catégories sous-développées

### C.1 - Faune : Seulement 10 animaux pour un monde riche

**Animaux présents** :
- Grue (alu) + Regards-Libres (aruaska) + grue cendrée
- Faucon (aki)
- Oiseau générique (apo)
- Poisson (pisu)
- Serpent (sepu) + serpent d'eau
- Loup (loku) + meute
- Bête générique (betu)

**Animaux manquants mentionnés dans le jeu** :
- ❌ **Gibier spécifique** : Cerf, sanglier, lapin, etc.
- ❌ **Animaux de la Grande Fresque** : "Unknown animals" de la fresque
- ❌ **Prédateurs** : Ours, lynx, etc.
- ❌ **Insectes** : Aucun vocabulaire
- ❌ **Reptiles** : Seulement serpent
- ❌ **Amphibiens** : Aucun
- ❌ **Oiseaux spécifiques** : Au-delà de grue/faucon
- ❌ **Créatures d'eau douce** : Au-delà de poisson générique
- ❌ **Créatures marines** : Aucune (alors que mer découverte)

### C.2 - Matériaux : Lacunes dans matériaux de construction

**Présent** : pierre, bois, argile vivante, lait de pierre

**Manquant** :
- ❌ **Mortier** : Liant de construction
- ❌ **Chaux** : Matériau de construction
- ❌ **Torchis** : Mélange construction
- ❌ **Paille** / **Chaume** : Matériaux de toiture
- ❌ **Cuir** : Matériau animal
- ❌ **Os** : Matériau et reste mortuaire
- ❌ **Tendon** : Matériau pour cordes
- ❌ **Résine** : Matériau végétal
- ❌ **Écorce** : Matériau végétal
- ❌ **Fibre végétale** : Pour tissage
- ❌ **Lin** / **Chanvre** : Plantes à fibres

### C.3 - Architecture : Vocabulaire architectural minimal

**Présent** : Hall, maison, village, forteresse, antre, grotte

**Manquant** :
- ❌ **Pilotis** : CRITIQUE - architecture majeure des Enfants du Courant
- ❌ **Plate-forme** : Structure sur pilotis
- ❌ **Escalier** : Mentionné dans "2025-07-17-escaliers-et-maladie.md"
- ❌ **Marche** : Élément d'escalier
- ❌ **Seuil** : Entrée
- ❌ **Linteau** : Élément architectural
- ❌ **Colonne** / **Pilier** : Support
- ❌ **Voûte** : Construction souterraine
- ❌ **Galerie** : Passage souterrain (crucial pour Antres)
- ❌ **Chambre** : Pièce
- ❌ **Atelier** : Lieu de travail
- ❌ **Entrepôt** : Stockage
- ❌ **Tour** : Structure haute (tour de guet)
- ❌ **Mur** : Paroi
- ❌ **Muraille** : Fortification
- ❌ **Enceinte** : Protection
- ❌ **Porte** : Passage
- ❌ **Fenêtre** : Ouverture
- ❌ **Toit** : Couverture

### C.4 - Parties du corps : Liste incomplète

**Présent** : œil, main, voix, oreille, visage, cœur, corps, pied, poumon, souffle, chair, peau, sang

**Manquant** :
- ❌ **Cheveux** : CRITIQUE (Cheveux de Sang)
- ❌ **Tête** : Partie majeure
- ❌ **Bras** : Membre
- ❌ **Jambe** : Membre
- ❌ **Doigt** : Extrémité
- ❌ **Orteil** : Extrémité
- ❌ **Bouche** : Organe
- ❌ **Langue** (organe) : Distinct de langue (langage)
- ❌ **Dent** : Organe
- ❌ **Nez** : Organe
- ❌ **Front** : Partie visage
- ❌ **Joue** : Partie visage
- ❌ **Menton** : Partie visage
- ❌ **Cou** : Partie corps
- ❌ **Épaule** : Partie corps
- ❌ **Dos** : Partie corps
- ❌ **Ventre** : Partie corps
- ❌ **Estomac** : Organe interne
- ❌ **Foie** : Organe interne
- ❌ **Os** : Structure interne (crucial pour squelettes des ruines)
- ❌ **Squelette** : Ensemble d'os
- ❌ **Crâne** : Os de la tête
- ❌ **Côte** : Os du thorax

### C.5 - Maladies et dangers : Sous-développé pour un jeu avec miasmes toxiques

**Présent** : Fichier 19-sante-dangers.json existe mais contenu non lu en détail

**Manquant probable** :
- ❌ **Miasme** : CRITIQUE - gaz toxique des ruines
- ❌ **Toxique** : Empoisonné
- ❌ **Sommeil mortel** : Effet des miasmes
- ❌ **Dégénérescence** : État des os anciens
- ❌ **Maladie** : Concept général
- ❌ **Contagion** : Transmission
- ❌ **Guérison** : Rétablissement
- ❌ **Blessure** : Dommage physique
- ❌ **Fracture** : Os cassé
- ❌ **Brûlure** : Dommage par feu
- ❌ **Noyade** : CRITIQUE (échec naval)
- ❌ **Suffocation** : Manque d'air
- ❌ **Famine** : Manque de nourriture
- ❌ **Soif** : Manque d'eau

### C.6 - Artisanat et techniques : Lacunes malgré civilisation d'artisans

**Présent** : Termes génériques (artisan, sculpteur, peintre, tisserand)

**Manquant** :
- ❌ **Tresser** : Technique de tissage
- ❌ **Filer** : Créer du fil
- ❌ **Tisser** : Créer du tissu
- ❌ **Coudre** : Assembler tissu
- ❌ **Tanner** : Traiter le cuir
- ❌ **Forger** : Travailler le métal (si métallurgie existe)
- ❌ **Polir** : Finition de surface
- ❌ **Aiguiser** : Affûter lame
- ❌ **Assembler** : Joindre pièces
- ❌ **Creuser** : Faire un trou (crucial pour mineurs)
- ❌ **Excaver** : Creuser profond
- ❌ **Étayer** : Soutenir structure
- ❌ **Effondrement** : Collapse (crucial - cave-ins dans ruines)
- ❌ **Débris** : Décombres
- ❌ **Éboulis** : Chute de pierres

### C.7 - Commerce et économie : Vocabulaire économique limité

**Présent** : échanger (kiru), Passes-bien (marchands)

**Manquant** :
- ❌ **Prix** / **Valeur d'échange** : Coût
- ❌ **Troquer** : Existe mais contexte limité
- ❌ **Acheter** / **Vendre** : Transactions
- ❌ **Dette** : Obligation économique
- ❌ **Prêt** : Avance
- ❌ **Partage** : Distribution
- ❌ **Redistribution** : Système économique
- ❌ **Abondance** : Surplus
- ❌ **Pénurie** : Manque (existe pour nourriture mais pas général)
- ❌ **Richesse** : Accumulation
- ❌ **Pauvreté** : Manque
- ❌ **Propriété** : Possession
- ❌ **Communal** : Partagé (crucial pour réserves)

### C.8 - Verbes d'action complexes : Lacunes dans actions sociales

**Actions manquantes** :
- ❌ **Convaincre** : Persuader
- ❌ **Négocier** : Discuter accord
- ❌ **Promettre** : Engagement futur
- ❌ **Trahir** : Rompre confiance
- ❌ **Se repentir** : Regretter
- ❌ **Pardonner** : Absoudre
- ❌ **Punir** : Sanctionner
- ❌ **Récompenser** : Gratifier
- ❌ **Honorer** : Respecter
- ❌ **Mépriser** : Dédaigner
- ❌ **Admirer** : Respecter avec envie
- ❌ **Envier** : Jalousie
- ❌ **Craindre** : Avoir peur
- ❌ **Espérer** : Attendre avec confiance
- ❌ **Désespérer** : Perdre espoir

### C.9 - Nombres et quantités : Système numérique non évalué

Le fichier 22-nombres.json (279 lignes) existe mais n'a pas été lu en détail. À vérifier :
- Système de numération complet ?
- Ordinaux ?
- Fractions ?
- Quantités approximatives (beaucoup, peu, plusieurs, etc.) ?

### C.10 - Couleurs : Système chromatique à vérifier

Le fichier 18-couleurs.json (321 lignes) existe. Présent dans autres fichiers :
- Rouge (pasu) - couleur du sang
- Gris (senu) - couleur de cendre
- Blanc (milu?) - lait
- Noir/sombre (kumu)
- Clair/lumineux (sora)

À vérifier dans 18-couleurs.json :
- Couleurs de l'aurore (rouge, orange, violet) : CRITIQUE pour yeux des Ciels-clairs
- Vert, bleu, jaune ?
- Nuances et intensités ?

---

## SECTION D : Ajouts prioritaires par catégorie

### D.1 - PRIORITÉ CRITIQUE : Contact avec les Nanzagouet (tour actuel)

**Vocabulaire immédiatement nécessaire** :

1. **Identité et altérité** :
   - Nanzagouet (nom du peuple étranger)
   - Cheveux de Sang (descriptif initial)
   - l'Autre (concept philosophique)
   - Cheveux (partie du corps)
   - Étranger / inconnu / différent

2. **Navigation et mer** :
   - Navire (améliorer vanu avec contexte)
   - Embarcation / barque
   - Flotter / naviguer
   - Chavirer / couler / sombrer
   - Noyade
   - Marin / navigateur
   - Manœuvrer / piloter
   - Échouer (bateau)
   - Rivage / berge

3. **Actions militaires du tour** :
   - Capturer / capture
   - Menacer / menace
   - Soumettre
   - Paniquer / panique
   - Résister / résistance
   - Rouer de coups
   - Mâter (soumettre)
   - Forcer à (rester, etc.)
   - Courir après / poursuivre
   - Se faire passer pour / imiter
   - Abordage / aborder

4. **Vêtements et apparence** :
   - Vêtement / tenue / oripeaux
   - Nu / nudité
   - Trancher / couper (cheveux)
   - Arracher (vêtements)
   - Taille / morphologie / correspondre

5. **Émotions et concepts sociaux du tour** :
   - Vulnérable
   - Audace / audacieux
   - Orgueilleux / orgueil
   - Patient / patience
   - Initiative
   - Imprévu
   - Désordre / chaos
   - Gloire / glorieux
   - Reproche / reprocher
   - Louer / louange
   - Indigne
   - Émeute

6. **Ravitaillement** :
   - Eau douce (vs eau salée)
   - Point d'eau
   - Ravitaillement / se ravitailler
   - Réserve (existe, à contextualiser)

### D.2 - PRIORITÉ HAUTE : Identité civilisationnelle

**Concepts philosophiques centraux** :
- Porter un regard libre (concept identitaire central)
- Promis à pareil destin (anxiété existentielle)
- Premiers Ancêtres (peuple distinct de "ancêtres")
- Gardiens des passages (âmes des pionniers)
- Multi-générationnel / à travers les générations
- Relais (temporel et de mémorisation)
- Débat à travers le temps

**Temps et durée** :
- Génération
- Décennie / siècle / millénaire
- Éternel / éternité
- Temporalité / stratification temporelle

### D.3 - PRIORITÉ HAUTE : Architecture et habitat

**Pilotis et structures** :
- Pilotis (CRITIQUE - architecture majeure)
- Plate-forme
- Tour / tour de guet
- Escalier / marche
- Galerie (souterraine)
- Chambre / pièce
- Atelier
- Mur / muraille / enceinte
- Porte / seuil / entrée
- Toit / toiture

**Géographie manquante** :
- Embouchure (où fleuve rencontre mer)
- Eau douce / eau salée
- Berge / rive
- Marée / vague

### D.4 - PRIORITÉ HAUTE : Technologies et matériaux

**Glyphes du Gouffre (compléter)** :
- Bloc modulaire
- Percer / percé
- Nœud (de corde)
- Réutilisable
- Distribution / distribuer
- Standard / standardisé
- Invention locale

**Argile vivante (compléter)** :
- Durcir / durcissement
- Instantané
- Exposition à l'air
- Monopole

**Matériaux manquants** :
- Cuir / peau d'animal
- Os / ossement / squelette
- Tendon
- Résine
- Écorce
- Fibre végétale
- Paille / chaume

### D.5 - PRIORITÉ MOYENNE : Corps humain (compléter)

**Parties manquantes critiques** :
- Cheveux (CRITIQUE)
- Tête
- Bras / jambe
- Doigt / orteil
- Bouche / langue / dent / nez
- Os / squelette / crâne
- Cou / épaule / dos / ventre

**États corporels** :
- Pâle / pâleur
- Allongé (morphologie)
- Aveugle / cécité
- Adapté / adaptation

### D.6 - PRIORITÉ MOYENNE : Dangers et santé

**Dangers des ruines** :
- Miasme / gaz toxique
- Toxique / empoisonné
- Sommeil mortel
- Suffocation / suffoquer
- Effondrement / éboulement / cave-in
- Débris / décombres / éboulis
- Noyade / se noyer
- Inondation / inonder

**Maladies et blessures** :
- Maladie / malade
- Dégénérescence / dégénérer
- Blessure / blessé
- Fracture / os cassé
- Brûlure
- Guérison / guérir

### D.7 - PRIORITÉ MOYENNE : Justice et concepts politiques

**Justice (compléter Lois du Sang et de la Bête)** :
- Investigation / investiguer / enquête
- Arène
- Combat judiciaire
- Coupable / innocent
- Preuve / témoignage
- Accusation / accuser
- Défense / défendre

**Concepts politiques** :
- Monopole (économique)
- Mériter / mérite (charges méritées)
- Héréditaire (concept à rejeter)
- Fief (concept à rejeter)
- Permanent vs temporaire
- Compensation (rémunération)
- Charge (fonction politique)

### D.8 - PRIORITÉ MOYENNE : Artisanat et techniques

**Techniques de construction** :
- Creuser / excaver
- Étayer / soutien / support
- Assembler / joindre
- Polir / finition
- Mortier / liant

**Techniques textiles** :
- Tresser / tressage
- Filer / fil
- Tisser / tissage / tissu
- Coudre / couture
- Tanner (cuir)

**Outils et actions** :
- Aiguiser / affûter
- Percer / perforer
- Scier
- Raboter

### D.9 - PRIORITÉ BASSE : Faune spécifique

**Gibier** :
- Cerf / biche
- Sanglier
- Lapin / lièvre
- Écureuil

**Prédateurs** :
- Ours
- Lynx
- Renard

**Oiseaux** :
- Corbeau / corneille
- Aigle
- Chouette / hibou
- Moineau / passereau

**Autres** :
- Insectes (abeille, fourmi, araignée, etc.)
- Amphibiens (grenouille, salamandre)
- Créatures marines (crabe, crevette, moule, etc.)

### D.10 - PRIORITÉ BASSE : Commerce et économie

**Transactions** :
- Prix / coût / valeur
- Acheter / vendre
- Dette / devoir
- Prêt / prêter / emprunter

**Distribution** :
- Partage / partager
- Redistribution
- Abondance / surplus
- Richesse / pauvreté
- Propriété / possession
- Communal / collectif

### D.11 - PRIORITÉ BASSE : Verbes d'action sociale

**Relations interpersonnelles** :
- Convaincre / persuader
- Négocier / négociation
- Promettre / promesse
- Trahir / trahison
- Se repentir / repentir
- Pardonner / pardon
- Punir / punition
- Récompenser / récompense

**Attitudes** :
- Honorer / honneur
- Mépriser / mépris
- Admirer / admiration
- Envier / envie
- Craindre / crainte
- Espérer / espoir
- Désespérer / désespoir

---

## SECTION E : Observations sur la structure et l'organisation du lexique

### E.1 - Points forts du lexique actuel

1. **Organisation thématique claire** : Les 25 fichiers JSON sont bien séparés par domaine sémantique
2. **Système de racines cohérent** : Distinction nette entre racines sacrées (voyelle initiale) et standards (consonne initiale)
3. **Compositions transparentes** : Les mots composés indiquent clairement leurs racines et sens littéral
4. **Métadonnées riches** : Chaque entrée contient type, domaine, notes explicatives
5. **Synonymes français** : Facilitent la recherche et la traduction
6. **Couverture des éléments centraux** : Castes, institutions majeures, lieux principaux bien représentés

### E.2 - Lacunes structurelles

1. **Pas de fichier dédié à la navigation** : Alors que la mer est découverte et critique pour le jeu actuel
2. **Anatomie incomplète** : 05-corps-sens.json n'a que 13 parties du corps
3. **Faune très limitée** : 10-animaux.json n'a que 10 concepts pour un monde naturel riche
4. **Pas de fichier "concepts philosophiques"** : Les idées abstraites centrales ("porter un regard libre", "promis à pareil destin") n'ont pas de catégorie dédiée
5. **Architecture sous-représentée** : Mélangée dans plusieurs fichiers sans cohérence

### E.3 - Suggestions d'organisation

**Nouveaux fichiers à créer** :
1. **25-navigation.json** : Navigation, bateaux, mer, activités maritimes
2. **26-architecture.json** : Structures, éléments de construction, espaces
3. **27-concepts-philosophiques.json** : Idées abstraites centrales à la civilisation
4. **28-etrangers.json** : Vocabulaire pour peuples étrangers, altérité, contact interculturel
5. **29-anatomie-complete.json** : Compléter le vocabulaire corporel

**Fichiers à enrichir en priorité** :
1. **10-animaux.json** : Tripler au minimum le nombre d'espèces
2. **19-sante-dangers.json** : Vérifier et compléter (miasmes, maladies, accidents)
3. **20-objets-materiaux.json** : Ajouter matériaux organiques (cuir, os, fibres)
4. **06-actions.json** : Ajouter actions sociales complexes

### E.4 - Cohérence avec les documents de jeu

**Excellente cohérence pour** :
- Noms propres des institutions
- Castes et groupes sociaux
- Lieux majeurs
- Technologies centrales (argile vivante, glyphes, rhombes)
- Rituels principaux

**Décalage important pour** :
- Vocabulaire du contact interculturel (aucun mot pour "Nanzagouet", "l'Autre", "étranger")
- Vocabulaire maritime (découverte de la mer non reflétée)
- Concepts philosophiques identitaires (non lexicalisés)
- Vie quotidienne pratique (vêtements, corps, actions sociales)

### E.5 - Recommandations méthodologiques

**Pour les ajouts prioritaires** :
1. **Créer d'abord 28-etrangers.json** : Tour actuel nécessite vocabulaire du contact interculturel
2. **Créer 25-navigation.json** : Découverte maritime récente
3. **Enrichir 10-animaux.json** : Ajouter 20-30 espèces minimum
4. **Compléter 05-corps-sens.json** : Doubler le nombre de parties du corps
5. **Créer 27-concepts-philosophiques.json** : Lexicaliser les idées centrales

**Principes de développement** :
1. **Prioriser les besoins narratifs** : Le tour actuel (contact avec Nanzagouet) doit guider les ajouts immédiats
2. **Maintenir la cohérence morphologique** : Respecter le système racines sacrées/standards
3. **Documenter les choix** : Expliquer dans "note" pourquoi tel mot utilise telle racine
4. **Créer des familles lexicales** : Un nouveau domaine (navigation) doit avoir vocabulaire complet, pas juste 2-3 mots
5. **Équilibrer abstrait et concret** : Ajouter aussi bien concepts philosophiques que objets physiques

### E.6 - Estimation quantitative des lacunes

**Lacunes par priorité** :
- **CRITIQUE (besoin immédiat pour tour actuel)** : ~80-100 mots
  - Contact interculturel : 30 mots
  - Navigation : 25 mots
  - Actions militaires/capture : 20 mots
  - Vêtements/apparence : 15 mots

- **HAUTE (besoin à court terme)** : ~150-200 mots
  - Concepts philosophiques : 25 mots
  - Architecture : 40 mots
  - Technologies (compléments) : 30 mots
  - Corps humain : 30 mots
  - Dangers/santé : 40 mots
  - Temps/durée : 15 mots

- **MOYENNE (consolidation)** : ~200-250 mots
  - Justice (compléments) : 20 mots
  - Politique (compléments) : 20 mots
  - Artisanat : 40 mots
  - Matériaux : 30 mots
  - Faune basique : 40 mots
  - Géographie : 30 mots
  - Émotions/actions sociales : 40 mots

- **BASSE (enrichissement)** : ~300+ mots
  - Faune détaillée : 100 mots
  - Flore détaillée : 50 mots
  - Commerce : 30 mots
  - Verbes complexes : 60 mots
  - Nuances diverses : 60+

**Total estimé des lacunes significatives** : 730-850 mots manquants pour un lexique vraiment complet et adapté au niveau narratif actuel du jeu.

**Taille actuelle estimée** : ~400-500 entrées lexicales (basé sur 10,103 lignes pour 25 fichiers)

**Ratio** : Le lexique devrait être augmenté de 150-200% pour couvrir complètement les besoins du jeu à son stade actuel.

---

## CONCLUSION

Le lexique de la langue ancien confluent est **bien structuré et cohérent dans son organisation**, avec une excellente couverture des **éléments centraux de worldbuilding** (castes, institutions, lieux sacrés, technologies uniques).

Cependant, il présente des **lacunes critiques** dans plusieurs domaines :

1. **Le vocabulaire du contact interculturel est totalement absent** alors que c'est le cœur du tour actuel
2. **Le vocabulaire maritime est minimal** malgré la découverte de la mer
3. **Les concepts philosophiques identitaires ne sont pas lexicalisés** ("porter un regard libre", etc.)
4. **La vie quotidienne pratique est sous-représentée** (vêtements, anatomie complète, actions sociales)
5. **Plusieurs domaines techniques manquent de profondeur** (navigation, architecture, faune)

**Recommandation** : Commencer immédiatement par créer **28-etrangers.json** et **25-navigation.json** pour répondre aux besoins narratifs urgents du tour actuel avec les Nanzagouet, puis enrichir systématiquement les domaines identifiés en priorité HAUTE.
