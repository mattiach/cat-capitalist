import { BUSINESSES } from './data/businesses.ts';
import { managerCost } from './economy.ts';
import type { State } from './state.ts';

export const FREE_MANAGER_LEVEL = 25;
const EARLY_LIFETIME = 1e9;
const MANAGER_TIP_DELAY = 90;
const MANAGER_TIP_REPEAT = 240;

/** A player who reaches level 25 on the first business without a manager gets that manager for free. */
export function autoHireFirstManager(s: State) {
  const first = s.biz[0];
  if (first.manager || first.owned < FREE_MANAGER_LEVEL) return false;
  first.manager = true;
  s.cheatsUnlocked = true;
  return true;
}

/** The cheapest manager worth suggesting in the early game, or -1. */
export function managerTipTarget(s: State) {
  if (s.ascensions > 0 || s.lifetime >= EARLY_LIFETIME) return -1;
  let best = -1;
  s.biz.forEach((b, i) => {
    if (b.owned && !b.manager && (best < 0 || managerCost(s, i) < managerCost(s, best))) best = i;
  });
  return best;
}

/** True on the whole seconds a tip should show, counted since the player last hired or the target changed. */
export const managerTipDue = (seconds: number) =>
  seconds >= MANAGER_TIP_DELAY && (seconds - MANAGER_TIP_DELAY) % MANAGER_TIP_REPEAT === 0;

export function managerTipMessage(s: State, i: number, price: string) {
  const { manager, name } = BUSINESSES[i];
  return s.money >= managerCost(s, i)
    ? `${manager} can run your ${name} for ${price}. Open Managers to hire them!`
    : `Save ${price} to hire ${manager}: your ${name} will then earn on its own.`;
}

export const accessoryTipDue = (s: State) =>
  !s.accessoryTipShown && s.ascensions === 0 && s.accessories.some(Boolean);
