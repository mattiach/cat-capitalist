import { INVESTORS, type Investor } from './data/investors.ts';
import { spend, type State } from './state.ts';

export type InvestorStatus = 'available' | 'investing' | 'ready' | 'cooldown';

/** The tab follows the hired super managers, which ascending keeps. */
export const INVESTORS_REQUIRED_SUPERS = 1;
export const investorsOpen = (s: State) => s.superManagers.filter(Boolean).length >= INVESTORS_REQUIRED_SUPERS;

export const investorReturn = (investor: Investor) => investor.trade ? 0 : investor.cost * (1 + investor.profitRate);
export const investorProfit = (investor: Investor) => investor.trade ? 0 : investor.cost * investor.profitRate;

/** Everything is worked out from absolute times, so investments and cooldowns keep running while the game is closed. */
export function investorStatus(s: State, id: string, now: number): InvestorStatus {
  const { readyAt, cooldownUntil } = s.investments[id] ?? {};
  if (readyAt !== undefined) return now >= readyAt ? 'ready' : 'investing';
  return cooldownUntil !== undefined && now < cooldownUntil ? 'cooldown' : 'available';
}

/** Seconds until the current wait ends, 0 if nothing is running. */
export function investorTimeLeft(s: State, id: string, now: number) {
  const { readyAt, cooldownUntil } = s.investments[id] ?? {};
  return Math.max(0, ((readyAt ?? cooldownUntil ?? now) - now) / 1000);
}

/** Pays the capital now and starts the wait. */
export function startInvestment(s: State, investor: Investor, now: number) {
  if (!investorsOpen(s) || investorStatus(s, investor.id, now) !== 'available' || !spend(s, investor.cost)) return false;
  s.investments[investor.id] = { readyAt: now + investor.minutes * 60000 };
  return true;
}

/** Pays the capital back with the profit; only the profit counts as earnings. A trade pays its fish or Diamonds instead. */
export function collectInvestment(s: State, investor: Investor, now: number) {
  if (investorStatus(s, investor.id, now) !== 'ready') return false;
  const { trade } = investor;
  if (trade) s[trade.currency] += trade.amount;
  if (trade?.currency === 'diamonds') s.diamondsFound += trade.amount;
  s.money += investorReturn(investor);
  s.lifetime += investorProfit(investor);
  s.investments[investor.id] = investor.cooldownMinutes ? { cooldownUntil: now + investor.cooldownMinutes * 60000 } : {};
  return true;
}

export const anyInvestmentReady = (s: State, now: number) => INVESTORS.some((investor) => investorStatus(s, investor.id, now) === 'ready');
