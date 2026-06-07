# Assignation des formes de glyphes — réflexion (cas par cas)

But : redéconflicter les 41 groupes de glyphes visuellement identiques en assignant à **chaque glyphe une forme CLAIRE et, autant que possible, SÉMANTIQUE** (qui évoque le sens). Pour chaque glyphe : une phrase + un CoT.

## Principes
- Vocabulaire = primitives de **formes** (tifinagh-like) : cercle (anneau), carré, triangle, losange, croix(X), plus(+), chevron(Λ), chevron inversé(V), tick(✓), flèche(↗), demi-cercle(⌢), demi-cercle vertical, voûte(^), cœur(V), main(Y), œil, point, traits, etc. — sur grille **carrée** (vraies formes), rendu argile.
- Différenciateur = toujours **visible à l'échelle du boudin** (jamais un point noyé sous un trait).
- Validation = détecteur **rasterisé** (R=9) → 0 doublon visuel garanti.
- Quand une forme « évidente » est déjà prise par un autre sens, on compose **forme + 2ᵉ forme/marque** ou on choisit une forme voisine, en gardant le lien sémantique.

## Process
Glyphes des 41 groupes marqués `_todo` (en attente). On assigne groupe par groupe via `scripts/_set.js` (qui valide les collisions en ignorant les `_todo` encore en attente). Au fur et à mesure.

---

## Assignations

### Groupe — {pierre, dent}
- **kari (pierre) → carré + facette (diagonale).** La pierre, c'est le bloc taillé. CoT : matériau dur/inerte/anguleux, base des murs → forme fermée stable = carré ; mais le carré pur = `no` (lieu/enceinte), donc on ajoute la **facette** (diagonale) = la face *clivée* du bloc taillé → distinct + évoque la taille de la pierre.
- **bitu (dent) → triangle.** La dent, c'est la pointe. CoT : élément dur mais acéré qui mord → une seule pointe vers le haut = triangle ; se distingue du bloc (pierre).

### Groupe — {oiseau, faucon}
- **apo (oiseau) → chevron Λ + corps (point).** L'oiseau, ce sont les ailes + le corps. CoT : silhouette des ailes en vol = chevron ; mais le chevron pur = `vi` (direction) → on ajoute le **point** (le corps de l'oiseau entre les ailes) → distinct + plus complet.
- **aki (faucon) → chevron inversé V.** Le faucon, c'est le piqué. CoT : faucon chasseur = l'attaque en piqué ; le chevron inversé (pointe en bas) = l'oiseau qui plonge sur sa proie ; même famille « aile » que l'oiseau mais orienté chasse → distinct et signifiant.

### Groupe — {poisson, navire, doux}
- **pesa (poisson) → losange.** Le poisson, c'est le corps fuselé. CoT : forme fusiforme à deux pointes (tête/queue) = le losange, archétype du corps qui file dans l'eau.
- **vanu (navire) → demi-cercle ⌢.** Le navire, c'est la coque. CoT : l'arc qui fend l'eau = la voûte de la coque ; une seule courbe ample, distincte des angles.
### Groupe — {main, échange}
- **kanu (main) → mainY.** CoT : la main = l'atome « main » (Y = paume + doigts), iconique et direct.
- **kiru (échange) → croix (X).** CoT : l'échange = deux flux qui se croisent/permutent → le X.

### Groupe — {tête, zone, tête-chef, vigile}
- **muto (tête) → anneau + base.** CoT : crâne (cercle) posé sur le cou (base) ; le cercle pur est réservé à `siku` (cercle).
- **zoni (zone) → carré + point.** CoT : aire délimitée (carré) + repère central = une zone.
- **kasi (tête/chef) → anneau + tiret haut.** CoT : la tête qui commande = crâne + trait au-dessus (couronne/autorité) ; distinct de `muto`.
- **vela (vigile) → triangle + point.** CoT : le guetteur = le poste/la tour (triangle) + l'œil qui veille (point).

