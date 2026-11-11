import type { Cat } from '../state.ts';

export type Investor = {
  /** Key in the save: never rename one. */
  id: string;
  name: string;
  description: string;
  look: Cat;
  cost: number;
  /** Profit as a share of the capital: 0.25 returns the capital plus 25%. Ignored when `trade` is set. */
  profitRate: number;
  /** An exchange instead of an investment: the capital is spent and this pays out instead. */
  trade?: { currency: 'fish' | 'diamonds'; amount: number };
  /** Minutes until the return can be collected, 5 to 60. */
  minutes: number;
  /** Minutes after collecting before the same offer returns; 0 means right away. */
  cooldownMinutes: number;
};

// Add a row to add an investor. Tuned against logic/balance.ts: run `node src/logic/balance.ts` after any change here.
export const INVESTORS: Investor[] = [
  { id: 'penny', name: 'Penny Whiskers', description: 'Lends yarn to knitters, with interest.', look: { breed: 0, coat: 5, head: 0, face: 2, neck: -1 }, cost: 5e9, profitRate: 0.08, minutes: 5, cooldownMinutes: 0 },
  { id: 'gus', name: 'Gus the Broker', description: 'Trades milk futures from a warm windowsill.', look: { breed: 1, coat: 3, head: 3, face: -1, neck: 4 }, cost: 50e9, profitRate: 0.12, minutes: 10, cooldownMinutes: 0 },
  { id: 'tabitha', name: 'Tabitha Bond', description: 'Sells bonds backed by cardboard boxes.', look: { breed: 3, coat: 1, head: -1, face: 5, neck: -1 }, cost: 500e9, profitRate: 0, trade: { currency: 'fish', amount: 5 }, minutes: 15, cooldownMinutes: 50 },
  { id: 'rusty', name: 'Rusty Ledger', description: 'Buys up catnip fields before the harvest.', look: { breed: 5, coat: 4, head: 8, face: -1, neck: -1 }, cost: 5e12, profitRate: 0.25, minutes: 20, cooldownMinutes: 5 },
  { id: 'coco', name: 'Coco Dividend', description: 'Opens a cat café on every sunny corner.', look: { breed: 2, coat: 0, head: 6, face: -1, neck: 7 }, cost: 100e12, profitRate: 0, trade: { currency: 'fish', amount: 5 }, minutes: 30, cooldownMinutes: 100 },
  { id: 'marlin', name: 'Marlin Fundsworth', description: 'Runs a hedge fund for deep-sea tuna.', look: { breed: 4, coat: 3, head: 8, face: 2, neck: -1 }, cost: 2e15, profitRate: 0, trade: { currency: 'fish', amount: 10 }, minutes: 30, cooldownMinutes: 160 },
  { id: 'sable', name: 'Sable Venture', description: 'Backs bold startups that scratch things.', look: { breed: 6, coat: 1, head: -1, face: 9, neck: 4 }, cost: 100e15, profitRate: 0, trade: { currency: 'diamonds', amount: 1 }, minutes: 40, cooldownMinutes: 50 },
  { id: 'vector', name: 'Vector Sterling', description: 'Funds laser research. The dot must fall.', look: { breed: 5, coat: 2, head: -1, face: 9, neck: 7 }, cost: 10e21, profitRate: 0, trade: { currency: 'diamonds', amount: 2 }, minutes: 60, cooldownMinutes: 60 },
];
