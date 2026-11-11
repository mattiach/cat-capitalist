import { BUSINESSES } from './businesses.ts';

const tier = (name: string, firstCost: number) =>
  BUSINESSES.map((b, i) => ({ name: `${name} ${b.name}`, target: i, cost: b.baseCost * firstCost }));
const TIERS = ['Organic', 'Gourmet', 'Royal'];

/**
 * Each upgrade triples profits of one business, or of all of them when target is -1.
 * Indexed by position in saved data: append new entries, never reorder.
 */
export const UPGRADES = [
  ...BUSINESSES.flatMap((b, i) =>
    // The floor keeps the Yarn Ball Stand's tiny price from making its upgrades a giveaway.
    TIERS.map((name, t) => ({ name: `${name} ${b.name}`, target: i, cost: Math.max(b.baseCost, 60) * 10 ** [3.8, 6.5, 9.5][t] })),
  ),
  { name: 'Catnip for Everyone', target: -1, cost: 3e11 },
  { name: 'Laser Show Parade', target: -1, cost: 1e17 },
  { name: 'Cat Nation', target: -1, cost: 1e22 },
  // Late game: these keep runs moving after the first 33 are gone.
  ...tier('Imperial', 1e15),
  ...tier('Cosmic', 1e21),
  { name: 'Feline Federation', target: -1, cost: 1e27 },
  { name: 'Whisker Galaxy', target: -1, cost: 1e30 },
  { name: 'Purring Universe', target: -1, cost: 1e33 },
  { name: 'The Infinite Nap', target: -1, cost: 1e37 },
];
