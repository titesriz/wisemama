import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const modeStorageKey = 'wisemama-active-mode-v1';

const ModeContext = createContext(null);

export function ModeProvider({ children }) {
  const [mode, setMode] = useState('child');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(modeStorageKey);
      if (stored === 'child' || stored === 'parent') {
        setMode(stored);
      }
    } catch {
      setMode('child');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(modeStorageKey, mode);
    } catch {
      // no-op
    }
    document.documentElement.setAttribute('data-mode', mode);
    document.body.setAttribute('data-mode', mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isChildMode: mode === 'child',
      isParentMode: mode === 'parent',
      switchToChild: () => setMode('child'),
      switchToParent: () => setMode('parent'),
    }),
    [mode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used inside ModeProvider');
  }
  return ctx;
}
