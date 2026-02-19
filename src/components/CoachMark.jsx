import { useEffect, useMemo, useState } from 'react';

function getTooltipPosition(rect, width = 320) {
  if (!rect) return { top: 80, left: 24 };
  const margin = 12;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, viewportW - width - margin));

  const preferBelow = rect.bottom + 16 + 160 < viewportH;
  const top = preferBelow ? rect.bottom + 12 : Math.max(margin, rect.top - 170);
  return { top, left };
}

export default function CoachMark({
  open,
  stepIndex,
  totalSteps,
  title,
  description,
  selector,
  onPrev,
  onNext,
  onSkip,
}) {
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!open || !selector) return undefined;

    const update = () => {
      const target = document.querySelector(selector);
      if (!target) {
        setTargetRect(null);
        return;
      }
      setTargetRect(target.getBoundingClientRect());
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const timer = setInterval(update, 180);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, selector]);

  const tooltipPos = useMemo(() => getTooltipPosition(targetRect), [targetRect]);
  if (!open) return null;

  return (
    <div className="coach-overlay" role="dialog" aria-modal="true" aria-label="Tutoriel">
      {targetRect ? (
        <div
          className="coach-highlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : null}

      <div className="coach-tooltip" style={{ top: tooltipPos.top, left: tooltipPos.left }}>
        <div className="coach-step">Etape {stepIndex + 1}/{totalSteps}</div>
        <h4>{title}</h4>
        <p>{description}</p>
        {!targetRect ? <small>Chargement de la zone cible...</small> : null}
        <div className="coach-actions">
          <button type="button" className="wm-btn wm-btn-ghost" onClick={onSkip}>
            Passer
          </button>
          <button type="button" className="wm-btn wm-btn-secondary" onClick={onPrev} disabled={stepIndex === 0}>
            Retour
          </button>
          <button type="button" className="wm-btn wm-btn-primary" onClick={onNext}>
            {stepIndex === totalSteps - 1 ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}