### Groupe — nature/éléments {feu, rouge, terre, sel, pont, sec, soleil, sommet, outil, nuit, mort}
- **suki (feu) → flamme + diagonale.** CoT : la flamme + une langue oblique qui s'élève.
- **pasu (rouge) → losange + barre.** CoT : teinte chaude/cristalline marquée d'une barre vive.
- **toka (terre) → base + point.** CoT : le sol (ligne de base) + le grain de terre.
- **seli (sel) → losange + facette.** CoT : le cristal de sel taillé.
- **vasi (pont) → demi-cercle + base.** CoT : l'arche du pont posée sur ses appuis.
- **seku (sec) → base + tiret haut.** CoT : sol aride, lignes sèches sans vie.
- **sora (soleil) → anneau + croix (+).** CoT : le disque solaire + les rayons.
- **sumu (sommet) → chevron + barre.** CoT : le pic dressé.
- **tavu (outil) → barre + triangle.** CoT : le manche + la tête tranchante.
- **bami (nuit) → demi-cercle + diagonale.** CoT : le croissant nocturne.
- **osi (mort) → croix + tiret haut.** CoT : le marqueur de tombe / la croix funéraire.

### Groupe — perception/temps/vérité {regard, présent, passé, futur, vrai, vrai(b), être, origine, souvenir, habituel}
- **sili (regard) → œil.** CoT : l'œil = le regard, littéral et fondateur (peuple = « porteurs du regard »).
- **tisa (présent) → barre + point.** CoT : l'instant = la verticale de « maintenant » + le point focal.
- **ieso (passé) → chevron inversé + base.** CoT : le temps derrière, pointe baissée, révolu/posé.
- **saze (futur) → flèche ↗.** CoT : ce qui est devant/à venir = la flèche qui monte vers l'avant.
- **veri (vrai) → tick ✓.** CoT : la validation = la coche, « vrai » universel.
- **veli (vrai b) → tick + tiret haut.** CoT : variante de vrai (coche soulignée).
- **ita (être) → figure + tiret haut.** CoT : l'existence = la silhouette debout, présente.
- **ena (origine) → goutte + tiret haut.** CoT : la source/germe d'où tout part.
- **mori (souvenir) → anneau + facette.** CoT : une chose enclose/gardée, gravée dans la mémoire.
- **eol (habituel) → anneau + tiret.** CoT : l'habitude = le cycle qui revient.

### Groupe — sacré/abstrait {valeur, secret, cercle, temps, présage, rhombe, éternel, étoile, sacré, nouveau, épreuve, interdit}
- **valu (valeur) → losange + plus.** CoT : le joyau (losange) augmenté = la valeur.
- **zoku (secret) → carré + croix.** CoT : le coffre scellé d'un X.
- **siku (cercle) → cercle.** CoT : littéral — le cercle pur (cf. cercles de vigile).
- **temi (temps) → anneau + chevron.** CoT : le cycle (anneau) + la flèche du cours du temps.
- **novi (présage) → triangle + diagonale.** CoT : le signe qui pointe, barré d'un trait annonciateur.
- **ieto (rhombe) → losange + point.** CoT : littéral — le rhombe marqué d'un centre.
- **eom (éternel) → anneau + croix.** CoT : le cycle sans fin scellé des 4 directions.
- **eku (étoile) → croix + plus (✳).** CoT : l'astre qui rayonne dans toutes les directions.
- **asa (sacré) → triangle + plus.** CoT : l'élévation (triangle) sanctifiée par la croix.
- **nuvi (nouveau) → chevron + tiret haut.** CoT : la pousse qui perce vers le haut.
- **oki (épreuve) → triangle + croix.** CoT : l'obstacle barré = le test à franchir.
- **zob (interdit) → anneau + barre.** CoT : le cercle barré = l'interdiction.

