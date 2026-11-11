import { breedsFound, catRarity, diamondCat, fishCat, TOTAL_CAT_COMBINATIONS } from './collection.ts';
import { ownsEveryAccessory } from './data/accessories.ts';
import { BREEDS } from './data/cats.ts';
import { SUPER_MANAGERS } from './data/superManagers.ts';
import { PERMANENT_UPGRADES } from './data/permanentUpgrades.ts';
import { UPGRADES } from './data/upgrades.ts';
import type { IconName } from './data/iconNames.ts';
import { MUSIC_TRACKS, ownsTrack } from './music.ts';
import { MAX_ANGELS } from './prestige.ts';
import type { State } from './state.ts';

const count = (flags: boolean[]) => flags.filter(Boolean).length;

/** How the Awards tab groups its cards, in display order. */
export const AWARD_GROUPS = ['Earnings', 'Empire', 'Collection', 'Prestige', 'Diamonds'] as const;
export type AwardGroup = (typeof AWARD_GROUPS)[number];
type Award = { name: string; icon: IconName; desc: string; fish: number; group: AwardGroup; check: (s: State) => boolean };

/** Indexed by position in saved data: append new entries, never reorder. */
export const AWARDS: Award[] = [
  { name: 'First Purr', icon: 'coin', desc: 'Earn $1,000 in total', fish: 10, group: 'Earnings', check: (s) => s.lifetime >= 1e3 },
  { name: 'Millionaire Meow', icon: 'banknote', desc: 'Earn $1 M in total', fish: 15, group: 'Earnings', check: (s) => s.lifetime >= 1e6 },
  { name: 'Billionaire Paws', icon: 'bank', desc: 'Earn $1 B in total', fish: 25, group: 'Earnings', check: (s) => s.lifetime >= 1e9 },
  { name: 'Trillion Treats', icon: 'coins', desc: 'Earn $1 T in total', fish: 40, group: 'Earnings', check: (s) => s.lifetime >= 1e12 },
  { name: 'Cosmic Fortune', icon: 'galaxy', desc: 'Earn $1 Qa in total', fish: 60, group: 'Earnings', check: (s) => s.lifetime >= 1e15 },
  { name: 'Yarn Tycoon', icon: 'yarn', desc: 'Own 100 Yarn Ball Stands', fish: 15, group: 'Empire', check: (s) => s.biz[0].owned >= 100 },
  { name: 'Box Baron', icon: 'box', desc: 'Own 100 Cardboard Box Factories', fish: 25, group: 'Empire', check: (s) => s.biz[2].owned >= 100 },
  { name: 'Cats in Space', icon: 'rocket', desc: 'Unlock the Cat Space Program', fish: 50, group: 'Empire', check: (s) => s.biz[9].owned > 0 },
  { name: 'Middle Manager', icon: 'tie', desc: 'Hire your first manager', fish: 10, group: 'Empire', check: (s) => s.biz.some((b) => b.manager) },
  { name: 'Full Staff', icon: 'clipboard', desc: 'Hire all 10 managers', fish: 50, group: 'Empire', check: (s) => s.biz.every((b) => b.manager) },
  { name: 'Big Spender', icon: 'shoppingBag', desc: 'Buy 10 upgrades', fish: 25, group: 'Empire', check: (s) => count(s.upgrades) >= 10 },
  { name: 'Double Time', icon: 'bolt', desc: 'Own 25 of every business', fish: 40, group: 'Empire', check: (s) => s.biz.every((b) => b.owned >= 25) },
  { name: 'Fancy Feline', icon: 'pinkBow', desc: 'Own 3 accessories', fish: 10, group: 'Collection', check: (s) => count(s.accessories) >= 3 },
  { name: 'Runway Ready', icon: 'dress', desc: 'Own every accessory (Specials aside)', fish: 50, group: 'Collection', check: (s) => ownsEveryAccessory(s.accessories) },
  { name: 'New Friend', icon: 'catFace', desc: 'Find your first cat', fish: 15, group: 'Collection', check: (s) => s.cats.length >= 2 },
  { name: 'Cat Person', icon: 'catLove', desc: 'Own 5 cats', fish: 50, group: 'Collection', check: (s) => s.cats.length >= 5 },
  { name: 'Breed Hunter', icon: 'magnifier', desc: 'Discover 4 different breeds', fish: 40, group: 'Collection', check: (s) => breedsFound(s) >= 4 },
  { name: 'Pure Gold', icon: 'star', desc: 'Own a Legendary breed or coat', fish: 50, group: 'Collection', check: (s) => s.cats.some((c) => catRarity(c) === 3) },
  { name: 'Stray Whisperer', icon: 'paw', desc: 'Catch 10 stray cats', fish: 25, group: 'Collection', check: (s) => s.strays >= 10 },
  { name: 'Nine Lives', icon: 'halo', desc: 'Ascend to Cat Heaven', fish: 25, group: 'Prestige', check: (s) => s.ascensions > 0 },
  { name: 'First Sparkle', icon: 'diamond', desc: 'Find 1 Diamond', fish: 15, group: 'Diamonds', check: (s) => s.diamondsFound >= 1 },
  { name: 'Shiny Handful', icon: 'diamondRing', desc: 'Find 5 Diamonds', fish: 40, group: 'Diamonds', check: (s) => s.diamondsFound >= 5 },
  { name: 'Gem Collector', icon: 'pouch', desc: 'Find 10 Diamonds', fish: 75, group: 'Diamonds', check: (s) => s.diamondsFound >= 10 },
  { name: 'Diamond Hoard', icon: 'treasureChest', desc: 'Find 50 Diamonds', fish: 150, group: 'Diamonds', check: (s) => s.diamondsFound >= 50 },
  { name: 'Living Legend', icon: 'royalCrown', desc: 'Find 100 Diamonds', fish: 250, group: 'Diamonds', check: (s) => s.diamondsFound >= 100 },
  { name: 'Golden Empire', icon: 'medal', desc: 'Earn $1 Qi in total', fish: 75, group: 'Earnings', check: (s) => s.lifetime >= 1e18 },
  { name: 'Galactic Purrfection', icon: 'planet', desc: 'Earn $1 Sp in total', fish: 100, group: 'Earnings', check: (s) => s.lifetime >= 1e24 },
  { name: 'Yarn Universe', icon: 'comet', desc: 'Earn $1 No in total', fish: 125, group: 'Earnings', check: (s) => s.lifetime >= 1e30 },
  { name: 'Speed Demon', icon: 'racecar', desc: 'Own 100 of every business', fish: 75, group: 'Empire', check: (s) => s.biz.every((b) => b.owned >= 100) },
  { name: 'Upgrade Addict', icon: 'flask', desc: 'Own every upgrade in one life', fish: 125, group: 'Empire', check: (s) => count(s.upgrades) === UPGRADES.length },
  { name: 'Crazy Cat Person', icon: 'catWow', desc: 'Own 16 cats', fish: 75, group: 'Collection', check: (s) => s.cats.length >= 16 },
  { name: 'Full House', icon: 'house', desc: 'Discover every cat', fish: 150, group: 'Collection', check: (s) => new Set(s.cats.map((c) => `${c.breed}:${c.coat}`)).size >= TOTAL_CAT_COMBINATIONS },
  { name: 'Stray Saint', icon: 'catHalo', desc: 'Catch 100 stray cats', fish: 40, group: 'Collection', check: (s) => s.strays >= 100 },
  { name: 'DJ Whiskers', icon: 'headphones', desc: 'Own every music track', fish: 25, group: 'Collection', check: (s) => MUSIC_TRACKS.every((track) => ownsTrack(s, track)) },
  { name: 'Born Again', icon: 'dove', desc: 'Ascend 3 times', fish: 25, group: 'Prestige', check: (s) => s.ascensions >= 3 },
  { name: 'Old Soul', icon: 'flame', desc: 'Ascend 10 times', fish: 75, group: 'Prestige', check: (s) => s.ascensions >= 10 },
  { name: 'Heavenly Choir', icon: 'note', desc: 'Own 100 Angel Cats', fish: 25, group: 'Prestige', check: (s) => s.angels >= 100 },
  { name: 'Angel Army', icon: 'shield', desc: 'Own all 1,000 Angel Cats', fish: 75, group: 'Prestige', check: (s) => s.angels >= MAX_ANGELS },
  { name: 'Permanent Resident', icon: 'temple', desc: 'Own every permanent upgrade', fish: 75, group: 'Prestige', check: (s) => PERMANENT_UPGRADES.every((_, k) => s.permanentUpgrades[k]) },
  // Early game
  { name: 'Pocket Change', icon: 'coin', desc: 'Earn $100 K in total', fish: 5, group: 'Earnings', check: (s) => s.lifetime >= 1e5 },
  { name: 'Small Business', icon: 'shop', desc: 'Unlock 3 businesses', fish: 5, group: 'Empire', check: (s) => s.biz.filter((b) => b.owned).length >= 3 },
  { name: 'Shiny New Toy', icon: 'arrowUp', desc: 'Buy your first upgrade', fish: 5, group: 'Empire', check: (s) => count(s.upgrades) >= 1 },
  { name: 'Team Builder', icon: 'briefcase', desc: 'Hire 5 managers', fish: 10, group: 'Empire', check: (s) => s.biz.filter((b) => b.manager).length >= 5 },
  { name: 'Lucky Paws', icon: 'paw', desc: 'Catch your first stray cat', fish: 5, group: 'Collection', check: (s) => s.strays >= 1 },
  { name: 'Mystery Box', icon: 'box', desc: 'Buy a cat in the Cat Shop', fish: 10, group: 'Collection', check: (s) => s.catShopPurchases >= 1 },
  // Mid game
  { name: 'Tuna Magnate', icon: 'fish', desc: 'Own 200 Tuna Canneries', fish: 15, group: 'Empire', check: (s) => s.biz[1].owned >= 200 },
  { name: 'Super Boss', icon: 'royalCrown', desc: 'Hire your first super manager', fish: 15, group: 'Empire', check: (s) => s.superManagers.some(Boolean) },
  { name: 'Cat Dozen', icon: 'catLove', desc: 'Own 12 cats', fish: 20, group: 'Collection', check: (s) => s.cats.length >= 12 },
  { name: 'Fashion Week', icon: 'shoppingBag', desc: 'Own 25 accessories', fish: 20, group: 'Collection', check: (s) => count(s.accessories) >= 25 },
  { name: 'Gold Card', icon: 'fish', desc: 'Buy a Golden Fish cat', fish: 20, group: 'Collection', check: (s) => s.cats.some((c) => fishCat(c.breed, c.coat)) },
  { name: 'Five Lives', icon: 'halo', desc: 'Ascend 5 times', fish: 20, group: 'Prestige', check: (s) => s.ascensions >= 5 },
  { name: 'Forever Fan', icon: 'sparkle', desc: 'Own 10 permanent upgrades', fish: 20, group: 'Prestige', check: (s) => count(s.permanentUpgrades) >= 10 },
  // Late game
  { name: 'Breed Master', icon: 'magnifier', desc: 'Discover every breed', fish: 30, group: 'Collection', check: (s) => breedsFound(s) >= BREEDS.length },
  { name: 'Five Hundred Club', icon: 'bolt', desc: 'Own 500 of any business', fish: 30, group: 'Empire', check: (s) => s.biz.some((b) => b.owned >= 500) },
  { name: 'Diamond Darling', icon: 'diamond', desc: 'Buy a Diamond cat', fish: 30, group: 'Diamonds', check: (s) => s.cats.some((c) => diamondCat(c.breed, c.coat)) },
  { name: 'Angel Half-Choir', icon: 'catHalo', desc: 'Own 500 Angel Cats', fish: 25, group: 'Prestige', check: (s) => s.angels >= 500 },
  { name: 'Boardroom Royalty', icon: 'tie', desc: 'Hire all 10 super managers', fish: 50, group: 'Empire', check: (s) => SUPER_MANAGERS.every((_, k) => s.superManagers[k]) },
  { name: 'Decillion Dreams', icon: 'galaxy', desc: 'Earn $1e33 in total', fish: 60, group: 'Earnings', check: (s) => s.lifetime >= 1e33 },
];

/** Unlocks newly completed awards, pays their fish, returns them. */
export function checkAwards(s: State) {
  const unlocked = AWARDS.filter((a, i) => !s.awards[i] && a.check(s));
  for (const a of unlocked) {
    s.awards[AWARDS.indexOf(a)] = true;
    s.fish += a.fish;
  }
  return unlocked;
}
