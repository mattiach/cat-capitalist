import { newRun, type State } from './state.ts';

/** Each Angel Cat multiplies profit by this, so the bonus compounds: 1000 of them is about x1.4e11. */
export const ANGEL_GROWTH = 1.026;
export const angelMult = (angels: number) => ANGEL_GROWTH ** angels;
const ANGEL_SCALE = 2e12; // lower = Angel Cats come sooner
/** Angel Cats per tenfold of lifetime earnings: with the cap, the last one comes at about $2e37. */
const ANGELS_PER_DECADE = 40;
const MIN_ASCEND_ANGELS = 2;
const MIN_ASCEND_GROWTH = 0.1;
const MAX_ASCEND_FISH = 150;
/** Angel Cats stop at this many, gifts included. */
export const MAX_ANGELS = 1000;

export const angelsToClaim = (s: State) =>
  Math.max(0, Math.min(MAX_ANGELS - s.angels, Math.floor(ANGELS_PER_DECADE * Math.log10(1 + s.lifetime / ANGEL_SCALE)) - (s.angels - s.giftedAngels)));
/** Capped: uncapped, the big late-game claims made Golden Fish worthless. */
export const ascendFish = (claim: number) => Math.min(MAX_ASCEND_FISH, 5 * Math.floor(Math.sqrt(claim)));
export const canVisitHeaven = (s: State) => s.ascensions > 0 || angelsToClaim(s) > 0;

/** Smallest claim worth a reset: at least 2 Angel Cats and 10% of those already owned, or whatever is left under the cap. */
export const minAscendClaim = (s: State) =>
  Math.min(MAX_ANGELS - s.angels, Math.max(MIN_ASCEND_ANGELS, Math.ceil(s.angels * MIN_ASCEND_GROWTH)));
export const canAscend = (s: State) => angelsToClaim(s) > 0 && angelsToClaim(s) >= minAscendClaim(s);

/** Lifetime earnings needed to have earned `angels` Angel Cats in total. The margin beats float rounding in angelsToClaim. */
export const lifetimeForAngels = (angels: number) => ANGEL_SCALE * (10 ** (angels / ANGELS_PER_DECADE) - 1) * (1 + 1e-9);

/** Resets the run (money, businesses, managers, upgrades, investments, Zoomies); everything else is kept. Does nothing while the reward is too small. */
export function ascend(s: State): State {
  if (!canAscend(s)) return s;
  const claim = angelsToClaim(s);
  return { ...s, ...newRun(), angels: s.angels + claim, fish: s.fish + ascendFish(claim), ascensions: s.ascensions + 1 };
}
