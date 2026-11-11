// Pacing report. Run with: node src/logic/balance.ts
// A bot plays the real rules like an attentive player, then the run fails if a phase leaves its target window.
import { checkAwards, AWARDS } from './awards.ts';
import { canVisitCatShop, buyMysteryCat, catShopPrice } from './catShop.ts';
import { ACCESSORY_BONUS, accessoryCost, buyAccessory, buyListedCat, collectionBonus, findableCatCombos } from './collection.ts';
import { ACCESSORIES, ownsEveryAccessory } from './data/accessories.ts';
import { BUSINESSES, MAX_BUSINESS_LEVEL } from './data/businesses.ts';
import { FISH_CATS } from './data/cats.ts';
import { DIAMOND_CATS } from './data/diamonds.ts';
import { INVESTORS } from './data/investors.ts';
import { collectInvestment, investorProfit, investorsOpen, investorStatus, startInvestment } from './investors.ts';
import { SUPER_MANAGERS, SUPER_MULT } from './data/superManagers.ts';
import { PERMANENT_UPGRADES } from './data/permanentUpgrades.ts';
import { UPGRADES } from './data/upgrades.ts';
import { buy, buyPermanentUpgrade, buyUpgrade, cost, cycleTime, hire, hireSuper, managerCost, nextMilestone, permanentProfit, permanentUpgradeLock, superManagersOpen, tick, upgradeMult, YARN_BONUS } from './economy.ts';
import { fmt } from './format.ts';
import { angelMult, angelsToClaim, ascend, canAscend, MAX_ANGELS } from './prestige.ts';
import { newState, type State } from './state.ts';
import { buyTrack, MUSIC_TRACKS, ownsTrack, trackCost } from './music.ts';
import { isVictory } from './victory.ts';
import { catchStray } from './strays.ts';

const HOUR = 3600;
const LIMIT = 1200 * HOUR;
/** Share of stray cats the player actually catches. */
const CATCH_RATE = 0.5;
/** Ascend once the claim would multiply profit by this much. */
const ASCEND_GAIN = 2;
/** Most of its money the bot gives up for Diamonds and mystery cats, so they never starve the economy. */
const LUXURY_SHARE = 0.1;
/** Most of its money the bot puts into one investment. */
const INVEST_SHARE = 0.25;
/** Investors must stay a side income: fails the report above this share of lifetime earnings at $1 Qa, when they matter most. */
const MAX_INVESTOR_SHARE = 0.1;

let seed = 12345;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
// Rules that roll with Math.random get the seeded generator too, so every report comes out the same.
Math.random = rand;

const profit = (s: State) => angelMult(s.angels) * (1 + collectionBonus(s)) * permanentProfit(s);
const bizRate = (s: State, i: number, owned = s.biz[i].owned, mult = upgradeMult(s, i)) =>
  owned ? (BUSINESSES[i].revenue * owned * mult) / cycleTime(i, owned, s) : 0;

/** What the economy pays per second: managed businesses plus the one business the player keeps clicking. */
function income(s: State) {
  let total = 0;
  let manual = 0;
  s.biz.forEach((b, i) => {
    const r = bizRate(s, i);
    if (b.manager) total += r;
    else manual = Math.max(manual, r);
  });
  return (total + manual) * profit(s);
}

type Option = { cost: number; gain: number; apply: () => unknown };

