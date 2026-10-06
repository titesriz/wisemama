import '../styles/choice-hub.css';

export default function ChoiceHubPage({ title, subtitle, choices = [], onBack, shellHeader = false }) {
  return (
    <section className="hub-page">
      <header className="hub-header">
        {shellHeader ? null : (
          <div className="hub-header-top-row">
            <button type="button" className="hub-logo-btn ui-pressable" onClick={onBack} aria-label="Retour">
              文
            </button>
            <button type="button" className="hub-back-btn ui-pressable" onClick={onBack}>
              ← Retour
            </button>
          </div>
        )}
        <div className="hub-header-text">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>

      <div className="hub-choice-list">
        {choices.map((choice) => (
          <button
            key={choice.key}
            type="button"
            className="hub-choice-btn ui-pressable"
            onClick={choice.onSelect}
            disabled={choice.disabled}
          >
            <span className="hub-choice-title">{choice.label}</span>
            {choice.description ? <span className="hub-choice-desc">{choice.description}</span> : null}
            {choice.disabled ? <span className="hub-choice-soon">Bientôt</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
