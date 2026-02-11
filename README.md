# WiseMama

Application web privee pour apprendre le chinois a une enfant francophone.

## Demarrage rapide

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichee par Vite.

## Fonctionnalites implementees

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
