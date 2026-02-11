const style = 'adventurer';

const traitOptions = {
  hair: ['short01', 'short05', 'short10', 'long01', 'long08', 'long15', 'long22'],
  eyes: ['variant01', 'variant02', 'variant03', 'variant05', 'variant08'],
  mouth: ['variant01', 'variant02', 'variant03', 'variant05', 'variant08'],
  accessories: ['blank', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
  clothesColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomSeed(prefix = 'kid') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultAvatarConfig(seedPrefix = 'kid') {
  return {
    style,
    seed: randomSeed(seedPrefix),
    hair: traitOptions.hair[0],
    eyes: traitOptions.eyes[0],
    mouth: traitOptions.mouth[0],
    accessories: traitOptions.accessories[0],
    clothesColor: traitOptions.clothesColor[0],
  };
}

export function randomAvatarConfig(seedPrefix = 'kid') {
  return {
    style,
    seed: randomSeed(seedPrefix),
    hair: randomItem(traitOptions.hair),
    eyes: randomItem(traitOptions.eyes),
    mouth: randomItem(traitOptions.mouth),
    accessories: randomItem(traitOptions.accessories),
    clothesColor: randomItem(traitOptions.clothesColor),
  };
}

export function sanitizeAvatarConfig(input, seedPrefix = 'kid') {
  const base = defaultAvatarConfig(seedPrefix);
  const config = {
    ...base,
    ...(input || {}),
    style,
  };

  if (!traitOptions.hair.includes(config.hair)) config.hair = base.hair;
  if (!traitOptions.eyes.includes(config.eyes)) config.eyes = base.eyes;
  if (!traitOptions.mouth.includes(config.mouth)) config.mouth = base.mouth;
  if (!traitOptions.accessories.includes(config.accessories)) config.accessories = base.accessories;
  if (!traitOptions.clothesColor.includes(config.clothesColor)) config.clothesColor = base.clothesColor;

  if (!config.seed || typeof config.seed !== 'string') {
    config.seed = base.seed;
  }

  return config;
}

function buildParams(config) {
  const params = new URLSearchParams();
  params.set('seed', config.seed);
  params.set('hair', config.hair);
  params.set('eyes', config.eyes);
  params.set('mouth', config.mouth);
  if (config.accessories && config.accessories !== 'blank') {
    params.set('glasses', config.accessories);
  }
  params.set('backgroundColor', config.clothesColor);
  params.set('radius', '18');
  return params;
}

export function avatarUrlFromConfig(config) {
  const safeConfig = sanitizeAvatarConfig(config);
  const params = buildParams(safeConfig);
  return `https://api.dicebear.com/9.x/${safeConfig.style}/svg?${params.toString()}`;
}

export const avatarTraits = traitOptions;
