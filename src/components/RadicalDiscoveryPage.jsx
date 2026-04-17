import { useMemo, useState } from 'react';
import { buildLessonRadicals } from '../lib/lessonRadicals.js';
import { formatPinyinDisplay } from '../lib/pinyinDisplay.js';
import '../styles/radical-discovery.css';

const ETYMOLOGY_TYPE_LABEL = {
  pictophonetic: 'Pictophonétique',
  ideographic: 'Idéographique',
  pictographic: 'Pictographique',
  semantic: 'Sémantique',
};

export default function RadicalDiscoveryPage({ lesson, onBack }) {
  const [selectedRadical, setSelectedRadical] = useState(null);

  const radicals = useMemo(() => buildLessonRadicals(lesson), [lesson]);

  if (!radicals.length) {
    return (
      <section className="radical-discovery-page">
        <header className="radical-discovery-header">
          <button type="button" className="radical-back-btn ui-pressable" onClick={onBack}>
            ← Retour
          </button>
          <h1>Radicaux</h1>
        </header>
        <p className="radical-empty">Aucun radical trouvé pour cette leçon.</p>
      </section>
    );
  }

  if (selectedRadical) {
    const entry = radicals.find((r) => r.hanzi === selectedRadical);
    if (!entry) {
      setSelectedRadical(null);
      return null;
    }

    return (
      <section className="radical-discovery-page">
        <header className="radical-discovery-header">
          <button
            type="button"
            className="radical-back-btn ui-pressable"
            onClick={() => setSelectedRadical(null)}
          >
            ← Radicaux
          </button>
          <h1>Détail du radical</h1>
        </header>

        <div className="radical-detail-shell">
          <div className="radical-detail-hero">
            <div className="radical-detail-hanzi">{entry.hanzi}</div>
            {entry.pinyin ? (
              <div className="radical-detail-pinyin">{formatPinyinDisplay(entry.pinyin)}</div>
            ) : null}
            <div className="radical-detail-meanings">
              {entry.french ? <span className="radical-meaning-fr">{entry.french}</span> : null}
              {entry.english && entry.english !== entry.french ? (
                <span className="radical-meaning-en">{entry.english}</span>
              ) : null}
            </div>
            {entry.strokeCount ? (
              <div className="radical-detail-strokes">{entry.strokeCount} trait{entry.strokeCount > 1 ? 's' : ''}</div>
            ) : null}
          </div>

          {entry.etymologyHint ? (
            <div className="radical-detail-hint">
              <span className="radical-hint-icon">💡</span>
              <p>{entry.etymologyHint}</p>
            </div>
          ) : null}

          {entry.etymologyType && ETYMOLOGY_TYPE_LABEL[entry.etymologyType] ? (
            <div className="radical-detail-type">
              Type : <strong>{ETYMOLOGY_TYPE_LABEL[entry.etymologyType]}</strong>
            </div>
          ) : null}

          {entry.positions.length > 0 ? (
            <div className="radical-detail-position">
              Position dans les caractères :{' '}
              <strong>{entry.positions.join(', ')}</strong>
            </div>
          ) : null}

          <div className="radical-detail-chars-section">
            <h2>Caractères de la leçon</h2>
            <div className="radical-detail-chars-grid">
              {entry.cards.map((card) => (
                <div key={card.id} className="radical-char-chip">
                  <span className="radical-char-hanzi">{card.hanzi}</span>
                  {card.french ? (
                    <span className="radical-char-fr">{card.french}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="radical-discovery-page">
      <header className="radical-discovery-header">
        <button type="button" className="radical-back-btn ui-pressable" onClick={onBack}>
          ← Retour
        </button>
        <div className="radical-discovery-header-text">
          <h1>🧩 Radicaux</h1>
          <p>Les petites parties des caractères</p>
        </div>
      </header>

      <div className="radical-grid-shell">
        <div className="radical-grid">
          {radicals.map((entry) => (
            <button
              key={entry.hanzi}
              type="button"
              className="radical-grid-card ui-pressable"
              onClick={() => setSelectedRadical(entry.hanzi)}
            >
              <span className="radical-grid-hanzi">{entry.hanzi}</span>
              <span className="radical-grid-fr">{entry.french || entry.english || '—'}</span>
              <span className="radical-grid-count">{entry.cards.length} car.</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
