export const RARITIES = [
  { name: 'Common', weight: 60, bonus: 0.05, color: 0xb8b3c7 },
  { name: 'Rare', weight: 28, bonus: 0.15, color: 0x4da3ff },
  { name: 'Epic', weight: 10, bonus: 0.4, color: 0xb06bff },
  { name: 'Legendary', weight: 2, bonus: 1, color: 0xffc93c },
];

export type Breed = {
  name: string;
  rarity: number;
  ears: 'normal' | 'big' | 'folded' | 'tufted';
  pattern: 'none' | 'tabby' | 'points' | 'spots' | 'wrinkles';
  eyes: number;
  wide?: number;
  fluffy?: boolean;
  hairless?: boolean;
};

export const BREEDS: Breed[] = [
  { name: 'Alley Cat', rarity: 0, ears: 'normal', pattern: 'tabby', eyes: 0x9acd32 },
  { name: 'British Shorthair', rarity: 0, ears: 'normal', pattern: 'none', eyes: 0xffa62b, wide: 1.15 },
  { name: 'Siamese', rarity: 1, ears: 'big', pattern: 'points', eyes: 0x4da3ff },
  { name: 'Scottish Fold', rarity: 1, ears: 'folded', pattern: 'none', eyes: 0xffa62b, wide: 1.08 },
  { name: 'Maine Coon', rarity: 2, ears: 'tufted', pattern: 'tabby', eyes: 0x9acd32, fluffy: true },
  { name: 'Bengal', rarity: 2, ears: 'normal', pattern: 'spots', eyes: 0x9acd32 },
  { name: 'Sphynx', rarity: 3, ears: 'big', pattern: 'wrinkles', eyes: 0x6ee7b7, hairless: true },
  { name: 'Savannah', rarity: 3, ears: 'big', pattern: 'spots', eyes: 0xffc93c },
];

/** Cats sold in the Cat Lounge for Golden Fish. Like Diamond cats, they never come from strays, gifts or the Cat Shop. */
export const FISH_CATS = [
  { breed: 3, coat: 5, price: 150 }, // Cream Scottish Fold
  { breed: 4, coat: 5, price: 250 }, // Cream Maine Coon
  { breed: 3, coat: 6, price: 350 }, // Lilac Scottish Fold
  { breed: 5, coat: 7, price: 600 }, // Golden Bengal
];

export const COATS = [
  { name: 'Ginger', rarity: 0, color: 0xf4a261 },
  { name: 'Charcoal', rarity: 0, color: 0x4a4e5a },
  { name: 'Snow', rarity: 0, color: 0xf5f3ef },
  { name: 'Silver', rarity: 0, color: 0xa9adb8 },
  { name: 'Chocolate', rarity: 1, color: 0x7b4b2a },
  { name: 'Cream', rarity: 1, color: 0xf3dfb6 },
  { name: 'Lilac', rarity: 2, color: 0xc3a6d8 },
  { name: 'Golden', rarity: 3, color: 0xffc93c },
];