/** Everything money can buy right now, with the income each one would add. */
function options(s: State, current: number): Option[] {
  const mult = profit(s);
  const list: Option[] = [];
  s.biz.forEach((b, i) => {
    if (b.owned < MAX_BUSINESS_LEVEL) {
      const next = nextMilestone(b.owned) ?? MAX_BUSINESS_LEVEL;
      for (const n of new Set([1, next - b.owned])) {
        if (n < 1) continue;
        const before = bizRate(s, i);
        const after = bizRate(s, i, b.owned + n);
        list.push({ cost: cost(i, b.owned, n), gain: b.manager || !s.biz.some((o) => o.manager) ? (after - before) * mult : (after - before) * mult * 0.2, apply: () => buy(s, i, n) });
      }
    }
    if (!b.manager && b.owned) list.push({ cost: managerCost(s, i), gain: Math.max(bizRate(s, i) * mult, current * 0.05), apply: () => hire(s, i) });
  });
  // The floor stands for the one-time reward, which is worth having even on a business that earns little.
  if (superManagersOpen(s)) SUPER_MANAGERS.forEach((m, i) => {
    if (!s.superManagers[i] && s.biz[i].owned) list.push({ cost: m.cost, gain: Math.max(bizRate(s, i) * mult * (SUPER_MULT - 1), current * 0.05), apply: () => hireSuper(s, i) });
  });
  UPGRADES.forEach((u, k) => {
    if (s.upgrades[k]) return;
    const gain = u.target === -1 ? current * 2 : (s.biz[u.target].manager ? bizRate(s, u.target) * mult * 2 : 0);
    if (gain > 0) list.push({ cost: u.cost, gain, apply: () => buyUpgrade(s, k) });
  });
  ACCESSORIES.forEach((a, k) => {
    if (s.accessories[k] || a.diamondCost || a.special || a.retired) return;
    const bonus = a.bonus ?? ACCESSORY_BONUS;
    const refund = a.reward?.kind === 'money' ? a.reward.amount! : 0;
    const gain = Math.max(current * (bonus / (1 + collectionBonus(s))), current * 0.002);
    const price = accessoryCost(s, k);
    list.push({ cost: Math.max(price - refund, price * 0.05), gain, apply: () => buyAccessory(s, k) });
  });
  return list;
}

function spend(s: State, current: number) {
  for (let guard = 0; guard < 200; guard++) {
    let best: Option | undefined;
    let score = Infinity;
    for (const option of options(s, current)) {
      const wait = Math.max(0, option.cost - s.money) / Math.max(current, 1e-9);
      const value = option.cost / option.gain + wait;
      if (value < score) { score = value; best = option; }
    }
    if (!best || best.cost > s.money || !best.apply()) return;
    current = income(s);
  }
}

function spendRare(s: State) {
  for (const k of PERMANENT_UPGRADES.keys()) if (!s.permanentUpgrades[k] && !permanentUpgradeLock(s, k)) buyPermanentUpgrade(s, k);
  const goal = PERMANENT_UPGRADES.findIndex((_, k) => !s.permanentUpgrades[k] && !permanentUpgradeLock(s, k));
  if (goal < 0) for (const c of [...FISH_CATS].sort((a, b) => a.price - b.price)) if (s.fish >= c.price) buyListedCat(s, c.breed, c.coat, rand);
  while (canVisitCatShop(s) && s.money * LUXURY_SHARE >= catShopPrice(s) && findableCatCombos(s).length) buyMysteryCat(s, rand);
  for (const track of MUSIC_TRACKS) if (!ownsTrack(s, track) && s.money * LUXURY_SHARE >= trackCost(s, track)) buyTrack(s, track.fileName);
  for (const [k, a] of ACCESSORIES.entries()) if (a.diamondCost && !s.accessories[k] && s.diamonds >= a.diamondCost) buyAccessory(s, k);
  for (const c of [...DIAMOND_CATS].sort((a, b) => a.price - b.price)) if (s.diamonds >= c.price) buyListedCat(s, c.breed, c.coat, rand);
}

const clock = (t: number) => (t < HOUR ? `${Math.round(t / 60)} min` : `${(t / HOUR).toFixed(1)} h`);

