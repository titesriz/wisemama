import { avatarUrlFromConfig, sanitizeAvatarConfig } from '../lib/avatarConfig.js';

export default function AvatarRenderer({ config, size = 64, alt = 'Avatar', className = '' }) {
  const safe = sanitizeAvatarConfig(config);
  const src = avatarUrlFromConfig(safe);

  return (
    <img
      className={className}
      src={src}
      width={size}
      height={size}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
