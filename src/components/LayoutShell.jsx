import '../styles/layout-core.css';

export default function LayoutShell({
  headerLeft,
  headerTitle,
  headerSubtitle,
  headerCenter,
  headerRight,
  children,
  actionLeft,
  actionCenter,
  actionRight,
  prevLabel = 'Precedent',
  nextLabel = 'Suivant',
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
}) {
  const leftNode = actionLeft ?? (
    <button
      type="button"
      className="wm-btn wm-btn-secondary"
      onClick={onPrev}
      disabled={prevDisabled || !onPrev}
    >
      {prevLabel}
    </button>
  );

  const rightNode = actionRight ?? (
    <button
      type="button"
      className="wm-btn wm-btn-primary"
      onClick={onNext}
      disabled={nextDisabled || !onNext}
    >
      {nextLabel}
    </button>
  );

  const centerNode = actionCenter ?? null;

  return (
    <div className="wm-app-shell">
      <header className="wm-header">
        <div className="wm-header-left">{headerLeft}</div>
        <div className="wm-header-center">
          {headerCenter || (
            <>
              {headerTitle ? <h1 className="wm-header-title">{headerTitle}</h1> : null}
              {headerSubtitle ? <p className="wm-header-subtitle">{headerSubtitle}</p> : null}
            </>
          )}
        </div>
        <div className="wm-header-right">{headerRight}</div>
      </header>

      <main className="wm-content">
        <div className="wm-content-inner">{children}</div>
      </main>

      <footer className="wm-action-bar">
        <div className="wm-action-left">{leftNode}</div>
        <div className="wm-action-center">{centerNode}</div>
        <div className="wm-action-right">{rightNode}</div>
      </footer>
    </div>
  );
}
