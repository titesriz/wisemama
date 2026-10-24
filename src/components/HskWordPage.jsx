import ModuleFrame from './ModuleFrame.jsx';
import CharacterGlossChar from './CharacterGlossChar.jsx';
import hskWords from '../data/hsk1-words.json';
import { getCharacter } from '../utils/database/characterDB.js';
import '../styles/hsk-deck.css';

const hskWordByHanzi = new Map(hskWords.map((entry) => [entry.hanzi, entry]));

// Shared character dictionary (character-database.json, seeded with HSK1's
// single characters by scripts/build-hsk1-deck.mjs) takes priority over the
// local HSK word list, since it's the more comprehensive source - it carries
// radical/decomposition/etymology too, and stays in sync with lesson-authored
// characters. Falls back to the local list only if a character is somehow
// missing from the shared database.
function lookupCharacterGloss(char) {
  return getCharacter(char) || hskWordByHanzi.get(char) || null;
}

function renderCompoundHanzi(currentWord) {
  const characters = Array.from(currentWord?.hanzi || '');
  if (characters.length < 2) return null;
  return characters.map((char, index) => (
    <CharacterGlossChar key={`${char}-${index}`} char={char} entry={lookupCharacterGloss(char)} trigger="click" />
  ));
}

function renderCompoundHint(currentWord) {
  return Array.from(currentWord?.hanzi || '').length > 1
    ? <p className="hsk-gloss-hint">Touche un caractere pour voir son sens</p>
    : null;
}

export default function HskWordPage({
  profile,
  words,
  word,
  onBack,
  onGoHome,
  onSwitchModule,
  onOpenPicker,
  shellHeader = false,
}) {
  const deck = words || hskWords;

  if (!word) {
    return <p className="empty">Aucun mot disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle="HSK1"
      words={deck}
      selectedId={word.id}
      singleLabel="Caractère"
      compoundLabel="Mot"
      hanziContent={renderCompoundHanzi}
      hanziHint={renderCompoundHint}
      activeModule="flashcards"
      modes={['flashcards', 'writing', 'quiz']}
      onBack={onBack}
      onGoHome={onGoHome}
      onSwitchModule={onSwitchModule}
      onOpenPicker={onOpenPicker}
      shellHeader={shellHeader}
    />
  );
}
