import type { SuperReward } from './data/superManagers.ts';
const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function fmt(n: number) {
  if (n < 1e6) return '$' + Math.floor(n).toLocaleString('en-US');
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIX.length) return '$' + n.toExponential(2);
  return `$${(n / 1000 ** tier).toFixed(2)} ${SUFFIX[tier]}`;
}

export const fmtTime = (sec: number) =>
  new Date(Math.ceil(Math.max(0, sec)) * 1000).toISOString().slice(11, 19);

export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Short form for tight spots: truncated, never rounded up, at most one decimal. */
export function fmtCompact(n: number) {
  if (n < 1000) return String(Math.floor(n));
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIX.length) return n.toExponential(1);
  return `${Math.floor((n / 1000 ** tier) * 10) / 10}${SUFFIX[tier]}`;
}

export const superRewardText = (reward: SuperReward) =>
  reward.kind === 'diamond' ? '1 Diamond' : reward.kind === 'angel' ? '1 Angel Cat' : reward.kind === 'zoomies' ? '60 s of Zoomies' : `${reward.amount} Golden Fish`;
