# WiseMama

Application web privee pour apprendre le chinois a une enfant francophone.

## Demarrage rapide

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichee par Vite.

## Fonctionnalites implementees

- Mode global persistant Parent/Enfant
- Avatar DiceBear persistant pour basculer de mode
- Editeur avatar (parent) avec apercu en direct, randomisation, sauvegarde
- Protection enfant: maintien long pour ouvrir le mode parent
- Theme dynamique selon le mode (enfant playful, parent neutre)
- Flashcards avec caractere chinois, pinyin, francais (principal) et anglais (secondaire)
- Lecons en JSON (`src/data/lessons.json`)
- Atelier d'ecriture avec Hanzi Writer (ordre des traits + quiz)
- Etoiles par carte et progression de lecon
- Atelier audio Parent/Enfant par carte
- Sauvegarde locale:
  - progression: `localStorage`
  - enregistrements audio: `IndexedDB`

## Atelier audio (Phase 3)

- `Mode Parent`: enregistrer puis sauvegarder un modele audio
- `Mode Enfant`: enregistrer une tentative, ecouter modele + tentative cote a cote
- Validation locale simple (score base sur proximite de duree)
- Bouton `Je garde cette version` pour sauvegarder dans `Mes enregistrements`
- Historique conserve par carte (IndexedDB)

## Navigation des modes

- Avatar en haut a droite toujours visible
- Enfant vers Parent: maintenir l'avatar environ 1 seconde
- Parent vers Enfant: tap simple sur l'avatar
- Le mode actif est memorise entre rechargements

## Editeur avatar

- Accessible en `Mode Parent`, bloc `Creation avatar`
- Edition separee de l'avatar `Enfant` et `Parent`
- Apercu instantane (DiceBear SVG) pendant les changements
- `Randomiser` prepare un nouvel avatar, `Sauvegarder` l'applique partout
- L'avatar persiste via `localStorage` (cle `wisemama-avatar-config-v1`)

Architecture avatar:
- `src/context/AvatarContext.jsx`: etat global + persistence + hook backend-ready (`syncToBackend`, `syncFromBackend`)
- `src/components/AvatarRenderer.jsx`: rendu SVG DiceBear a partir de config
- `src/components/AvatarEditor.jsx`: interface d'edition tactile
- `src/lib/avatarConfig.js`: defaults, sanitation, randomisation, generation URL

## Structure des donnees

Les lecons sont stockees dans `src/data/lessons.json`.

Exemple de carte:

```json
{
  "id": "mao",
  "hanzi": "猫",
  "pinyin": "māo",
  "french": "chat",
  "english": "cat",
  "imageUrl": "/images/chat.svg",
  "audioUrl": null
}
```

## Test rapide (audio)

1. Ouvrir une carte puis passer en `Mode Parent`.
2. Cliquer `Enregistrer parent`, puis `Arreter parent`, puis `Sauvegarder modele`.
3. Passer en `Mode Enfant`.
4. Cliquer `Enregistrer enfant`, puis `Arreter enfant`.
5. Ecouter modele + tentative, puis cliquer `Je garde cette version`.
6. Verifier que la tentative apparait dans `Mes enregistrements`.
7. Recharger la page et verifier que les enregistrements sont conserves.

## Notes techniques

- Stack: React + Vite
- Traces caracteres: `hanzi-writer`
- Enregistrement audio: `MediaRecorder` + `getUserMedia`
- Stockage audio local: `IndexedDB`
- App 100% client-side