### Groupe — voix/surface/gens {voix, peau, gris, vieux, tablette, glyphe, écrit, femme, fille, allié, tribu, garder}
- **voki (voix) → bouche + barre.** CoT : la voix sort de la bouche (+ trait = le son émis).
- **peli (peau) → carré + trait H.** CoT : la surface tendue, l'enveloppe plane.
- **kesa (gris) → bandes + diagonale.** CoT : les hachures = le gris (entre noir et blanc).
- **eabme (vieux) → chevron + base.** CoT : courbé par l'âge, posé/affaissé.
- **tabi (tablette) → carré + jambe.** CoT : la dalle d'argile inscrite.
- **kova (glyphe) → losange + croix.** CoT : le signe encadré = un glyphe.
- **uv (écrit) → bandes + barre.** CoT : les lignes d'écriture tracées.
- **nako (femme) → demi-cercle + barre.** CoT : forme arrondie + axe.
- **naku (fille) → triangle + tiret haut.** CoT : jeune pousse, plus petite/anguleuse.
- **vaku (allié) → main + tiret haut.** CoT : la main tendue/jointe = l'alliance.
- **tibu (tribu) → maison + chevron.** CoT : le clan = les foyers réunis.
- **konu (garder) → carré + tick.** CoT : enclore et valider = garder/protéger.

### Groupe — grammaire/divers {un, sujet, origine-part., impératif, là-bas, futur, instrument, froid, liaisons, distance, passé, bête, hachette, esprit2, aurore, présent, temps}
- **iko (un/1) → barre |.** CoT : le 1 = le trait unique, l'unité.
- **va (sujet) → jambe + tiret haut.** CoT : marqueur de sujet, trait court posé.
- **ve (origine, part.) → point + tiret haut.** CoT : le germe d'où part la relation.
- **ok (impératif) → flèche + barre.** CoT : l'ordre = la flèche directive, dressée.
- **tova (là-bas) → flèche + tiret haut.** CoT : pointer au loin.
- **en (futur, conj.) → flèche + jambe.** CoT : le temps qui va de l'avant.
- **vu (instrument) → main + jambe.** CoT : l'outil tenu en main (« par le moyen de »).
- **kiso (froid) → losange + jambe.** CoT : le cristal de glace.
- **e (liaison/dimension) → trait H + point.** CoT : liaison de dimension, marque minimale.
- **eo (liaison eo) → trait H + jambe.** CoT : variante de liaison.
- **tavo (distance) → base + jambe.** CoT : l'écart, un pas sur la ligne.
- **at (passé, conj.) → chevron inversé + point.** CoT : le révolu marqué.
- **besi (bête) → chevron + jambe.** CoT : l'animal à pattes (membre/corne).
- **kutu (hachette) → triangle + jambe.** CoT : la lame (triangle) + le manche.
- **uuto (esprit2) → flamme + tiret haut.** CoT : souffle/esprit, feu de l'âme.
- **ora (aurore) → demi-cercle + plus.** CoT : le soleil levant sur l'horizon.
- **tisa (présent) → plus + tiret haut.** CoT : l'instant central marqué (forme visible).
- **temi (temps) → anneau + chevron.** CoT : le cycle + le cours du temps.

### Groupe — outils/nature/matière {lever, bois, technique, tubercule, pointe, fruit, serment, mollusque, cyclique, galette, nom, réserve, chambre, noir, gravure, sombre, petit}
- **levi (lever) → flèche + trait H.** CoT : soulever vers le haut.
- **buki (bois/forêt) → plante + barre.** CoT : l'arbre/le bois sur pied.
- **teku (technique) → plus + main.** CoT : le savoir-faire de la main outillée.
- **tuba (tubercule) → losange + base.** CoT : le bulbe sous la terre.
- **piki (pointe) → chevron inversé + barre.** CoT : la pointe acérée.
- **veka (fruit) → anneau + jambe.** CoT : le fruit rond à sa tige.
- **savu (serment) → main + tick.** CoT : la main qui jure/valide.
- **molu (mollusque) → demi-cercle + vague.** CoT : la coquille spiralée et molle.
- **eon (cyclique) → anneau + chevron inversé.** CoT : le cycle qui se referme.
- **panu (galette) → losange + trait H.** CoT : la galette plate.
- **nomi (nom) → bandes + main.** CoT : le nom = l'inscription qui désigne.
- **zaku (réserve) → maison + base.** CoT : le grenier/entrepôt clos.
- **kama (chambre) → maison + trait H.** CoT : la pièce close (toit + cloison).
- **kate (noir) → chevron + croix.** CoT : densité maximale, entrecroisé sombre.
- **nave (gravure) → bandes + croix.** CoT : les traits gravés entrecroisés.
- **taku (sombre) → chevron inversé + croix.** CoT : variante d'obscurité, dense.
- **pisu (petit) → point.** CoT : le plus petit signe = le point.

