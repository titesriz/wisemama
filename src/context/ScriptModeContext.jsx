import { createContext, useCallback, useContext, useState } from 'react';
import { getScriptMode, setScriptMode as persistScriptMode, toTraditionalText } from '../lib/traditionalForm.js';

const ScriptModeContext = createContext(null);

export function ScriptModeProvider({ children }) {
  const [mode, setModeState] = useState(() => getScriptMode());

  const setMode = useCallback((next) => {
    const value = next === 'traditional' ? 'traditional' : 'simplified';
    setModeState(value);
    persistScriptMode(value);
  }, []);

  const convert = useCallback(
    (text) => (mode === 'traditional' ? toTraditionalText(text) : text),
    [mode],
  );

  return (
    <ScriptModeContext.Provider value={{ mode, setMode, convert }}>
      {children}
    </ScriptModeContext.Provider>
  );
}

export function useScriptMode() {
  const ctx = useContext(ScriptModeContext);
  if (!ctx) {
    throw new Error('useScriptMode must be used inside ScriptModeProvider');
  }
  return ctx;
}
