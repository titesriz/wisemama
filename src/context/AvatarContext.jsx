import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  defaultAvatarConfig,
  randomAvatarConfig,
  sanitizeAvatarConfig,
} from '../lib/avatarConfig.js';

const avatarStorageKey = 'wisemama-avatar-config-v1';

const AvatarContext = createContext(null);

function randomId(prefix = 'profile') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRole(role) {
  return role === 'parent' ? 'parent' : 'child';
}

function createDefaultProfiles() {
  return [
    {
      id: 'child-default',
      name: 'Enfant',
      role: 'child',
      avatar: defaultAvatarConfig('child'),
    },
    {
      id: 'parent-default',
      name: 'Parent',
      role: 'parent',
      avatar: defaultAvatarConfig('parent'),
    },
  ];
}

function normalizeProfiles(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return createDefaultProfiles();
  }

  const seen = new Set();
  const profiles = raw
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const role = normalizeRole(item.role);
      const baseId = typeof item.id === 'string' && item.id ? item.id : `${role}-${index}`;
      const id = seen.has(baseId) ? `${baseId}-${index}` : baseId;
      seen.add(id);
      return {
        id,
        name:
          typeof item.name === 'string' && item.name.trim()
            ? item.name.slice(0, 30)
            : role === 'parent'
              ? 'Parent'
              : 'Enfant',
        role,
        avatar: sanitizeAvatarConfig(item.avatar, role),
      };
    });

  return profiles.length > 0 ? profiles : createDefaultProfiles();
}

function migrateLegacyPayload(parsed) {
  if (!parsed || typeof parsed !== 'object') return createDefaultProfiles();

  if (Array.isArray(parsed.profiles)) {
    return normalizeProfiles(parsed.profiles);
  }

  const avatarsByMode = parsed.avatarsByMode || parsed;
  const namesByMode = parsed.namesByMode || {};

  return [
    {
      id: 'child-default',
      name:
        typeof namesByMode.child === 'string' && namesByMode.child.trim()
          ? namesByMode.child.slice(0, 30)
          : 'Enfant',
      role: 'child',
      avatar: sanitizeAvatarConfig(avatarsByMode?.child, 'child'),
    },
    {
      id: 'parent-default',
      name:
        typeof namesByMode.parent === 'string' && namesByMode.parent.trim()
          ? namesByMode.parent.slice(0, 30)
          : 'Parent',
      role: 'parent',
      avatar: sanitizeAvatarConfig(avatarsByMode?.parent, 'parent'),
    },
  ];
}

export function AvatarProvider({ children }) {
  const [profiles, setProfiles] = useState(createDefaultProfiles);
  const [activeProfileId, setActiveProfileId] = useState('child-default');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(avatarStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const normalized = migrateLegacyPayload(parsed);
      setProfiles(normalized);

      const incomingActiveId = typeof parsed.activeProfileId === 'string' ? parsed.activeProfileId : '';
      const exists = normalized.some((p) => p.id === incomingActiveId);
      setActiveProfileId(exists ? incomingActiveId : normalized[0].id);
    } catch {
      const defaults = createDefaultProfiles();
      setProfiles(defaults);
      setActiveProfileId(defaults[0].id);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        avatarStorageKey,
        JSON.stringify({
          profiles,
          activeProfileId,
        }),
      );
    } catch {
      // no-op
    }
  }, [profiles, activeProfileId]);

  const getProfileById = (id) => profiles.find((profile) => profile.id === id) || null;

  const createProfile = ({ name, role }) => {
    const safeRole = normalizeRole(role);
    const next = {
      id: randomId(safeRole),
      name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 30) : safeRole === 'parent' ? 'Parent' : 'Enfant',
      role: safeRole,
      avatar: defaultAvatarConfig(safeRole),
    };
    setProfiles((prev) => [...prev, next]);
    setActiveProfileId(next.id);
    return next.id;
  };

  const updateProfile = (id, patch) => {
    setProfiles((prev) =>
      prev.map((profile) => {
        if (profile.id !== id) return profile;

        const nextRole = patch?.role ? normalizeRole(patch.role) : profile.role;
        return {
          ...profile,
          ...patch,
          role: nextRole,
          name:
            typeof patch?.name === 'string'
              ? patch.name.trim().slice(0, 30) || (nextRole === 'parent' ? 'Parent' : 'Enfant')
              : profile.name,
          avatar: sanitizeAvatarConfig(patch?.avatar || profile.avatar, nextRole),
        };
      }),
    );
  };

  const setProfileAvatar = (id, fullConfig) => {
    const profile = getProfileById(id);
    if (!profile) return;
    updateProfile(id, { avatar: sanitizeAvatarConfig(fullConfig, profile.role) });
  };

  const setProfileName = (id, value) => {
    updateProfile(id, { name: typeof value === 'string' ? value : '' });
  };

  const setProfileRole = (id, role) => {
    const safeRole = normalizeRole(role);
    const profile = getProfileById(id);
    if (!profile) return;
    updateProfile(id, {
      role: safeRole,
      avatar: sanitizeAvatarConfig(profile.avatar, safeRole),
    });
  };

  // Backward-compatible API (mode-based).
  const pickByMode = (mode) => profiles.find((profile) => profile.role === mode) || null;

  const getAvatarByMode = (mode) => {
    const selected = pickByMode(mode);
    return selected ? selected.avatar : defaultAvatarConfig(mode);
  };

  const getNameByMode = (mode) => {
    const selected = pickByMode(mode);
    return selected?.name || (mode === 'parent' ? 'Parent' : 'Enfant');
  };

  const setAvatar = (mode, fullConfig) => {
    const selected = pickByMode(mode);
    if (selected) {
      setProfileAvatar(selected.id, fullConfig);
      return;
    }

    const createdId = createProfile({
      role: mode,
      name: mode === 'parent' ? 'Parent' : 'Enfant',
    });
    setProfileAvatar(createdId, fullConfig);
  };

  const setName = (mode, value) => {
    const selected = pickByMode(mode);
    if (selected) {
      setProfileName(selected.id, value);
      return;
    }
    createProfile({ role: mode, name: value });
  };

  const updateAvatar = (mode, configPatch) => {
    const selected = pickByMode(mode);
    if (!selected) return;
    updateProfile(selected.id, {
      avatar: sanitizeAvatarConfig({ ...selected.avatar, ...configPatch }, mode),
    });
  };

  const randomizeAvatar = (mode) => {
    const selected = pickByMode(mode);
    if (!selected) return;
    updateProfile(selected.id, { avatar: randomAvatarConfig(mode) });
  };

  const avatarsByMode = {
    child: getAvatarByMode('child'),
    parent: getAvatarByMode('parent'),
  };

  const namesByMode = {
    child: getNameByMode('child'),
    parent: getNameByMode('parent'),
  };

  const activeProfile = getProfileById(activeProfileId) || profiles[0] || null;

  const value = useMemo(
    () => ({
      profiles,
      activeProfileId,
      activeProfile,
      setActiveProfileId,
      getProfileById,
      createProfile,
      updateProfile,
      setProfileAvatar,
      setProfileName,
      setProfileRole,
      avatarsByMode,
      namesByMode,
      getAvatarByMode,
      getNameByMode,
      updateAvatar,
      setAvatar,
      randomizeAvatar,
      setName,
      // Backend sync hooks: ready for future login-based persistence.
      syncFromBackend: async () => {},
      syncToBackend: async () => {},
    }),
    [profiles, activeProfileId, activeProfile],
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
