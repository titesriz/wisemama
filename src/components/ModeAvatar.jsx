import { useEffect, useRef, useState } from 'react';
import { useMode } from '../context/ModeContext.jsx';
import { useAvatar } from '../context/AvatarContext.jsx';
import AvatarRenderer from './AvatarRenderer.jsx';

const holdDurationMs = 900;

export default function ModeAvatar() {
  const { mode, isChildMode, switchToChild, switchToParent } = useMode();
  const { getAvatarByMode } = useAvatar();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const startedAtRef = useRef(0);

  const avatarConfig = getAvatarByMode(mode);

  const clearTimers = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const startHold = () => {
    if (!isChildMode) return;

    clearTimers();
    setIsHolding(true);
    setHoldProgress(0);
    startedAtRef.current = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const progress = Math.min(1, elapsed / holdDurationMs);
      setHoldProgress(progress);
    }, 30);

    holdTimerRef.current = setTimeout(() => {
      clearTimers();
      setIsHolding(false);
      setHoldProgress(1);
      switchToParent();
    }, holdDurationMs);
  };

  const stopHold = () => {
    if (!isChildMode) return;
    clearTimers();
    setIsHolding(false);
    setHoldProgress(0);
  };

  const handleClick = () => {
    if (!isChildMode) {
      switchToChild();
    }
  };

  const progressDeg = Math.round(holdProgress * 360);

  return (
    <button
      type="button"
      className={`mode-avatar ${mode}`}
      aria-label={isChildMode ? 'Maintenir pour ouvrir le mode parent' : 'Retourner en mode enfant'}
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onClick={handleClick}
    >
      <AvatarRenderer config={avatarConfig} size={38} alt="Avatar profil" className="mode-avatar-img" />
      <span className="avatar-text">{isChildMode ? 'Enfant' : 'Parent'}</span>
      {isChildMode ? (
        <span className="avatar-hint">Maintenir pour Parent</span>
      ) : (
        <span className="avatar-hint">Tap pour Enfant</span>
      )}
      {isChildMode ? (
        <span
          className="hold-ring"
          style={{
            background: `conic-gradient(var(--accent-orange) ${progressDeg}deg, rgba(255,255,255,0.2) ${progressDeg}deg)`,
            opacity: isHolding || holdProgress > 0 ? 1 : 0,
          }}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