/** Plays until every goal is reached or the time limit runs out, returning when each goal was first met. */
function play() {
  const times = new Map<string, number>();
  const log = (label: string, cond: boolean, t: number) => { if (cond && !times.has(label)) times.set(label, t); };
  let s = newState();
  let t = 0;
  let nextStray = 30;
  let bonusCat = false;
  let runStart = 0;
  let investorEarnings = 0;
  let investorShare = 0;
  while (t < LIMIT) {
    const dt = t < 900 ? 0.5 : t < 4 * HOUR ? 2 : 10;
    // the player keeps clicking the best unmanaged business
    let click = -1;
    s.biz.forEach((b, i) => { if (b.owned && !b.manager && (click < 0 || bizRate(s, i) > bizRate(s, click))) click = i; });
    if (click >= 0) s.biz[click].running = true;
    tick(s, dt);
    t += dt;
    if (!bonusCat && t > 20) { bonusCat = true; s.money += YARN_BONUS; s.lifetime += YARN_BONUS; }
    if (t >= nextStray) {
      nextStray = t + 45 + rand() * 65;
      if (rand() < CATCH_RATE) catchStray(s, rand());
    }
    if (investorsOpen(s)) for (const investor of INVESTORS) {
      const now = t * 1000;
      if (collectInvestment(s, investor, now)) investorEarnings += investorProfit(investor);
      if (investorStatus(s, investor.id, now) === 'available' && s.money * INVEST_SHARE >= investor.cost) startInvestment(s, investor, now);
    }
    if (!investorShare && s.lifetime >= 1e15) investorShare = investorEarnings / s.lifetime;
    checkAwards(s);
    spendRare(s);
    spend(s, income(s));
    if (canAscend(s) && (angelMult(s.angels + angelsToClaim(s)) >= ASCEND_GAIN * angelMult(s.angels) || s.angels + angelsToClaim(s) === MAX_ANGELS)) {
      times.set(`run ${s.ascensions + 1} length`, t - runStart);
      s = ascend(s);
      runStart = t;
    }

    log('first manager', s.biz.some((b) => b.manager), t);
    for (const n of [2, 3, 5, 7, 10]) log(`${n} businesses unlocked`, s.biz.filter((b) => b.owned).length >= n, t);
    log('all managers', s.biz.every((b) => b.manager), t);
    log('first upgrade', s.upgrades.some(Boolean), t);
    log('Cat Shop open', canVisitCatShop(s), t);
    log('Heaven open', angelsToClaim(s) > 0 || s.ascensions > 0, t);
    log('can ascend', canAscend(s) || s.ascensions > 0, t);
    for (const n of [1, 2, 3, 5, 10, 20]) log(`ascension ${n}`, s.ascensions >= n, t);
    for (const [label, value] of [['$1 K', 1e3], ['$1 M', 1e6], ['$1 B', 1e9], ['$1 T', 1e12], ['$1 Qa', 1e15], ['$1 Qi', 1e18], ['$1 Sx', 1e21], ['$1 Sp', 1e24], ['$1 No', 1e30], ['$1e40', 1e40], ['$1e50', 1e50]] as const) log(`earned ${label}`, s.lifetime >= value, t);
    for (const n of [1, 5, 10, 50, 100]) log(`${n} diamonds found`, s.diamondsFound >= n, t);
    for (const n of [3, 5, 8, 12, 16, 32, 64]) log(`${n} cats`, s.cats.length >= n, t);
    log('first 6 permanent upgrades', PERMANENT_UPGRADES.slice(0, 6).every((_, k) => s.permanentUpgrades[k]), t);
    log('Golden Whiskers', s.permanentUpgrades[6], t);
    log('Turbo Tail', s.permanentUpgrades[7], t);
    log('all permanent upgrades', PERMANENT_UPGRADES.every((_, k) => s.permanentUpgrades[k]), t);
    log('all accessories', ownsEveryAccessory(s.accessories), t);
    log('half the awards', s.awards.filter(Boolean).length >= AWARDS.length / 2, t);
    log('all awards', AWARDS.every((_, k) => s.awards[k]), t);
    log('1000 angels', s.angels >= 1000, t);
    log('victory', isVictory(s), t);
    if (times.has('victory')) break;
  }
  return { times, s, t, investorShare };
}

