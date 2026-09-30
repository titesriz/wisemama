import { useMemo } from 'react';
import ModuleFrame from './ModuleFrame.jsx';
import CharacterGlossChar from './CharacterGlossChar.jsx';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import { getCharacter } from '../utils/database/characterDB.js';
import '../styles/hsk-deck.css';

export default function LessonVocabWordPage({
  profile,
  lessonId,
  lessonTitle,
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
    return <p className="empty">Aucun mot de vocabulaire disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonId={lessonId}
      lessonTitle={lessonTitle}
      card={word}
      cardIndex={wordIndex}
      totalCards={totalWords}
      activeModule="flashcards"
      modes={['flashcards', 'writing', 'quiz']}
      onBack={onBack}
      onPrev={onPrev}
      onNext={onNext}
      onSwitchModule={onSwitchModule}
      onOpenPicker={onOpenPicker}
    >
      <div className="module-card-center wm-enter-fade">
        <div className="module-card-type-badge">
          {isCompound ? 'Vocabulaire' : 'Caractère'}
        </div>
        <div className="module-hanzi-large">
          {isCompound
            ? characters.map((char, index) => (
                <CharacterGlossChar
                  key={`${char}-${index}`}
                  char={char}
                  entry={getCharacter(char)}
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
