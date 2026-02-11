import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  defaultAvatarConfig,
  randomAvatarConfig,
  sanitizeAvatarConfig,
} from '../lib/avatarConfig.js';

const avatarStorageKey = 'wisemama-avatar-config-v1';
const defaultNamesByMode = {
  child: '',
  parent: '',
};

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

function normalizeNames(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultNamesByMode };
  }

  return {
    child: typeof raw.child === 'string' ? raw.child : '',
    parent: typeof raw.parent === 'string' ? raw.parent : '',
  };
}

export function AvatarProvider({ children }) {
  const [avatarsByMode, setAvatarsByMode] = useState(() => ({
    child: defaultAvatarConfig('child'),
    parent: defaultAvatarConfig('parent'),
  }));
  const [namesByMode, setNamesByMode] = useState(defaultNamesByMode);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(avatarStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setAvatarsByMode(normalizePayload(parsed.avatarsByMode || parsed));
      setNamesByMode(normalizeNames(parsed.namesByMode));
    } catch {
      setAvatarsByMode({
        child: defaultAvatarConfig('child'),
        parent: defaultAvatarConfig('parent'),
      });
      setNamesByMode(defaultNamesByMode);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(avatarStorageKey, JSON.stringify({ avatarsByMode, namesByMode }));
    } catch {
      // no-op
    }
  }, [avatarsByMode, namesByMode]);

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

  const setName = (mode, value) => {
    const safeValue = typeof value === 'string' ? value.slice(0, 30) : '';
    setNamesByMode((prev) => ({
      ...prev,
      [mode]: safeValue,
    }));
  };

  const value = useMemo(
    () => ({
      avatarsByMode,
      namesByMode,
      getAvatarByMode: (mode) => avatarsByMode[mode] || defaultAvatarConfig(mode),
      getNameByMode: (mode) => namesByMode[mode] || '',
      updateAvatar,
      setAvatar,
      randomizeAvatar,
      setName,
      // Backend sync hooks: ready for future login-based persistence.
      syncFromBackend: async () => {},
      syncToBackend: async () => {},
    }),
    [avatarsByMode, namesByMode],
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
