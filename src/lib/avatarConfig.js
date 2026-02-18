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
  dylan: {
    beard: ['none', 'default'],
    clothes: ['default'],
    clothesColor: ['65c9ff'],
    hair: ['plain', 'wavy', 'shortCurls', 'parting', 'spiky', 'roundBob', 'longCurls', 'buns', 'bangs', 'fluffy', 'flatTop', 'shaggy'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370', 'ffffff'],
    eyes: ['happy', 'angry', 'neutral', 'superHappy', 'sad', 'hopeful', 'confused'],
    mouth: ['happy', 'angry', 'neutral', 'superHappy', 'sad', 'hopeful', 'confused'],
    rearHair: ['none'],
    skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
    eyebrows: ['default'],
    head: ['default'],
    backgroundColor: ['65c9ff', 'b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  },
  'open-peeps': {
    beard: ['none', 'chin', 'full', 'full2', 'full3', 'full4', 'goatee1', 'goatee2', 'moustache1', 'moustache2', 'moustache3'],
    clothes: ['none', 'eyepatch', 'glasses', 'glasses2', 'glasses3', 'sunglasses', 'sunglasses2'],
    clothesColor: ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'ffafb9'],
    hair: ['afro', 'bangs', 'bangs2', 'bun', 'buns', 'cornrows', 'dreads1', 'flatTop', 'hatBeanie', 'hijab', 'long', 'longCurly', 'medium1', 'medium2', 'short1', 'short2', 'short3', 'short4', 'short5'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370', 'ffffff'],
    eyes: ['angryWithFang', 'awe', 'calm', 'cheeky', 'cute', 'driven', 'eyesClosed', 'lovingGrin1', 'smile', 'smileBig', 'solemn'],
    mouth: ['angryWithFang', 'awe', 'calm', 'cheeky', 'cute', 'driven', 'eyesClosed', 'lovingGrin1', 'smile', 'smileBig', 'solemn'],
    rearHair: ['none'],
    skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
    eyebrows: ['default'],
    head: ['default'],
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
  },
  miniavs: {
    beard: ['none', 'pencilThinBeard', 'pencilThin', 'horshoe', 'freddy'],
    clothes: ['tShirt', 'golf'],
    clothesColor: ['ff5733', '4caf50', '3f51b5', 'ff9800', '9c27b0', '795548'],
    hair: ['balndess', 'slaughter', 'ponyTail', 'long', 'curly', 'stylish', 'elvis', 'classic02', 'classic01'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370', 'ffffff'],
    eyes: ['normal', 'confident', 'happy'],
    mouth: ['default', 'missingTooth'],
    rearHair: ['none'],
    skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
    eyebrows: ['default'],
    head: ['normal', 'wide', 'thin'],
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
  },
  micah: {
    beard: ['none', 'beard', 'scruff'],
    clothes: ['open', 'crew', 'collared'],
    clothesColor: ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'ffafb9'],
    hair: ['fonze', 'mrT', 'dougFunny', 'mrClean', 'dannyPhantom', 'full', 'turban', 'pixie'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370', 'ffffff'],
    eyes: ['eyes', 'round', 'eyesShadow', 'smiling', 'smilingShadow'],
    mouth: ['surprised', 'laughing', 'nervous', 'smile', 'sad', 'pucker', 'frown', 'smirk'],
    rearHair: ['none'],
    skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
    eyebrows: ['up', 'down', 'eyelashesUp', 'eyelashesDown'],
    head: ['curve', 'pointed', 'tound'],
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'a7ffc4', 'e8f3a7'],
  },
  'big-smile': {
    accessories: ['none', 'catEars', 'glasses', 'sailormoonCrown', 'clownNose', 'sleepMask', 'sunglasses', 'faceMask', 'mustache'],
    face: ['base'],
    beard: ['none', 'catEars', 'glasses', 'sailormoonCrown', 'clownNose', 'sleepMask', 'sunglasses', 'faceMask', 'mustache'],
    clothes: ['base'],
    clothesColor: ['65c9ff'],
    hair: ['shortHair', 'mohawk', 'wavyBob', 'bowlCutHair', 'curlyBob', 'straightHair', 'braids', 'shavedHead', 'bunHair', 'froBun', 'bangs', 'halfShavedHead', 'curlyShortHair'],
    hairColor: ['2c1b18', '724133', 'a55728', 'b58143', 'd6b370', 'ffffff'],
    eyes: ['cheery', 'normal', 'confused', 'starstruck', 'winking', 'sleepy', 'sad', 'angry'],
    mouth: ['openedSmile', 'unimpressed', 'gapSmile', 'openSad', 'teethSmile', 'awkwardSmile', 'braces', 'kawaii'],
    rearHair: ['none'],
    skinColor: ['f2d3b1', 'ecad80', '9e5622', '763900'],
    eyebrows: ['default'],
    head: ['base'],
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
    accessories: profile.accessories?.[0] || profile.beard?.[0] || 'none',
    face: profile.face?.[0] || profile.head?.[0] || 'base',
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
    accessories: randomItem(profile.accessories || profile.beard),
    face: randomItem(profile.face || profile.head),
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

  if (style === 'big-smile') {
    const accessoryOptions = profile.accessories || profile.beard;
    const faceOptions = profile.face || profile.head;

    if (!config.accessories && config.beard) {
      config.accessories = config.beard;
    }
    if (!config.face && config.head) {
      config.face = config.head;
    }

    if (!accessoryOptions.includes(config.accessories)) config.accessories = accessoryOptions[0];
    if (!faceOptions.includes(config.face)) config.face = faceOptions[0];

    // Keep backward compatibility with existing editor categories.
    config.beard = config.accessories;
    config.head = config.face;
  }

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

  if (config.style === 'dylan') {
    params.set('hair', config.hair);
    params.set('hairColor', config.hairColor);
    params.set('skinColor', config.skinColor);
    params.set('mood', config.eyes);
    if (config.beard && config.beard !== 'none') {
      params.set('facialHair', 'default');
      params.set('facialHairProbability', '100');
    } else {
      params.set('facialHairProbability', '0');
    }
    return params;
  }

  if (config.style === 'open-peeps') {
    params.set('head', config.hair);
    params.set('face', config.eyes);
    params.set('skinColor', config.skinColor);
    params.set('headContrastColor', config.hairColor);
    params.set('clothingColor', config.clothesColor);
    if (config.clothes && config.clothes !== 'none') {
      params.set('accessories', config.clothes);
      params.set('accessoriesProbability', '100');
    } else {
      params.set('accessoriesProbability', '0');
    }
    if (config.beard && config.beard !== 'none') {
      params.set('facialHair', config.beard);
      params.set('facialHairProbability', '100');
    } else {
      params.set('facialHairProbability', '0');
    }
    return params;
  }

  if (config.style === 'miniavs') {
    params.set('hair', config.hair);
    params.set('hairColor', config.hairColor);
    params.set('eyes', config.eyes);
    params.set('mouth', config.mouth);
    params.set('head', config.head);
    params.set('body', config.clothes);
    params.set('bodyColor', config.clothesColor);
    params.set('skinColor', config.skinColor);
    if (config.beard && config.beard !== 'none') {
      params.set('mustache', config.beard);
      params.set('mustacheProbability', '100');
    } else {
      params.set('mustacheProbability', '0');
    }
    return params;
  }

  if (config.style === 'micah') {
    params.set('hair', config.hair);
    params.set('hairColor', config.hairColor);
    params.set('eyes', config.eyes);
    params.set('mouth', config.mouth);
    params.set('nose', config.head);
    params.set('eyebrows', config.eyebrows);
    params.set('shirt', config.clothes);
    params.set('shirtColor', config.clothesColor);
    if (config.beard && config.beard !== 'none') {
      params.set('facialHair', config.beard);
      params.set('facialHairProbability', '100');
    } else {
      params.set('facialHairProbability', '0');
    }
    return params;
  }

  if (config.style === 'big-smile') {
    params.set('hair', config.hair);
    params.set('hairColor', config.hairColor);
    params.set('eyes', config.eyes);
    params.set('mouth', config.mouth);
    params.set('face', config.face || config.head || 'base');
    params.set('skinColor', config.skinColor);
    const accessories = config.accessories || config.beard || 'none';
    if (accessories !== 'none') {
      params.set('accessories', accessories);
      params.set('accessoriesProbability', '100');
    } else {
      params.set('accessoriesProbability', '0');
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
