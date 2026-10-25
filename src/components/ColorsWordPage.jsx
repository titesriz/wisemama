import ModuleFrame from './ModuleFrame.jsx';
import colorsWords from '../data/colors-words.json';
import '../styles/colors-deck.css';

function renderSwatch(currentWord) {
  if (!currentWord?.colorHex) return null;
  return <div className="color-swatch" style={{ background: currentWord.colorHex }} aria-hidden="true" />;
}

export default function ColorsWordPage({
  profile,
  words,
  word,
  onBack,
  onGoHome,
  onSwitchModule,
  shellHeader = false,
}) {
  const deck = words || colorsWords;

  if (!word) {
    return <p className="empty">Aucune couleur disponible.</p>;
  }

  return (
    <ModuleFrame
      profile={profile}
      lessonTitle="Couleurs"
      words={deck}
      selectedId={word.id}
      singleLabel="Couleur"
      beforeHanzi={renderSwatch}
      modes={['flashcards', 'writing', 'dictée', 'quiz']}
      onBack={onBack}
      onGoHome={onGoHome}
      onSwitchModule={onSwitchModule}
      shellHeader={shellHeader}
    />
  );
}
