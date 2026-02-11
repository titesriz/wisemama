import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  defaultAvatarConfig,
  randomAvatarConfig,
  sanitizeAvatarConfig,
} from '../lib/avatarConfig.js';

const avatarStorageKey = 'wisemama-avatar-config-v1';

const AvatarContext = createContext(null);

function normalizePayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      child: defaultAvatarConfig('child'),
      parent: defaultAvatarConfig('parent'),
    };
  }

  return {
    child: sanitizeAvatarConfig(raw.child, 'child'),
    parent: sanitizeAvatarConfig(raw.parent, 'parent'),
  };
}

export function AvatarProvider({ children }) {
  const [avatarsByMode, setAvatarsByMode] = useState(() => ({
    child: defaultAvatarConfig('child'),
    parent: defaultAvatarConfig('parent'),
  }));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(avatarStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setAvatarsByMode(normalizePayload(parsed.avatarsByMode || parsed));
    } catch {
      setAvatarsByMode({
        child: defaultAvatarConfig('child'),
        parent: defaultAvatarConfig('parent'),
      });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(avatarStorageKey, JSON.stringify({ avatarsByMode }));
    } catch {
      // no-op
    }
  }, [avatarsByMode]);

  const updateAvatar = (mode, configPatch) => {
    setAvatarsByMode((prev) => {
      const current = prev[mode] || defaultAvatarConfig(mode);
      return {
        ...prev,
        [mode]: sanitizeAvatarConfig({ ...current, ...configPatch }, mode),
      };
    });
  };

  const setAvatar = (mode, fullConfig) => {
    setAvatarsByMode((prev) => ({
      ...prev,
      [mode]: sanitizeAvatarConfig(fullConfig, mode),
    }));
  };

  const randomizeAvatar = (mode) => {
    setAvatarsByMode((prev) => ({
      ...prev,
      [mode]: randomAvatarConfig(mode),
    }));
  };

  const value = useMemo(
    () => ({
      avatarsByMode,
      getAvatarByMode: (mode) => avatarsByMode[mode] || defaultAvatarConfig(mode),
      updateAvatar,
      setAvatar,
      randomizeAvatar,
      // Backend sync hooks: ready for future login-based persistence.
      syncFromBackend: async () => {},
      syncToBackend: async () => {},
    }),
    [avatarsByMode],
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error('useAvatar must be used inside AvatarProvider');
  }
  return ctx;
}
