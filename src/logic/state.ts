import { BUSINESSES } from './data/businesses.ts';
import { ACCESSORIES } from './data/accessories.ts';
import { hasPerk } from './data/permanentUpgrades.ts';

export type BizState = { owned: number; progress: number; running: boolean; manager: boolean };
export type Cat = { breed: number; coat: number; head: number; face: number; neck: number; starter?: boolean };
/** One investor's offer: `readyAt` while invested, `cooldownUntil` after collecting. Both are absolute times in ms. */
export type Investment = { readyAt?: number; cooldownUntil?: number };
export type State = {
  money: number;
  lifetime: number;
  angels: number;
  /** Angel Cats received as gifts: they don't count against the ones ascending can claim. */
  giftedAngels: number;
  fish: number;
  /** Rare permanent currency, kept across ascensions. */
  diamonds: number;
  /** Every Diamond ever received, spent or not; drives the Diamond awards. */
  diamondsFound: number;
  /** File names of purchased music tracks. */
  musicOwned: string[];
  /** File name of the chosen track; null means the free default. */
  musicSelected: string | null;
  musicOn: boolean;
  /** Plays owned tracks in random order instead of looping one. */
  musicShuffle: boolean;
  /** Player's audio levels, 0-1. */
  musicVolume: number;
  sfxVolume: number;
  /** Seconds of Zoomies left. */
  boost: number;
  biz: BizState[];
  /** Flag arrays indexed like UPGRADES / ACCESSORIES / AWARDS. */
  upgrades: boolean[];
  /** By investor id. Reset by ascending, so capital can't be carried into the next run. */
  investments: Record<string, Investment>;
  /** Permanent Heaven shop upgrades, retained across ascensions. */
  permanentUpgrades: boolean[];
  /** Hired super managers, indexed like BUSINESSES and retained across ascensions. */
  superManagers: boolean[];
  accessories: boolean[];
  /** Cheat codes already redeemed, kept across ascensions. */
  redeemedCheats: string[];
  /** Cheats unlock permanently after hiring the first manager. */
  cheatsUnlocked: boolean;
  awards: boolean[];
  /** Highest amount ever owned per business, so milestone fish pay out once. */
  best: number[];
  cats: Cat[];
  /** Number of mystery cats purchased, used for the shop's persistent price curve. */
  catShopPurchases: number;
  favorite: number;
  strays: number;
  ascensions: number;
  savedAt: number;
  buyMode: number;
  homeTourComplete: boolean;
  heavenTourComplete: boolean;
  yarnBonusAt: number;
  yarnBonusSpawned: boolean;
  yarnBonusClaimed: boolean;
  accessoryTipShown: boolean;
  /** The victory screen was shown once; Continue keeps playing without it. */
  victoryShown: boolean;
  /** Fish from lucky purchases not announced yet. */
  foundFish?: number;
  /** Discovery state by `<tab>:<id>`, kept across ascensions. Absent until the first sync in unlocks.ts. */
  unlocks?: Record<string, 'new' | 'seen'>;
};

/** The part of the state that ascending resets. */
export const newRun = () => ({
  money: 0,
  boost: 0,
  biz: BUSINESSES.map((_, i): BizState => ({ owned: i === 0 ? 1 : 0, progress: 0, running: false, manager: false })),
  upgrades: [] as boolean[],
  investments: {} as Record<string, Investment>,
});

export const newState = (): State => ({
  ...newRun(),
  lifetime: 0,
  angels: 0,
  giftedAngels: 0,
  fish: 0,
  diamonds: 0,
  diamondsFound: 0,
  musicOwned: [],
  musicSelected: null,
  musicOn: true,
  musicShuffle: true,
  musicVolume: 0.6,
  sfxVolume: 1,
  accessories: [],
  permanentUpgrades: [],
  superManagers: [],
  redeemedCheats: [],
  cheatsUnlocked: false,
  awards: [],
  best: BUSINESSES.map((_, i) => (i === 0 ? 1 : 0)),
  cats: [{ breed: 0, coat: 0, head: -1, face: -1, neck: -1, starter: true }],
  catShopPurchases: 0,
  favorite: 0,
  strays: 0,
  ascensions: 0,
  savedAt: Date.now(),
  buyMode: 3,
  homeTourComplete: false,
  heavenTourComplete: false,
  yarnBonusAt: 0,
  yarnBonusSpawned: false,
  yarnBonusClaimed: false,
  accessoryTipShown: false,
  victoryShown: false,
});

/** A fresh game that keeps only the player's audio preferences. Purchased songs are lost, like every other purchase. */
export const restartedState = (s: State): State => ({
  ...newState(),
  musicOn: s.musicOn,
  musicShuffle: s.musicShuffle,
  musicVolume: s.musicVolume,
  sfxVolume: s.sfxVolume,
});

export function spend(s: State, amount: number) {
  if (s.money < amount) return false;
  // Only purchases worth at least 1% of the player's money can pay out, so pocket-change clicks can't farm fish.
  const counts = amount >= s.money * 0.01;
  s.money -= amount;
  const chance = hasPerk(s, 'luckyFish2') ? 0.02 : hasPerk(s, 'luckyFish1') ? 0.01 : 0;
  if (counts && chance && Math.random() < chance) {
    const found = hasPerk(s, 'luckyFishDouble') ? 10 : 5;
    s.fish += found;
    s.foundFish = (s.foundFish ?? 0) + found;
  }
  return true;
}

