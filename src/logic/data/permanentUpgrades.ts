import type { IconName } from './iconNames.ts';

export type PermanentUpgrade = {
  name: string;
  description: string;
  icon: IconName;
  /** Price in Golden Fish. */
  cost: number;
  /** Ascensions completed before it can be bought: 0 or 1, the price paces the rest. */
  ascensions: number;
  /** Index of the upgrade that must be owned first. */
  requires?: number;
  /** Multiplies all profits while owned. */
  profit?: number;
  /** Multiplies the speed of every business cycle while owned. */
  speed?: number;
  effect: string;
};

/** Indexed by position in saved data: append new entries, never reorder. */
export const PERMANENT_UPGRADES: PermanentUpgrade[] = [
  { name: 'Manager’s Best Friend', description: 'Managers cost 5% less.', icon: 'paw', cost: 15, ascensions: 1, effect: 'managerDiscount5' },
  { name: 'Executive Purr', description: 'Manager discount becomes 10% total.', icon: 'briefcase', cost: 40, ascensions: 1, requires: 0, effect: 'managerDiscount10' },
  { name: 'Extra Zoomies I', description: 'Zoomies last 10 seconds longer.', icon: 'bolt', cost: 20, ascensions: 1, effect: 'zoomies10' },
  { name: 'Extra Zoomies II', description: 'Zoomies last 10 more seconds.', icon: 'sparkle', cost: 50, ascensions: 1, requires: 2, effect: 'zoomies20' },
  { name: 'Quick Paws', description: 'All business cycles are 5% faster.', icon: 'racecar', cost: 30, ascensions: 1, speed: 1.05, effect: 'quickPaws' },
  { name: 'Lightning Paws', description: 'All business cycles are 10% faster.', icon: 'cloudBolt', cost: 120, ascensions: 1, requires: 4, speed: 1.1, effect: 'lightningPaws' },
  // Late game
  { name: 'Golden Whiskers', description: 'All profits x2.', icon: 'medal', cost: 250, ascensions: 1, profit: 2, effect: 'profit2' },
  { name: 'Turbo Tail', description: 'All business cycles are 25% faster.', icon: 'rocket', cost: 400, ascensions: 1, requires: 5, speed: 1.25, effect: 'turboTail' },
  { name: 'Feline Fortune', description: 'All profits x3.', icon: 'trophy', cost: 450, ascensions: 1, requires: 6, profit: 3, effect: 'profit3' },
  // Late-late game
  { name: 'Ninth Life Vault', description: 'All profits x5.', icon: 'bank', cost: 650, ascensions: 1, requires: 8, profit: 5, effect: 'profit5' },
  { name: 'Eternal Purr', description: 'All profits x10.', icon: 'infinity', cost: 900, ascensions: 1, requires: 9, profit: 10, effect: 'profit10' },
  // Stepping stones between the tiers above
  { name: 'Window Shopper', description: 'Boutique and Music Store cost 10% less.', icon: 'shoppingBag', cost: 8, ascensions: 0, effect: 'shop10' },
  { name: 'Lucky Whisker', description: 'Purchases have a 1% chance to find a Golden Fish.', icon: 'fish', cost: 10, ascensions: 0, effect: 'luckyFish1' },
  { name: 'Catnip Coupon', description: 'Cat Shop cats cost 10% less.', icon: 'catFace', cost: 12, ascensions: 0, effect: 'catShop10' },
  { name: 'Warm Welcome', description: 'All profits x1.1.', icon: 'heart', cost: 25, ascensions: 0, profit: 1.1, effect: 'profit125' },
  { name: 'Kind Shelter', description: 'All profits x1.05.', icon: 'house', cost: 35, ascensions: 1, profit: 1.05, effect: 'adopt10' },
  { name: 'VIP Card', description: 'Boutique and Music Store discount becomes 20%.', icon: 'star', cost: 60, ascensions: 1, requires: 11, effect: 'shop20' },
  { name: 'Fish Magnet', description: 'Lucky purchase chance becomes 2%.', icon: 'magnifier', cost: 70, ascensions: 1, requires: 12, effect: 'luckyFish2' },
  { name: 'Catnip Voucher', description: 'Cat Shop discount becomes 20%.', icon: 'clipboard', cost: 80, ascensions: 1, requires: 13, effect: 'catShop20' },
  { name: 'Head of Staff', description: 'Manager discount becomes 15% total.', icon: 'tie', cost: 110, ascensions: 1, requires: 1, effect: 'managerDiscount15' },
  { name: 'Silver Whiskers', description: 'All profits x1.15.', icon: 'coins', cost: 150, ascensions: 1, requires: 14, profit: 1.15, effect: 'profit150' },
  { name: 'Extra Zoomies III', description: 'Zoomies last 10 more seconds.', icon: 'flame', cost: 160, ascensions: 1, requires: 3, effect: 'zoomies30' },
  { name: 'Swift Steps', description: 'All business cycles are 8% faster.', icon: 'comet', cost: 200, ascensions: 1, requires: 5, speed: 1.08, effect: 'swiftSteps' },
  { name: 'Golden Net', description: 'Lucky purchases find 2 Golden Fish.', icon: 'pouch', cost: 260, ascensions: 1, requires: 17, effect: 'luckyFishDouble' },
  { name: 'Catnip Gold Pass', description: 'Cat Shop discount becomes 30%.', icon: 'medal', cost: 300, ascensions: 1, requires: 18, effect: 'catShop30' },
];

type Perks = { permanentUpgrades: boolean[] };
export const hasPerk = (s: Perks, effect: string) => PERMANENT_UPGRADES.some((upgrade, k) => s.permanentUpgrades[k] && upgrade.effect === effect);
/** Price multipliers from the discount upgrades; each tier replaces the one before it. */
export const shopFactor = (s: Perks) => (hasPerk(s, 'shop20') ? 0.8 : hasPerk(s, 'shop10') ? 0.9 : 1);
export const catShopFactor = (s: Perks) => (hasPerk(s, 'catShop30') ? 0.7 : hasPerk(s, 'catShop20') ? 0.8 : hasPerk(s, 'catShop10') ? 0.9 : 1);
export const managerFactor = (s: Perks) => (hasPerk(s, 'managerDiscount15') ? 0.85 : hasPerk(s, 'managerDiscount10') ? 0.9 : hasPerk(s, 'managerDiscount5') ? 0.95 : 1);
export const zoomiesBonus = (s: Perks) => ['zoomies10', 'zoomies20', 'zoomies30'].filter((effect) => hasPerk(s, effect)).length * 10;
