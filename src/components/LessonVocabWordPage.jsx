import ModuleFrame from './ModuleFrame.jsx';
import CharacterGlossChar from './CharacterGlossChar.jsx';
import { getCharacter } from '../utils/database/characterDB.js';
import '../styles/hsk-deck.css';

function renderCompoundHanzi(currentWord) {
  const characters = Array.from(currentWord?.hanzi || '');
  if (characters.length < 2) return null;
  return characters.map((char, index) => (
    <CharacterGlossChar key={`${char}-${index}`} char={char} entry={getCharacter(char)} trigger="click" />
  ));
}

function renderCompoundHint(currentWord) {
  return Array.from(currentWord?.hanzi || '').length > 1
    ? <p className="hsk-gloss-hint">Touche un caractere pour voir son sens</p>
    : null;
}

export default function LessonVocabWordPage({
  profile,
  lessonId,
  lessonTitle,
  words,
  word,
  onBack,
  onGoHome,
  onSwitchModule,
  onOpenPicker,
  onOpenAvatarEditor,
  shellHeader = false,
}) {
  if (!word) {
    return <p className="empty">Aucun mot de vocabulaire disponible.</p>;
  }

  return (
    <ModuleFrame
      shellHeader={shellHeader}
      profile={profile}
      lessonId={lessonId}
      lessonTitle={lessonTitle}
      modeLabel="Fiche"
      words={words}
      selectedId={word.id}
      singleLabel="Caractère"
      compoundLabel="Vocabulaire"
      hanziContent={renderCompoundHanzi}
      hanziHint={renderCompoundHint}
      modes={['flashcards', 'writing', 'quiz']}
      onBack={onBack}
      onGoHome={onGoHome}
      onSwitchModule={onSwitchModule}
      onOpenPicker={onOpenPicker}
      onOpenAvatarEditor={onOpenAvatarEditor}
    />
  );
}