export function gainDiamonds(s: State, amount: number) {
  s.diamonds += amount;
  s.diamondsFound += amount;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isBooleanOrNullArray = (value: unknown): value is (boolean | null)[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'boolean' || item === null);

/** Parses current or older save data without replacing a valid in-memory game on failure. */
export function parseSaveData(raw: string): State | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return undefined;
    if ('cheatsUnlocked' in parsed && typeof parsed.cheatsUnlocked !== 'boolean') return undefined;
    const s = { ...newState(), ...parsed } as State;
    if (!isFiniteNumber(s.money) || !isFiniteNumber(s.lifetime) || !isFiniteNumber(s.angels) || !isFiniteNumber(s.fish) || !isFiniteNumber(s.boost) || !Number.isInteger(s.giftedAngels) || s.giftedAngels < 0) return undefined;
    if (!Array.isArray(s.biz) || s.biz.length !== BUSINESSES.length || !s.biz.every((b) =>
      isRecord(b) && Number.isInteger(b.owned) && isFiniteNumber(b.progress) && typeof b.running === 'boolean' && typeof b.manager === 'boolean')) return undefined;
    if (('upgrades' in parsed && !isBooleanOrNullArray(parsed.upgrades)) || ('permanentUpgrades' in parsed && !isBooleanOrNullArray(parsed.permanentUpgrades)) || ('superManagers' in parsed && !isBooleanOrNullArray(parsed.superManagers)) || ('accessories' in parsed && !isBooleanOrNullArray(parsed.accessories)) || ('awards' in parsed && !isBooleanOrNullArray(parsed.awards))) return undefined;
    if ('upgrades' in parsed && Array.isArray(parsed.upgrades)) s.upgrades = parsed.upgrades.map((item) => item === true);
    if ('permanentUpgrades' in parsed && Array.isArray(parsed.permanentUpgrades)) s.permanentUpgrades = parsed.permanentUpgrades.map((item) => item === true);
    if ('superManagers' in parsed && Array.isArray(parsed.superManagers)) s.superManagers = parsed.superManagers.map((item) => item === true);
    if ('accessories' in parsed && Array.isArray(parsed.accessories)) s.accessories = parsed.accessories.map((item) => item === true);
    if ('awards' in parsed && Array.isArray(parsed.awards)) s.awards = parsed.awards.map((item) => item === true);
    if (!Number.isInteger(s.buyMode) || s.buyMode < 0 || s.buyMode > 3 || typeof s.homeTourComplete !== 'boolean' || typeof s.heavenTourComplete !== 'boolean' || !isFiniteNumber(s.yarnBonusAt) || typeof s.yarnBonusSpawned !== 'boolean' || typeof s.yarnBonusClaimed !== 'boolean') return undefined;
    if (!Array.isArray(s.best) || s.best.length !== BUSINESSES.length || !s.best.every((value) => Number.isInteger(value) && (value as number) >= 0)) return undefined;
    if (!Array.isArray(s.cats) || !s.cats.length || !s.cats.every((cat) =>
      isRecord(cat) && (!('starter' in cat) || typeof cat.starter === 'boolean') && Number.isInteger(cat.breed) && Number.isInteger(cat.coat) &&
      [cat.head, cat.face, cat.neck].every((value) => Number.isInteger(value) && (value as number) >= -1))) return undefined;
    if (s.cats[0].starter === undefined) s.cats[0].starter = true;
    s.cats.forEach((cat) => {
      for (const slot of ['head', 'face', 'neck'] as const) {
        const index = cat[slot];
        if (ACCESSORIES[index]?.retired) { cat[slot] = -1; continue; }
        const newSlot = ACCESSORIES[index]?.slot;
        if (index >= 0 && newSlot && newSlot !== slot) {
          if (cat[newSlot] < 0) cat[newSlot] = index;
          cat[slot] = -1;
        }
      }
    });
    if (!Number.isInteger(s.favorite) || s.favorite < 0 || s.favorite >= s.cats.length) return undefined;
    if (!Array.isArray(s.redeemedCheats) || !s.redeemedCheats.every((code) => typeof code === 'string')) return undefined;
    if (!('cheatsUnlocked' in parsed)) {
      s.cheatsUnlocked = s.biz.some((business) => business.manager) || s.redeemedCheats.includes('LION');
    }
    if (!('diamondsFound' in parsed)) s.diamondsFound = s.diamonds; // older saves: all we know about is what's left
    if (!Number.isInteger(s.diamonds) || s.diamonds < 0 || !Number.isInteger(s.diamondsFound) || s.diamondsFound < 0) return undefined;
    if (!Array.isArray(s.musicOwned) || !s.musicOwned.every((file) => typeof file === 'string') || (s.musicSelected !== null && typeof s.musicSelected !== 'string') || typeof s.musicOn !== 'boolean') return undefined;
    if (typeof s.musicShuffle !== 'boolean') s.musicShuffle = true;
    if (typeof s.victoryShown !== 'boolean') s.victoryShown = false;
    // A bad audio level isn't worth rejecting a save over: fall back to the default instead.
    const defaults = newState();
    for (const key of ['musicVolume', 'sfxVolume'] as const) {
      s[key] = isFiniteNumber(s[key]) ? Math.min(1, Math.max(0, s[key])) : defaults[key];
    }
    if (!isRecord(s.investments) || !Object.values(s.investments).every((item) => isRecord(item) && [item.readyAt, item.cooldownUntil].every((time) => time === undefined || isFiniteNumber(time)))) return undefined;
    if ('unlocks' in parsed && !(isRecord(parsed.unlocks) && Object.values(parsed.unlocks).every((status) => status === 'new' || status === 'seen'))) return undefined;
    if (!Number.isInteger(s.strays) || !Number.isInteger(s.ascensions) || !Number.isInteger(s.catShopPurchases) || s.catShopPurchases < 0 || !isFiniteNumber(s.savedAt)) return undefined;
    return s;
  } catch {
    return undefined;
  }
}

export function load(raw: string | null): State {
  return raw ? parseSaveData(raw) ?? newState() : newState();
}
