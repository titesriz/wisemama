const defaultStyle = 'toon-head';

const styleProfiles = {
  'toon-head': {
    beard: ['none', 'chin', 'chinMoustache', 'fullBeard', 'longBeard', 'moustacheTwirl'],
    clothes: ['dress', 'openJacket', 'shirt', 'tShirt', 'turtleNeck'],
    clothesColor: ['545454', 'b11f1f', '0b3286', '147f3c', 'eab308', '731ac3', 'ec4899', 'f97316', '151613', 'e8e9e6'],
    hair: ['none', 'sideComed', 'undercut', 'spiky', 'bun'],
    hairColor: ['2c1b18', 'a55728', 'b58143', 'd6b370', '724133', '151613', '545454'],
    eyes: ['happy', 'wide', 'bow', 'humble', 'wink'],
    mouth: ['laugh', 'angry', 'agape', 'smile', 'sad'],
    rearHair: ['none', 'longStraight', 'longWavy', 'neckHigh', 'shoulderHigh'],
    skinColor: ['f1c3a5', 'c68e7a', 'b98e6a', 'a36b4f', '5c3829'],
    eyebrows: ['raised', 'angry', 'happy', 'sad', 'neutral'],
    head: ['head'],
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
  },
  adventurer: {
    beard: ['none'],
    clothes: ['blazerAndShirt', 'hoodie', 'shirtCrewNeck', 'shirtVNeck'],
    clothesColor: ['1f2937', '3b82f6', '16a34a', 'ca8a04', 'b91c1c', '7c3aed'],
    hair: ['short01', 'short05', 'short10', 'long01', 'long08', 'long15', 'long22'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370'],
    eyes: ['variant01', 'variant02', 'variant03', 'variant05', 'variant08'],
    mouth: ['variant01', 'variant02', 'variant03', 'variant05', 'variant08'],
    rearHair: ['none'],
    skinColor: ['f9c9b6', 'f4b28b', 'eaa17e', 'd08b5b', 'ae5d29', '614335'],
    eyebrows: ['default'],
    head: ['default'],
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
  },
  personas: {
    beard: ['none', 'beardMustache', 'pyramid', 'walrus', 'goatee', 'shadow', 'soulPatch'],
    clothes: ['squared', 'rounded', 'small', 'checkered'],
    clothesColor: ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'b1e2ff', 'ffafb9'],
    hair: ['long', 'sideShave', 'shortCombover', 'curlyHighTop', 'bobCut', 'curly', 'pigtails', 'buzzcut', 'bald', 'mohawk'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370', 'ffffff'],
    eyes: ['open', 'sleep', 'wink', 'glasses', 'happy', 'sunglasses'],
    mouth: ['smile', 'frown', 'surprise', 'pacifier', 'bigSmile', 'smirk', 'lips'],
    rearHair: ['none'],
    skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
    eyebrows: ['default'],
    head: ['smallRound'],
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
  },
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomSeed(prefix = 'kid') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getProfile(style) {
  return styleProfiles[style] || styleProfiles[defaultStyle];
}

export function getAvatarStyles() {
  return Object.keys(styleProfiles);
}

export function getAvatarTraitsByStyle(style) {
  return getProfile(style);
}

export function defaultAvatarConfig(seedPrefix = 'kid') {
  const profile = getProfile(defaultStyle);
  return {
    style: defaultStyle,
    seed: randomSeed(seedPrefix),
    beard: profile.beard[0],
    clothes: profile.clothes[0],
    clothesColor: profile.clothesColor[0],
    hair: profile.hair[0],
    hairColor: profile.hairColor[0],
    hairProbability: 100,
    eyes: profile.eyes[0],
    mouth: profile.mouth[0],
    rearHair: profile.rearHair[0],
    rearHairProbability: 50,
    skinColor: profile.skinColor[0],
    eyebrows: profile.eyebrows[0],
    head: profile.head[0],
    backgroundColor: profile.backgroundColor[0],
  };
}

export function randomAvatarConfig(seedPrefix = 'kid', style = defaultStyle) {
  const profile = getProfile(style);
  return {
    style,
    seed: randomSeed(seedPrefix),
    beard: randomItem(profile.beard),
    clothes: randomItem(profile.clothes),
    clothesColor: randomItem(profile.clothesColor),
    hair: randomItem(profile.hair),
    hairColor: randomItem(profile.hairColor),
    hairProbability: Math.floor(Math.random() * 101),
    eyes: randomItem(profile.eyes),
    mouth: randomItem(profile.mouth),
    rearHair: randomItem(profile.rearHair),
    rearHairProbability: Math.floor(Math.random() * 101),
    skinColor: randomItem(profile.skinColor),
    eyebrows: randomItem(profile.eyebrows),
    head: profile.head[0],
    backgroundColor: randomItem(profile.backgroundColor),
  };
}

export function sanitizeAvatarConfig(input, seedPrefix = 'kid') {
  const defaultConfig = defaultAvatarConfig(seedPrefix);
  const requestedStyle = input?.style;
  const normalizedRequestedStyle = requestedStyle === 'avataaars' ? 'personas' : requestedStyle;
  const style = getAvatarStyles().includes(normalizedRequestedStyle) ? normalizedRequestedStyle : defaultStyle;
  const profile = getProfile(style);

  const config = {
    ...defaultConfig,
    ...(input || {}),
    style,
  };

  // Backward compatibility from older schema.
  if (!config.clothes && config.accessories) {
    config.clothes = config.accessories;
  }

  if (!config.backgroundColor && config.clothesColor) {
    config.backgroundColor = config.clothesColor;
  }

  if (!profile.beard.includes(config.beard)) config.beard = profile.beard[0];
  if (!profile.clothes.includes(config.clothes)) config.clothes = profile.clothes[0];
  if (!profile.clothesColor.includes(config.clothesColor)) config.clothesColor = profile.clothesColor[0];
  if (!profile.hair.includes(config.hair)) config.hair = profile.hair[0];
  if (!profile.hairColor.includes(config.hairColor)) config.hairColor = profile.hairColor[0];
  if (!profile.eyes.includes(config.eyes)) config.eyes = profile.eyes[0];
  if (!profile.mouth.includes(config.mouth)) config.mouth = profile.mouth[0];
  if (!profile.rearHair.includes(config.rearHair)) config.rearHair = profile.rearHair[0];
  if (!profile.skinColor.includes(config.skinColor)) config.skinColor = profile.skinColor[0];
  if (!profile.eyebrows.includes(config.eyebrows)) config.eyebrows = profile.eyebrows[0];
  if (!profile.head.includes(config.head)) config.head = profile.head[0];
  if (!profile.backgroundColor.includes(config.backgroundColor)) config.backgroundColor = profile.backgroundColor[0];

  const parsedHairProbability = Number.parseInt(config.hairProbability, 10);
  const parsedRearHairProbability = Number.parseInt(config.rearHairProbability, 10);
  config.hairProbability = Number.isFinite(parsedHairProbability)
    ? Math.max(0, Math.min(100, parsedHairProbability))
    : defaultConfig.hairProbability;
  config.rearHairProbability = Number.isFinite(parsedRearHairProbability)
    ? Math.max(0, Math.min(100, parsedRearHairProbability))
    : defaultConfig.rearHairProbability;

  if (!config.seed || typeof config.seed !== 'string') {
    config.seed = defaultConfig.seed;
  }

  return config;
}

function buildParams(config) {
  const params = new URLSearchParams();
  params.set('seed', config.seed);
  params.set('radius', '18');
  params.set('backgroundColor', config.backgroundColor || config.clothesColor);

  if (config.style === 'adventurer') {
    params.set('hair', config.hair);
    params.set('eyes', config.eyes);
    params.set('mouth', config.mouth);
    params.set('skinColor', config.skinColor);
    params.set('hairColor', config.hairColor);
    return params;
  }

  if (config.style === 'personas') {
    params.set('hair', config.hair);
    params.set('eyes', config.eyes);
    params.set('mouth', config.mouth);
    params.set('skinColor', config.skinColor);
    params.set('hairColor', config.hairColor);
    params.set('nose', config.head);
    params.set('body', config.clothes);
    params.set('clothingColor', config.clothesColor);
    if (config.beard && config.beard !== 'none') {
      params.set('facialHair', config.beard);
      params.set('facialHairProbability', '100');
    } else {
      params.set('facialHairProbability', '0');
    }
    return params;
  }

  if (config.beard === 'none') {
    params.set('beardProbability', '0');
  } else {
    params.set('beard', config.beard);
    params.set('beardProbability', '100');
  }
  params.set('clothes', config.clothes);
  params.set('clothesColor', config.clothesColor);
  if (config.hair !== 'none') {
    params.set('hair', config.hair);
  }
  params.set('hairColor', config.hairColor);
  params.set('hairProbability', String(config.hair === 'none' ? 0 : 100));
  params.set('head', config.head);
  params.set('eyes', config.eyes);
  params.set('mouth', config.mouth);
  params.set('eyebrows', config.eyebrows);
  if (config.rearHair !== 'none') {
    params.set('rearHair', config.rearHair);
  }
  params.set('rearHairProbability', String(config.rearHair === 'none' ? 0 : 100));
  params.set('skinColor', config.skinColor);
  return params;
}

export function avatarUrlFromConfig(config) {
  const safeConfig = sanitizeAvatarConfig(config);
  const params = buildParams(safeConfig);
  return `https://api.dicebear.com/9.x/${safeConfig.style}/svg?${params.toString()}`;
}

export const avatarTraits = styleProfiles[defaultStyle];
