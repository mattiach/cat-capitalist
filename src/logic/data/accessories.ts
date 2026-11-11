import type { IconName } from './iconNames.ts';

export const SLOTS = ['head', 'face', 'neck'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABELS: Record<Slot, string> = { head: 'Hat', face: 'Glasses', neck: 'Accessory' };

export type Accessory = {
  name: string;
  icon: IconName;
  slot: Slot;
  /**
   * Where it is worn, when not the slot's usual spot (hats on top of the head, neck items under the chin):
   * `wrap` is drawn round the head itself (helmets, hair, crowns), `back` behind it (wings), `ear` clipped by an ear, `mouth` carried in the mouth,
   * `left`/`right` held beside the cat and `leftBottom`/`rightBottom` standing next to it.
   */
  placement?: 'head' | 'neck' | 'wrap' | 'back' | 'ear' | 'mouth' | 'left' | 'right' | 'leftBottom' | 'rightBottom';
  cost: number;
  bonus?: number;
  /** Price in Diamonds instead of money; `cost` stays 0. */
  diamondCost?: number;
  reward?: { kind: 'money' | 'fish' | 'boost' | 'cat' | 'diamond'; amount?: number };
  effect?: 'sparkle' | 'fire' | 'rainbow';
  /** Fan tribute in the Boutique's Specials tab: optional, never needed for awards or the victory screen. */
  special?: boolean;
  /**
   * Fine tuning on the cat, in head radii: `scale` multiplies the size, `lift` moves it vertically (negative is up),
   * `shift` sideways (negative is left), `tilt` replaces the spot's angle in degrees, `shadow: false` drops the
   * contact shadow of something that floats.
   */
  fit?: { scale?: number; lift?: number; shift?: number; tilt?: number; shadow?: boolean };
  /** No longer sold or wearable. Kept so saved indexes stay valid: never delete a row, retire it. */
  retired?: boolean;
};

/** Indexed by position in saved data: append new entries, never reorder. */
export const ACCESSORIES: Accessory[] = [
  { name: 'Pink Bow', icon: 'pinkBow', slot: 'head', fit: { scale: 0.8, lift: 0.06, shadow: false }, cost: 1e3, bonus: 0, reward: { kind: 'money', amount: 200 } },
  { name: 'Tiny Bell', icon: 'tinyBell', slot: 'neck', cost: 5e3, bonus: 0, reward: { kind: 'money', amount: 800 } },
  { name: 'Reading Glasses', icon: 'readingGlasses', slot: 'face', cost: 25e3, bonus: 0, reward: { kind: 'money', amount: 3e3 } },
  { name: 'Baseball Cap', icon: 'baseballCap', slot: 'head', cost: 250e3, bonus: 0, reward: { kind: 'money', amount: 20e3 } },
  { name: 'Cozy Scarf', icon: 'cozyScarf', slot: 'neck', cost: 2e6, bonus: 0, reward: { kind: 'money', amount: 150e3 } },
  { name: 'Cool Shades', icon: 'coolShades', slot: 'face', cost: 25e6, bonus: 0, reward: { kind: 'money', amount: 1e6 } },
  { name: 'Flower Crown', icon: 'flowerCrown', slot: 'head', placement: 'wrap', cost: 500e6 },
  { name: 'Gold Medal', icon: 'goldMedal', slot: 'neck', cost: 10e9 },
  { name: 'Top Hat', icon: 'topHat', slot: 'head', fit: { lift: -0.06 }, cost: 500e9 },
  { name: 'Space Goggles', icon: 'spaceGoggles', slot: 'face', cost: 50e12 },
  { name: 'Diamond Collar', icon: 'diamondCollar', slot: 'neck', cost: 5e15 },
  { name: 'Royal Crown', icon: 'royalCrown', slot: 'head', cost: 1e21 },
  { name: 'Lucky Duck', icon: 'luckyDuck', slot: 'neck', placement: 'rightBottom', cost: 40e3, reward: { kind: 'fish', amount: 1 } },
  { name: 'Mouse Toy', icon: 'mouseToy', slot: 'neck', placement: 'rightBottom', cost: 100e3, reward: { kind: 'money', amount: 5e3 } },
  { name: 'Cat Socks', icon: 'catSocks', slot: 'neck', placement: 'leftBottom', cost: 350e3, reward: { kind: 'boost', amount: 8 } },
  { name: 'Duckling Pond', icon: 'ducklingPond', slot: 'neck', placement: 'leftBottom', cost: 1.5e6, reward: { kind: 'cat' } },
  { name: 'Pizza Plush', icon: 'pizzaPlush', slot: 'neck', placement: 'leftBottom', cost: 5e6, reward: { kind: 'money', amount: 250e3 } },
  { name: 'Bubblegum Shades', icon: 'bubblegumShades', slot: 'face', cost: 18e6, reward: { kind: 'boost', amount: 12 } },
  { name: 'Rose Clip', icon: 'roseClip', slot: 'neck', placement: 'ear', cost: 75e6, reward: { kind: 'fish', amount: 2 } },
  { name: 'Tiny Top Hat', icon: 'tinyTopHat', slot: 'head', fit: { scale: 0.84, lift: -0.02, shift: 0.26, tilt: 12 }, cost: 450e6, reward: { kind: 'cat' } },
  { name: 'Tuna Juice', icon: 'tunaJuice', slot: 'neck', placement: 'rightBottom', cost: 2e9, reward: { kind: 'money', amount: 100e6 } },
  { name: 'Cat Music Box', icon: 'musicBox', slot: 'neck', placement: 'leftBottom', cost: 8e9, reward: { kind: 'boost', amount: 15 }, retired: true },
  { name: 'Lucky Dice', icon: 'luckyDice', slot: 'neck', placement: 'leftBottom', cost: 40e9, reward: { kind: 'fish', amount: 3 } },
  { name: 'Game Controller', icon: 'gameController', slot: 'neck', placement: 'leftBottom', fit: { lift: 0.14, tilt: -10, shadow: false }, cost: 200e9, effect: 'sparkle' },
  { name: 'Party Popper', icon: 'partyPopper', slot: 'neck', placement: 'rightBottom', cost: 1e12, reward: { kind: 'money', amount: 30e9 }, effect: 'fire' },
  { name: 'Diamond Ring', icon: 'diamondRing', slot: 'neck', placement: 'rightBottom', fit: { scale: 0.9 }, cost: 8e12, reward: { kind: 'cat' } },
  { name: 'Rainbow Collar', icon: 'rainbowCollar', slot: 'neck', cost: 50e12, effect: 'rainbow' },
  { name: 'Soccer Ball', icon: 'soccerBall', slot: 'neck', placement: 'leftBottom', cost: 300e12, reward: { kind: 'fish', amount: 4 } },
  { name: 'Cat Phone', icon: 'catPhone', slot: 'neck', placement: 'rightBottom', cost: 2e15, reward: { kind: 'money', amount: 100e12 } },
  { name: 'Goose Parade', icon: 'gooseParade', slot: 'neck', placement: 'rightBottom', fit: { scale: 1.15 }, cost: 12e15, reward: { kind: 'cat' }, effect: 'sparkle' },
  { name: 'Gaming Laptop', icon: 'gamingLaptop', slot: 'neck', placement: 'rightBottom', cost: 80e15, effect: 'fire' },
  { name: 'Sushi Plush', icon: 'sushiPlush', slot: 'neck', placement: 'leftBottom', cost: 500e15, reward: { kind: 'boost', amount: 20 } },
  { name: 'Crystal Crown', icon: 'crystalCrown', slot: 'head', cost: 3e21, effect: 'rainbow' },
  { name: 'Golden Goose', icon: 'goldenGoose', slot: 'neck', placement: 'rightBottom', cost: 20e21, reward: { kind: 'fish', amount: 5 } },
  { name: 'Drum Solo', icon: 'drumSolo', slot: 'neck', placement: 'leftBottom', cost: 120e21, reward: { kind: 'boost', amount: 30 }, effect: 'fire' },
  { name: 'Purrfect PC', icon: 'purrfectPC', slot: 'neck', placement: 'rightBottom', cost: 800e21, reward: { kind: 'money', amount: 20e21 }, effect: 'sparkle' },
  // Pay one Diamond once, for a money price.
  { name: 'Treasure Chest', icon: 'treasureChest', slot: 'neck', placement: 'leftBottom', cost: 1e14, reward: { kind: 'diamond', amount: 1 } },
  { name: 'Lucky Clover', icon: 'luckyClover', slot: 'neck', placement: 'ear', fit: { scale: 1.05, lift: -0.04 }, cost: 5e16, reward: { kind: 'diamond', amount: 1 } },
  { name: 'Crystal Ball', icon: 'crystalBall', slot: 'neck', placement: 'rightBottom', cost: 1e22, reward: { kind: 'diamond', amount: 1 } },
  // Sold for Diamonds only.
  { name: 'Prism Pin', icon: 'prismPin', slot: 'neck', placement: 'ear', fit: { scale: 0.72, lift: -0.12, shift: -0.1 }, cost: 0, diamondCost: 1, bonus: 0.15, effect: 'sparkle' },
  { name: 'Starlight Scarf', icon: 'starlightScarf', slot: 'neck', cost: 0, diamondCost: 2, bonus: 0.3, effect: 'rainbow' },
  { name: 'Diamond Tiara', icon: 'diamondTiara', slot: 'head', placement: 'wrap', cost: 0, diamondCost: 3, bonus: 0.6, effect: 'fire' },
  // Hats, from pocket money to the late-late game.
  { name: 'Paper Hat', icon: 'paperHat', slot: 'head', cost: 60, bonus: 0.01 },
  { name: 'Woolly Beanie', icon: 'beanie', slot: 'head', cost: 900, bonus: 0.01 },
  { name: 'Party Hat', icon: 'partyHat', slot: 'head', fit: { scale: 0.9, lift: -0.08 }, cost: 12e3, bonus: 0.01, reward: { kind: 'boost', amount: 5 } },
  { name: 'Straw Hat', icon: 'strawHat', slot: 'head', cost: 150e3, bonus: 0.02 },
  { name: 'Chef Hat', icon: 'chefHat', slot: 'head', fit: { lift: -0.1 }, cost: 3e6, bonus: 0.02 },
  { name: 'Cowboy Hat', icon: 'cowboyHat', slot: 'head', cost: 40e6, bonus: 0.02 },
  { name: 'Witch Hat', icon: 'witchHat', slot: 'head', fit: { scale: 1.12, lift: -0.08 }, cost: 800e6, bonus: 0.02 },
  { name: 'Viking Helmet', icon: 'vikingHelmet', slot: 'head', fit: { scale: 1.02, lift: 0.04, tilt: 0 }, cost: 20e9, bonus: 0.02 },
  { name: 'Wizard Hat', icon: 'wizardHat', slot: 'head', fit: { scale: 1.12, lift: -0.1 }, cost: 600e9, bonus: 0.02, effect: 'sparkle' },
  { name: 'Astronaut Helmet', icon: 'astronautHelmet', slot: 'head', cost: 20e12, bonus: 0.02, retired: true },
  { name: 'Golden Halo', icon: 'goldenHalo', slot: 'head', fit: { lift: -0.34, shadow: false }, cost: 0, diamondCost: 5, bonus: 0.4, effect: 'sparkle' },
  { name: 'Phoenix Crown', icon: 'phoenixCrown', slot: 'head', cost: 0, diamondCost: 10, bonus: 0.8, effect: 'fire' },
  // Glasses: everything here is drawn around the cat's eyes.
  { name: 'False Lashes', icon: 'falseLashes', slot: 'face', cost: 40, bonus: 0.01 },
  { name: 'Round Specs', icon: 'roundSpecs', slot: 'face', cost: 400, bonus: 0.01 },
  { name: 'Black Eye', icon: 'blackEye', slot: 'face', cost: 3e3, bonus: 0.01 },
  { name: 'Taped Specs', icon: 'tapeSpecs', slot: 'face', cost: 8e3, bonus: 0.01 },
  { name: 'Pirate Patch', icon: 'piratePatch', slot: 'face', cost: 60e3, bonus: 0.02 },
  { name: 'Monocle', icon: 'monocle', slot: 'face', cost: 300e3, bonus: 0.02 },
  { name: 'Heart Shades', icon: 'heartShades', slot: 'face', cost: 900e3, bonus: 0.02 },
  { name: 'Sleep Mask', icon: 'sleepMask', slot: 'face', cost: 7e6, reward: { kind: 'boost', amount: 8 } },
  { name: '3D Glasses', icon: 'threeDGlasses', slot: 'face', cost: 90e6, bonus: 0.02 },
  { name: 'Star Shades', icon: 'starShades', slot: 'face', cost: 1.5e9, bonus: 0.02 },
  { name: 'Aviators', icon: 'aviators', slot: 'face', cost: 30e9, bonus: 0.02 },
  { name: 'Masquerade Mask', icon: 'masqueradeMask', slot: 'face', cost: 900e9, bonus: 0.02, effect: 'sparkle' },
  { name: 'Cyber Visor', icon: 'cyberVisor', slot: 'face', cost: 40e15, bonus: 0.02 },
  { name: 'Diamond Lashes', icon: 'diamondLashes', slot: 'face', cost: 0, diamondCost: 3, bonus: 0.25, effect: 'sparkle' },
  { name: 'Laser Visor', icon: 'laserVisor', slot: 'face', cost: 0, diamondCost: 8, bonus: 0.6, effect: 'fire' },
  // Accessories
  { name: 'Fish Bone', icon: 'fishBone', slot: 'neck', placement: 'mouth', cost: 25, bonus: 0.01 },
  { name: 'Bow Tie', icon: 'bowTie', slot: 'neck', cost: 500, bonus: 0.01 },
  { name: 'Yarn Toy', icon: 'yarnToy', slot: 'neck', placement: 'leftBottom', cost: 6e3, bonus: 0.01 },
  { name: 'Spiked Collar', icon: 'spikedCollar', slot: 'neck', cost: 600e3, bonus: 0.02 },
  { name: 'Pearl Necklace', icon: 'pearlNecklace', slot: 'neck', cost: 30e6, bonus: 0.02 },
  { name: 'Feather Wand', icon: 'featherWand', slot: 'neck', placement: 'right', fit: { scale: 1.1 }, cost: 3e9, bonus: 0.02 },
  { name: 'Pocket Watch', icon: 'pocketWatch', slot: 'neck', placement: 'rightBottom', cost: 2e12, bonus: 0.02 },
  { name: 'Golden Bell', icon: 'goldenBell', slot: 'neck', cost: 8e21, bonus: 0.02, effect: 'sparkle' },
  { name: 'Angel Wings', icon: 'angelWings', slot: 'neck', placement: 'back', cost: 0, diamondCost: 6, bonus: 0.5, effect: 'sparkle' },
  { name: 'Cosmic Collar', icon: 'cosmicCollar', slot: 'neck', cost: 0, diamondCost: 12, bonus: 1, effect: 'rainbow' },
  // Specials: playful nods to famous heroes and games, priced from $200K to $30M and left out of completion
  { name: 'Boy Wizard Specs', icon: 'wizardSpecs', slot: 'face', cost: 200e3, bonus: 0.02, special: true },
  { name: 'House Scarf', icon: 'houseScarf', slot: 'neck', cost: 260e3, bonus: 0.02, special: true },
  { name: 'Web-Slinger Mask', icon: 'webMask', slot: 'face', cost: 330e3, bonus: 0.02, special: true },
  { name: 'Pocket Monster Ball', icon: 'monsterBall', slot: 'neck', placement: 'rightBottom', cost: 420e3, bonus: 0.02, special: true },
  { name: 'Arc Reactor', icon: 'arcReactor', slot: 'neck', cost: 540e3, bonus: 0.03, special: true, effect: 'sparkle' },
  { name: 'Steel Hero Crest', icon: 'heroCrest', slot: 'neck', cost: 700e3, bonus: 0.03, special: true },
  { name: 'Stolen Sweetroll', icon: 'sweetroll', slot: 'neck', placement: 'leftBottom', cost: 900e3, bonus: 0.03, special: true },
  { name: 'Laser Sword', icon: 'laserSword', slot: 'neck', placement: 'right', fit: { scale: 1.3, tilt: 14, lift: -0.1 }, cost: 1.2e6, bonus: 0.04, special: true, effect: 'sparkle' },
  { name: 'Dragonborn Helmet', icon: 'dragonbornHelmet', slot: 'head', placement: 'wrap', cost: 1.5e6, bonus: 0.04, special: true },
  { name: 'Dark Lord Helmet', icon: 'darkLordHelmet', slot: 'head', placement: 'wrap', cost: 1.9e6, bonus: 0.05, special: true },
  { name: 'Loose Cannon Plush', icon: 'chaosPlush', slot: 'neck', placement: 'leftBottom', cost: 2.4e6, bonus: 0.05, special: true, effect: 'fire' },
  { name: 'Red War Paint', icon: 'warPaint', slot: 'face', cost: 3.1e6, bonus: 0.03, special: true, retired: true },
  { name: 'Round Mouse Ears', icon: 'mouseEars', slot: 'head', placement: 'wrap', cost: 4e6, bonus: 0.02, special: true },
  { name: 'Polka Bow Ears', icon: 'bowMouseEars', slot: 'head', placement: 'wrap', cost: 5.2e6, bonus: 0.02, special: true },
  { name: 'Legendary Card', icon: 'heroCard', slot: 'neck', placement: 'rightBottom', cost: 6.7e6, bonus: 0.03, special: true, effect: 'sparkle' },
  { name: 'Tycoon Statuette', icon: 'tycoonStatue', slot: 'neck', placement: 'leftBottom', fit: { scale: 1.2, lift: -0.08 }, cost: 8.6e6, bonus: 0.03, special: true },
  { name: '102 Statuette', icon: 'bobblehead', slot: 'neck', placement: 'rightBottom', fit: { scale: 1.2, lift: -0.08 }, cost: 11e6, bonus: 0.03, special: true },
  { name: 'Pixel Diamond Sword', icon: 'pixelSword', slot: 'neck', placement: 'right', fit: { tilt: 0 }, cost: 14e6, bonus: 0.04, special: true },
  { name: 'Pixel Diamond Axe', icon: 'pixelAxe', slot: 'neck', placement: 'right', fit: { tilt: 0 }, cost: 18e6, bonus: 0.04, special: true },
  { name: 'Block Pig Plush', icon: 'blockPig', slot: 'neck', placement: 'leftBottom', cost: 23e6, bonus: 0.03, special: true },
  { name: 'Cherry Guitar', icon: 'redGuitar', slot: 'neck', placement: 'left', fit: { scale: 1.36, tilt: -14, lift: -0.02 }, cost: 30e6, bonus: 0.04, special: true, effect: 'fire' },
  // Hairstyles: drawn hugging the head, not perched on top like a hat
  { name: 'Punk Mohawk', icon: 'mohawk', slot: 'head', placement: 'wrap', cost: 2e6, bonus: 0.01 },
  { name: 'Curly Afro', icon: 'afro', slot: 'head', placement: 'wrap', cost: 3e9, bonus: 0.01 },
  { name: 'Rockabilly Quiff', icon: 'quiff', slot: 'head', placement: 'wrap', cost: 1e12, bonus: 0.02 },
];

/** Diamond items, Diamond rewards and Specials can't be handed out for free by gifts and cheats. */
export const isPremiumAccessory = (a: Accessory) => a.retired === true || a.diamondCost !== undefined || a.reward?.kind === 'diamond' || a.special === true;
/** Everything except the optional Specials: what awards and the victory screen count. */
export const ownsEveryAccessory = (owned: (boolean | undefined)[]) => ACCESSORIES.every((a, k) => a.special || a.retired || owned[k]);
