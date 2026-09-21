import { useMemo } from 'react';
import ModuleFrame from './ModuleFrame.jsx';
import CharacterGlossChar from './CharacterGlossChar.jsx';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { getCharacter } from '../utils/database/characterDB.js';
import hskWords from '../data/hsk1-words.json';
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

export default function HskWordPage({
  profile,
  word,
  wordIndex,
  totalWords,
  onPrev,
  onNext,
  onBack,
  onSwitchModule,
  onOpenPicker,
}) {
  const characters = useMemo(() => Array.from(word?.hanzi || ''), [word?.hanzi]);
  const isCompound = characters.length > 1;

  if (!word) {
    return <p className="empty">Aucun mot disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle="HSK1"
      card={word}
      cardIndex={wordIndex}
      totalCards={totalWords}
      activeModule="flashcards"
      modes={['flashcards', 'writing']}
      onBack={onBack}
      onPrev={onPrev}
      onNext={onNext}
      onSwitchModule={onSwitchModule}
      onOpenPicker={onOpenPicker}
    >
      <div className="module-card-center wm-enter-fade">
        <div className="module-hanzi-large">
          {isCompound
            ? characters.map((char, index) => (
                <CharacterGlossChar
                  key={`${char}-${index}`}
                  char={char}
                  entry={lookupCharacterGloss(char)}
                  trigger="click"
                />
              ))
            : word.hanzi}
        </div>
        {isCompound ? <p className="hsk-gloss-hint">Touche un caractere pour voir son sens</p> : null}
        <div className="module-pinyin-large">{formatPinyinDisplay(word.pinyin || '')}</div>

        <div className="module-translation-panels">
          <article>
            <strong>Francais</strong>
            <span>{word.french || 'Traduction a venir'}</span>
          </article>
          <article>
            <strong>Anglais</strong>
            <span>{word.english}</span>
          </article>
        </div>
      </div>
    </ModuleFrame>
  );
}
