# GJM AUTO – Règles des publications Facebook et Instagram

Publication via le connecteur **Metricool** (marque `1263073`, Facebook = page GJM AUTO, Instagram = @gjmauto, fuseau `Europe/Berlin` = heure de Paris).
Mode : **tout automatique** (pas de validation avant programmation, `autoPublish: true`, jamais de brouillon, jamais de boost ni de dépense).

## Rythme
- 2 publications par semaine : **lundi et jeudi à 18h30** (heure de Paris).
- Chaque publication part **sur Facebook et sur Instagram** (2 posts Metricool séparés : un `facebook` avec le visuel `-fb.jpg`, un `instagram` avec le visuel `-ig.jpg`).
- Les publications jusqu'au **7 décembre 2026** ont été programmées directement dans Meta (invisibles dans Metricool) : ne rien programmer avant le 10 décembre 2026.

## Contenu
- Thèmes variés : entretien, mécanique, conseils, prévention, saison, prestations (diagnostic électronique, reprogrammation moteur, climatisation, pneus, freinage, distribution, contrôle technique, révision…).
- **Jamais** de tarifs, promotions, remises, disponibilités ou délais inventés. Pas de faux avis, pas de chiffres non vérifiables.
- Ton : direct, honnête, pédagogique (« on vous dit franchement ce qu'il faut faire »). Vouvoiement.
- Ne pas répéter un thème déjà utilisé dans les 2 derniers mois (voir `historique.md`).
- Garage toutes marques : essence, diesel, hybride. Devis clair avant chaque intervention, rien n'est fait sans l'accord du client, garantie constructeur conservée.

## Texte (même corps sur les deux réseaux)
```
<emoji> <Accroche>

<2 phrases max d'explication>
• <point 1>
• <point 2>
• <point 3>

<1 phrase de conclusion>

📍 52 rue Alphonse Daudet, Saint-Seurin-sur-l'Isle
🕘 Du mardi au vendredi, 9h30 – 16h30, sur rendez-vous
📞 05 57 41 07 87 · 🌐 Rendez-vous en ligne : gjmauto.fr          ← Facebook
📞 05 57 41 07 87 · 🌐 Rendez-vous en ligne : lien en bio         ← Instagram
```
- Facebook : ligne de hashtags `#GJMAUTO #GarageAuto #SaintSeurinSurLIsle #Gironde`.
- Instagram : les mêmes + 2 hashtags liés au thème (ex. `#Batterie #EntretienAuto`).

## Visuels
- Générer avec `node tools/make-social.js <spec.json> social/<AAAA-MM>/` (Playwright déjà installé ; logo et police dans `brand/`).
- `title` = 2 lignes courtes (ligne 1 blanche, ligne 2 en `<b>` jaune) ; `titleIg` = même titre coupé en 3 lignes plus courtes.
- `kick` = surtitre court (2–3 mots). `lines` = 3 puces de 5 à 7 mots.
- Vérifier chaque image (Read) avant publication : aucun texte coupé ou qui déborde.
- Pousser les images sur `main`, puis utiliser l'URL publique :
  `https://raw.githubusercontent.com/GregoryFx/gjm-media/main/social/<AAAA-MM>/<slug>-fb.jpg` (et `-ig.jpg`).
  Vérifier que l'URL répond avant de programmer.

## Après programmation
- Ajouter chaque publication à `historique.md` (date, thème, slug).
- Contrôler avec `getScheduledPosts` que tout est bien programmé.
