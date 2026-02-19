import { useState } from 'react';
import SuccessBurst from '../../src/components/SuccessBurst.jsx';
import { useUiSounds } from '../../src/hooks/useUiSounds.js';

export function InteractionButton({ children, onClick }) {
  const sounds = useUiSounds();
  return (
    <button
      type="button"
      className="button ui-pressable"
      onClick={() => {
        sounds.playTap();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function SuccessBanner({ message }) {
  const [tick, setTick] = useState(0);
  const sounds = useUiSounds();

  const showSuccess = () => {
    setTick((prev) => prev + 1);
    sounds.playSuccess();
  };

  return (
    <div>
      <button type="button" className="button ui-pressable" onClick={showSuccess}>
        Trigger success
      </button>
      <p className="ok-line wm-ok-line wm-success-pulse">
        {message}
        <SuccessBurst trigger={tick} />
      </p>
    </div>
  );
}
