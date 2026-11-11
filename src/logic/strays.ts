import { STRAY_DIAMOND_CHANCE } from './data/diamonds.ts';
import { ZOOMIES_MULT, incomeRate, zoomiesDuration } from './economy.ts';
import { fmt } from './format.ts';
import { gainDiamonds, type State } from './state.ts';

/** Reward for clicking a stray cat: 10% 5 Golden Fish, 30% Zoomies, 1% a Diamond, 59% cash. Returns the message to show. */
export function catchStray(s: State, roll = Math.random()) {
  s.strays++;
  if (roll >= 1 - STRAY_DIAMOND_CHANCE) {
    gainDiamonds(s, 1);
    return 'A stray cat brought you a Diamond!';
  }
  if (roll < 0.1) {
    s.fish += 5;
    return '+5 Golden Fish!';
  }
  if (roll < 0.4) {
    const duration = zoomiesDuration(s);
    s.boost = duration;
    return `ZOOMIES! Profits x${ZOOMIES_MULT} for ${duration}s`;
  }
  const cash = Math.max(100, incomeRate(s) * 120, s.money * 0.15);
  s.money += cash;
  s.lifetime += cash;
  return `Found a lost wallet: +${fmt(cash)}`;
}
