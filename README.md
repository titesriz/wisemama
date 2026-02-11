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
- Atelier d'ecriture avec Hanzi Writer
- Animation de l'ordre des traits
- Quiz de trace avec validation
- Etoiles par carte et progression de lecon
- Sauvegarde locale via `localStorage`

## Structure des donnees

Les lecons sont stockees dans `src/data/lessons.json`.

Exemple de carte :

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

## Test rapide Phase 2

1. Ouvrir une carte puis cliquer `Voir les traits`.
2. Cliquer `Tracer` et dessiner le caractere avec souris ou stylet.
3. Verifier que le message de feedback change selon les erreurs.
4. Verifier que les etoiles se mettent a jour pour la carte.
5. Recharger la page et verifier que la progression est conservee.

## Notes techniques

- Stack: React + Vite
- Bibliotheque de trace: `hanzi-writer`
- App 100% client-side

## Prochaines etapes suggerees

1. Ajouter audio reel (fichiers `.mp3` par carte)
2. Ajouter option visuelle des tons en couleur
3. Ajouter mini-interface d'edition de lecons dans l'app
