import { MAX_ANGELS } from './prestige.ts';
import { collectionBonus } from './collection.ts';
import { BUSINESSES, MAX_BUSINESS_LEVEL, MILESTONES } from './data/businesses.ts';
import { UPGRADES } from './data/upgrades.ts';
import { managerFactor, PERMANENT_UPGRADES, zoomiesBonus } from './data/permanentUpgrades.ts';
import { angelMult } from './prestige.ts';
import { SUPER_MANAGERS, SUPER_MULT, SUPER_ZOOMIES_TIME, TUNA_CANNERY } from './data/superManagers.ts';
import { gainDiamonds, spend, type State } from './state.ts';

export const ZOOMIES_MULT = 7;
export const ZOOMIES_TIME = 30;
/** One-time gift from the bonus cat that walks by right after the first purchase. */
export const YARN_BONUS = 100;
export const zoomiesDuration = (s: State) => ZOOMIES_TIME + zoomiesBonus(s);
export const managerCost = (s: State, i: number) => Math.ceil(BUSINESSES[i].managerCost * managerFactor(s));

const reached = (owned: number) => MILESTONES.filter((m) => owned >= m).length;
export const nextMilestone = (owned: number) => MILESTONES.find((m) => owned < m);
const permanentMult = (s: State, field: 'profit' | 'speed') =>
  PERMANENT_UPGRADES.reduce((mult, upgrade, k) => (s.permanentUpgrades[k] ? mult * (upgrade[field] ?? 1) : mult), 1);
/** Multiplier from permanent upgrades alone. Each one multiplies independently of the others. */
export const permanentProfit = (s: State) => permanentMult(s, 'profit');
/** Milestones and each speed upgrade multiply independently, so Quick + Lightning Paws = x1.155 speed. */
export const cycleTime = (i: number, owned: number, s?: State) =>
  BUSINESSES[i].time / 2 ** reached(owned) / (s ? permanentMult(s, 'speed') : 1);
export const hasManager = (s: State) => s.biz.some((b) => b.manager);

export const profitMult = (s: State) =>
  angelMult(s.angels) * (1 + collectionBonus(s)) * permanentProfit(s) * (s.boost > 0 ? ZOOMIES_MULT : 1);
export const upgradeMult = (s: State, i: number) =>
  3 ** UPGRADES.filter((u, k) => s.upgrades[k] && (u.target === i || u.target === -1)).length * (s.superManagers[i] ? SUPER_MULT : 1);
export const revenue = (s: State, i: number) =>
  BUSINESSES[i].revenue * s.biz[i].owned * upgradeMult(s, i) * profitMult(s);
export const incomeRate = (s: State) =>
  s.biz.reduce((sum, b, i) => sum + (b.manager ? revenue(s, i) / cycleTime(i, b.owned, s) : 0), 0);

export function cost(i: number, owned: number, n: number) {
  const { baseCost, coef } = BUSINESSES[i];
  return (baseCost * coef ** owned * (coef ** n - 1)) / (coef - 1);
}

export function maxAffordable(i: number, owned: number, money: number) {
  if (owned >= MAX_BUSINESS_LEVEL) return 0;
  const { baseCost, coef } = BUSINESSES[i];
  let n = Math.floor(Math.log((money * (coef - 1)) / (baseCost * coef ** owned) + 1) / Math.log(coef));
  while (n > 0 && cost(i, owned, n) > money) n--; // float guard
  return Math.max(0, Math.min(n, MAX_BUSINESS_LEVEL - owned));
}

const MILESTONE_FISH = 5;
/** Buys n units. Every milestone reached for the first time ever pays MILESTONE_FISH Golden Fish. */
export function buy(s: State, i: number, n: number) {
  const b = s.biz[i];
  if (!Number.isInteger(n) || n < 1) return false;
  const amount = Math.min(n, MAX_BUSINESS_LEVEL - b.owned);
  if (amount < 1 || !spend(s, cost(i, b.owned, amount))) return false;
  b.owned += amount;
  s.fish += MILESTONE_FISH * Math.max(0, reached(b.owned) - reached(s.best[i]));
  if (i === TUNA_CANNERY && !s.best[i]) gainDiamonds(s, 1);
  s.best[i] = Math.max(s.best[i], b.owned);
  return true;
}

export function hire(s: State, i: number) {
  const b = s.biz[i];
  if (b.manager || !b.owned || !spend(s, managerCost(s, i))) return false;
  b.manager = true;
  s.cheatsUnlocked = true;
  return true;
}

/** Stays open after ascending: `best` is never reset. */
export const superManagersOpen = (s: State) => s.best[TUNA_CANNERY] > 0;

/** Boosts the business for good and pays the super manager's one-time reward. Needs the business owned in this run. */
export function hireSuper(s: State, i: number) {
  if (s.superManagers[i] || !s.biz[i].owned || !superManagersOpen(s) || !spend(s, SUPER_MANAGERS[i].cost)) return false;
  s.superManagers[i] = true;
  const { reward } = SUPER_MANAGERS[i];
  if (reward.kind === 'diamond') gainDiamonds(s, 1);
  if (reward.kind === 'zoomies') s.boost = Math.max(s.boost, SUPER_ZOOMIES_TIME);
  if (reward.kind === 'fish') s.fish += reward.amount;
  if (reward.kind === 'angel' && s.angels < MAX_ANGELS) {
    s.angels++;
    s.giftedAngels++;
  }
  return true;
}

/** What still blocks a permanent upgrade, for display; undefined once its requirements are met. */
export function permanentUpgradeLock(s: State, k: number) {
  const { ascensions, requires } = PERMANENT_UPGRADES[k];
  const missing = [
    ...(requires !== undefined && !s.permanentUpgrades[requires] ? [`Requires ${PERMANENT_UPGRADES[requires].name}`] : []),
    ...(s.ascensions < ascensions ? [`${s.ascensions}/${ascensions} ascensions`] : []),
  ];
  return missing.length ? missing.join(' · ') : undefined;
}

export function buyPermanentUpgrade(s: State, k: number) {
  const upgrade = PERMANENT_UPGRADES[k];
  if (!upgrade || s.permanentUpgrades[k] || permanentUpgradeLock(s, k) || s.fish < upgrade.cost) return false;
  s.fish -= upgrade.cost;
  s.permanentUpgrades[k] = true;
  return true;
}

export function buyUpgrade(s: State, k: number) {
  if (s.upgrades[k] || !spend(s, UPGRADES[k].cost)) return false;
  return (s.upgrades[k] = true);
}

/** Advances time by dt seconds. Also used for offline earnings. Returns money earned. */
export function tick(s: State, dt: number): number {
  // split at the end of Zoomies so the boost never covers more time than it lasted
  if (s.boost > 0 && dt > s.boost) {
    const b = s.boost;
    return tick(s, b) + tick(s, dt - b);
  }
  let earned = 0;
  s.biz.forEach((b, i) => {
    if (!b.owned || !(b.running || b.manager)) return;
    const t = cycleTime(i, b.owned, s);
    b.progress += dt;
    const cycles = b.manager ? Math.floor(b.progress / t) : Number(b.progress >= t);
    if (!cycles) return;
    earned += cycles * revenue(s, i);
    b.progress = b.manager ? b.progress - cycles * t : 0;
    b.running = false;
  });
  s.money += earned;
  s.lifetime += earned;
  s.boost = Math.max(0, s.boost - dt);
  return earned;
}