const MIN = 60;
/** Target windows for the bot, in seconds. A real player is roughly 1.5-2x slower than it. */
const TARGETS: [phase: string, goal: string, from: number, to: number][] = [
  ['Opening', 'first manager', 0.5 * MIN, 5 * MIN],
  ['Opening', '3 businesses unlocked', 1.5 * MIN, 8 * MIN],
  ['Early', 'first upgrade', 6 * MIN, 25 * MIN],
  ['Early', 'earned $1 M', 6 * MIN, 30 * MIN],
  ['Early', '5 businesses unlocked', 10 * MIN, 35 * MIN],
  ['Early-mid', 'Cat Shop open', 15 * MIN, 45 * MIN],
  ['Early-mid', '5 cats', 30 * MIN, 75 * MIN],
  ['Mid', '8 cats', 1 * HOUR, 2.5 * HOUR],
  ['Mid', '12 cats', 1.5 * HOUR, 5 * HOUR],
  ['Early-mid', 'Heaven open', 90 * MIN, 210 * MIN],
  ['Early-mid', 'earned $1 B', 45 * MIN, 120 * MIN],
  ['Mid', 'can ascend', 90 * MIN, 240 * MIN],
  ['Mid', 'ascension 1', 3 * HOUR, 7 * HOUR],
  ['Mid', 'earned $1 T', 2.5 * HOUR, 7 * HOUR],
  ['Mid', '1 diamonds found', 20 * MIN, 15 * HOUR], // an early Legendary is a lucky surprise
  ['Mid-late', '10 businesses unlocked', 5 * HOUR, 20 * HOUR],
  ['Mid-late', 'ascension 3', 8 * HOUR, 20 * HOUR],
  ['Mid-late', 'earned $1 Qa', 10 * HOUR, 30 * HOUR],
  ['Mid-late', '5 diamonds found', 6 * HOUR, 40 * HOUR],
  ['Late', 'ascension 5', 10 * HOUR, 35 * HOUR],
  ['Late', 'first 6 permanent upgrades', 6 * HOUR, 30 * HOUR],
  ['Prestige', 'Golden Whiskers', 10 * HOUR, 40 * HOUR],
  ['Prestige', 'Turbo Tail', 12 * HOUR, 45 * HOUR],
  ['Prestige', 'all permanent upgrades', 15 * HOUR, 60 * HOUR],
  ['Late', 'earned $1 Qi', 12 * HOUR, 70 * HOUR],
  ['Late', '10 diamonds found', 11 * HOUR, 70 * HOUR],
  ['Late', 'ascension 10', 12 * HOUR, 80 * HOUR],
  ['Prestige', 'earned $1 Sp', 16 * HOUR, 140 * HOUR],
  ['Prestige', 'ascension 20', 19 * HOUR, 200 * HOUR],
  ['Prestige', 'all accessories', 20 * HOUR, 70 * HOUR],
  ['Prestige', '32 cats', 14 * HOUR, 300 * HOUR],
  ['Prestige', '64 cats', 30 * HOUR, 75 * HOUR],
  ['Prestige', '50 diamonds found', 20 * HOUR, 80 * HOUR],
  ['Prestige', '100 diamonds found', 20 * HOUR, Infinity],
  ['End', '1000 angels', 30 * HOUR, 75 * HOUR],
  // The whole game: a real player at 1.5-2x the bot lands around 80-120 h.
  ['End', 'victory', 40 * HOUR, 75 * HOUR],
];

const RUNS = 5;
const results = Array.from({ length: RUNS }, () => play());
const median = (goal: string) => {
  const values = results.map((r) => r.times.get(goal) ?? Infinity).sort((a, b) => a - b);
  return values[Math.floor(RUNS / 2)];
};

let failures = 0;
for (const [phase, goal, from, to] of TARGETS) {
  const at = median(goal);
  const ok = at >= from && at <= to;
  if (!ok) failures++;
  console.log(`${ok ? 'ok ' : 'OFF'} ${phase.padEnd(10)} ${goal.padEnd(26)} ${(at === Infinity ? 'never' : clock(at)).padEnd(9)} target ${clock(from)} - ${to === Infinity ? 'any' : clock(to)}`);
}
const lengths = results[0].times;
console.log(`\nrun lengths: ${[1, 2, 3, 5, 8, 12, 16, 20, 25, 30].map((n) => { const at = lengths.get(`run ${n} length`); return at === undefined ? '' : `#${n} ${clock(at)}`; }).filter(Boolean).join('  ')}`);
const { s, t, investorShare } = results[0];
console.log(`investors earned ${(investorShare * 100).toFixed(2)}% of lifetime earnings at $1 Qa`);
if (investorShare > MAX_INVESTOR_SHARE) failures++;
console.log(`seed 1 ended at ${clock(t)}: ${fmt(s.lifetime)} lifetime, ${s.ascensions} ascensions, ${fmt(s.angels).slice(1)} angels, ${s.fish} fish, ${s.diamonds} diamonds, ${s.cats.length} cats, levels ${Math.min(...s.biz.map((b) => b.owned))}-${Math.max(...s.biz.map((b) => b.owned))}`);
if (failures) throw new Error(`${failures} pacing target(s) missed`);
console.log('\npacing ok');
