import { useEffect, useState } from 'react';
import { avatarUrlFromConfig, sanitizeAvatarConfig } from '../lib/avatarConfig.js';

export default function AvatarRenderer({
  config,
  size = 64,
  alt = 'Avatar',
  className = '',
  loading = 'lazy',
}) {
  const safe = sanitizeAvatarConfig(config);
  const src = avatarUrlFromConfig(safe);
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    if (src === displaySrc) return undefined;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setDisplaySrc(src);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setDisplaySrc(src);
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [displaySrc, src]);

  return (
    <img
      className={className}
      src={displaySrc}
      width={size}
      height={size}
      alt={alt}
      loading={loading}
      decoding="async"
      draggable={false}
    />
  );
}