### Groupe — états/conjugateurs/fin {accompli, clair, passé-myth, honteux, regret, sombre, jamais, profond, sommeil, route, enterrer, ennemi, ancêtre, toxine, poison, bois-mat, pied, blanc}
- **il (accompli) → tick + jambe.** CoT : l'action achevée (coche) marquée.
- **tame (clair) → losange + tiret haut.** CoT : la facette qui brille, la clarté.
- **amat (passé-myth) → chevron inversé + chevron.** CoT : le passé profond/mythique, double repli.
- **paka (honteux) → cœur + jambe.** CoT : le cœur qui se baisse = la honte.
- **aan (passé-regret) → cœur + base.** CoT : le cœur lourd, posé, du regret.
- **kumu (sombre) → chevron inversé + facette.** CoT : l'obscurité penchée.
- **zom (jamais) → croix + tick.** CoT : la négation absolue, catégorique.
- **vuku (profond) → flèche bas + point.** CoT : ce qui descend tout au fond.
- **sopi (sommeil) → demi-cercle + chevron.** CoT : l'œil clos, le repos courbe.
- **teki (route) → base + chevron.** CoT : le chemin (ligne) qui franchit un relief.
- **tumi (enterrer) → flèche bas + base.** CoT : descendre / mettre en terre.
- **zoka (ennemi) → main + chevron inversé.** CoT : la main opposée/hostile.
- **aita (ancêtre) → figure + jambe.** CoT : l'aïeul, la figure-souche.
- **mavi (toxine) → goutte + croix.** CoT : la goutte marquée du danger.
- **poku (poison) → goutte + chevron inversé.** CoT : la goutte qui abat (descend).
- **vito (bois-matériau) → barre + facette.** CoT : la planche/le madrier débité.
- **peki (pied) → demi-cercle + jambe.** CoT : la voûte plantaire posée.
- **pabe (blanc) → anneau + main.** CoT : le cercle ouvert/vide = l'absence de marque.

### Groupe — {nuage, esprit}
- **nubu (nuage) → demi-cercle + point.** CoT : la bouffée arrondie du nuage + une goutte (la pluie en germe).
- **puli (esprit) → flamme.** CoT : l'esprit/souffle = la flamme vacillante, immatérielle.

### Groupe — {village, lieu}
- **lake (village) → maison + point.** CoT : groupe d'habitations (maison) + le foyer central (point) ; la maison seule étant prise.
- **loku (lieu) → carré + barre verticale.** CoT : aire délimitée (carré) marquée d'un repère ; le carré pur = `no` (locatif).

### Groupe — {os, loi}
- **kibe (os) → jambe + point.** CoT : le segment osseux (« jambe ») + l'articulation (point).
- **leku (loi) → carré + plus.** CoT : la loi = le cadre (carré) qui ordonne (la croix d'équilibre +) ; la table de la loi.

### Groupe — {poisson, navire, doux} (suite)
- **melu (doux) → demi-cercle + base (dôme posé) ⌢_.** Le doux, c'est la rondeur sans angle. CoT : 1er choix vague → pris par `ura` (eau) ; goutte → `kina` (sang) ; cœur → `tani` (vallée) ; cœur+point → `kori` (cœur). Tout le « rond » iconique est pris → dôme arrondi posé sur une base = surface lisse/douce, distincte.
