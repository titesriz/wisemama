import '../styles/persistent-footer-nav.css';

const BUTTONS = [
  { key: 'lessons', label: 'Leçon' },
  { key: 'vocabulary', label: 'Vocabulaire' },
  { key: 'writing', label: 'Écriture' },
  { key: 'test', label: 'Évaluation' },
];

export default function PersistentFooterNav({
  active = '',
  onOpenLessonsHub,
  onOpenVocabularyHub,
  onOpenWritingHub,
  onOpenTestHub,
}) {
  const handlers = {
    lessons: onOpenLessonsHub,
    vocabulary: onOpenVocabularyHub,
    writing: onOpenWritingHub,
    test: onOpenTestHub,
  };

  return (
    <nav className="persistent-footer-nav" aria-label="Navigation principale">
      {BUTTONS.map((button) => (
        <button
          key={button.key}
          type="button"
          className={`persistent-footer-btn ui-pressable ${active === button.key ? 'active' : ''}`}
          onClick={() => handlers[button.key]?.()}
        >
          {button.label}
        </button>
      ))}
    </nav>
  );
}
